"""
Execution management routes.

Endpoints for executing crews and managing execution status.
"""

import asyncio
from datetime import datetime
from typing import Dict

from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.config import settings
from app.models import (
    ApproveExecutionRequest,
    CrewCategory,
    ExecuteCrewRequest,
    ExecutionOutput,
    ExecutionStatus,
    ExecutionStatusResponse,
)

router = APIRouter()

# =============================================================================
# In-Memory Execution Store (Replace with Redis/DB in production)
# =============================================================================

# Stores execution state by execution_id
executions: Dict[str, ExecutionStatusResponse] = {}


# =============================================================================
# Helper Functions
# =============================================================================


async def send_callback_to_nextjs(execution_id: str, data: dict):
    """Send progress/completion callback to Next.js app."""
    if not settings.nextjs_app_url:
        return

    import httpx

    callback_url = f"{settings.nextjs_app_url}/api/crews/callback"

    try:
        async with httpx.AsyncClient() as client:
            headers = {}
            if settings.nextjs_callback_secret:
                headers["X-Callback-Secret"] = settings.nextjs_callback_secret

            await client.post(
                callback_url,
                json={"execution_id": execution_id, **data},
                headers=headers,
                timeout=10.0,
            )
    except Exception as e:
        print(f"⚠️ Failed to send callback for {execution_id}: {e}")


async def execute_crew_task(
    execution_id: str,
    crew_type: CrewCategory,
    request: ExecuteCrewRequest,
):
    """
    Execute a crew task in the background.

    This is where the actual CrewAI execution happens.
    """
    try:
        # Update status to running
        executions[execution_id].status = ExecutionStatus.RUNNING
        executions[execution_id].started_at = datetime.utcnow()

        await send_callback_to_nextjs(
            execution_id,
            {
                "status": ExecutionStatus.RUNNING.value,
                "progress_percent": 0,
                "current_step": "Initializing crew...",
            },
        )

        # Import crew module based on type
        if crew_type == CrewCategory.RESEARCH:
            from app.crews.research_crew import execute_research

            result = await execute_research(
                execution_id=execution_id,
                task_data=request.task.model_dump(),
                user_context=request.user_context.model_dump(),
                progress_callback=lambda p, s: update_progress(execution_id, p, s),
            )
        elif crew_type == CrewCategory.WRITING:
            from app.crews.writer_crew import execute_writing

            result = await execute_writing(
                execution_id=execution_id,
                task_data=request.task.model_dump(),
                user_context=request.user_context.model_dump(),
                progress_callback=lambda p, s: update_progress(execution_id, p, s),
            )
        elif crew_type == CrewCategory.DATA:
            from app.crews.data_crew import execute_data_analysis

            result = await execute_data_analysis(
                execution_id=execution_id,
                task_data=request.task.model_dump(),
                user_context=request.user_context.model_dump(),
                progress_callback=lambda p, s: update_progress(execution_id, p, s),
            )
        elif crew_type == CrewCategory.COMMUNICATION:
            from app.crews.communication_crew import execute_communication

            result = await execute_communication(
                execution_id=execution_id,
                task_data=request.task.model_dump(),
                user_context=request.user_context.model_dump(),
                progress_callback=lambda p, s: update_progress(execution_id, p, s),
            )
        else:
            raise ValueError(f"Unknown crew type: {crew_type}")

        # Update with completion
        executions[execution_id].status = ExecutionStatus.COMPLETED
        executions[execution_id].progress_percent = 100
        executions[execution_id].current_step = "Complete"
        executions[execution_id].completed_at = datetime.utcnow()
        executions[execution_id].output = result

        await send_callback_to_nextjs(
            execution_id,
            {
                "status": ExecutionStatus.COMPLETED.value,
                "progress_percent": 100,
                "current_step": "Complete",
                "output": result.model_dump() if result else None,
            },
        )

    except Exception as e:
        print(f"❌ Execution {execution_id} failed: {e}")
        executions[execution_id].status = ExecutionStatus.FAILED
        executions[execution_id].error_message = str(e)
        executions[execution_id].completed_at = datetime.utcnow()

        await send_callback_to_nextjs(
            execution_id,
            {
                "status": ExecutionStatus.FAILED.value,
                "error_message": str(e),
            },
        )


def update_progress(execution_id: str, progress: int, step: str):
    """Update execution progress (called by crew during execution)."""
    if execution_id in executions:
        executions[execution_id].progress_percent = progress
        executions[execution_id].current_step = step

        # Fire-and-forget callback
        asyncio.create_task(
            send_callback_to_nextjs(
                execution_id,
                {
                    "status": ExecutionStatus.RUNNING.value,
                    "progress_percent": progress,
                    "current_step": step,
                },
            )
        )


# =============================================================================
# Routes
# =============================================================================


@router.post("/execute", response_model=ExecutionStatusResponse)
async def execute_crew(
    request: ExecuteCrewRequest,
    background_tasks: BackgroundTasks,
):
    """
    Execute a crew for the given task.

    This endpoint starts the crew execution in the background and returns
    immediately with the execution ID. Use GET /status/{execution_id} to
    check progress.

    The crew will send progress callbacks to the Next.js app during execution.
    """
    execution_id = request.execution_id

    # Check if execution already exists
    if execution_id in executions:
        return executions[execution_id]

    # Create execution record
    execution = ExecutionStatusResponse(
        execution_id=execution_id,
        status=ExecutionStatus.RUNNING,
        progress_percent=0,
        current_step="Starting execution...",
    )
    executions[execution_id] = execution

    # Start background execution
    background_tasks.add_task(
        execute_crew_task,
        execution_id,
        request.crew_type,
        request,
    )

    return execution


@router.get("/status/{execution_id}", response_model=ExecutionStatusResponse)
async def get_execution_status(execution_id: str):
    """
    Get the current status of an execution.

    Returns progress percentage, current step, and output (if completed).
    """
    if execution_id not in executions:
        raise HTTPException(status_code=404, detail="Execution not found")

    return executions[execution_id]


@router.post("/approve/{execution_id}", response_model=ExecutionStatusResponse)
async def approve_execution(
    execution_id: str,
    request: ApproveExecutionRequest,
    background_tasks: BackgroundTasks,
):
    """
    Approve a pending execution.

    For high-risk tasks that require approval before execution.
    """
    if execution_id not in executions:
        raise HTTPException(status_code=404, detail="Execution not found")

    execution = executions[execution_id]

    if execution.status != ExecutionStatus.PENDING_APPROVAL:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve execution with status: {execution.status}",
        )

    # Update status to approved
    execution.status = ExecutionStatus.APPROVED

    # TODO: Start the actual execution after approval
    # This would require storing the original request

    return execution


@router.post("/cancel/{execution_id}", response_model=ExecutionStatusResponse)
async def cancel_execution(execution_id: str):
    """
    Cancel a running or pending execution.
    """
    if execution_id not in executions:
        raise HTTPException(status_code=404, detail="Execution not found")

    execution = executions[execution_id]

    if execution.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel execution with status: {execution.status}",
        )

    execution.status = ExecutionStatus.CANCELLED
    execution.completed_at = datetime.utcnow()

    await send_callback_to_nextjs(
        execution_id,
        {"status": ExecutionStatus.CANCELLED.value},
    )

    return execution
