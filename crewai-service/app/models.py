"""
Pydantic models for API request/response validation.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class CrewCategory(str, Enum):
    """Types of crews available."""

    RESEARCH = "RESEARCH"
    WRITING = "WRITING"
    DATA = "DATA"
    COMMUNICATION = "COMMUNICATION"


class RiskLevel(str, Enum):
    """Risk levels for task execution."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ExecutionStatus(str, Enum):
    """Status of a crew execution."""

    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


# =============================================================================
# Request Models
# =============================================================================


class TaskInput(BaseModel):
    """Task information for crew execution."""

    id: str = Field(..., description="Task ID from Questive")
    title: str = Field(..., description="Task title")
    description: Optional[str] = Field(None, description="Task description/notes")


class UserContext(BaseModel):
    """User context to personalize agent behavior."""

    skills: list[str] = Field(default_factory=list, description="User's skills")
    experience: Optional[str] = Field(None, description="Experience level")
    preferences: dict[str, Any] = Field(
        default_factory=dict, description="Additional preferences"
    )


class ExecuteCrewRequest(BaseModel):
    """Request to execute a crew for a task."""

    execution_id: str = Field(..., description="Execution ID from Questive database")
    crew_type: CrewCategory = Field(..., description="Type of crew to execute")
    task: TaskInput = Field(..., description="Task to execute")
    user_context: UserContext = Field(
        default_factory=UserContext, description="User context for personalization"
    )


class ApproveExecutionRequest(BaseModel):
    """Request to approve a pending execution."""

    approved_by: Optional[str] = Field(None, description="User ID who approved")


# =============================================================================
# Response Models
# =============================================================================


class Artifact(BaseModel):
    """An artifact produced by crew execution."""

    type: str = Field(..., description="Artifact type: markdown, doc_link, sheet_link")
    title: Optional[str] = Field(None, description="Artifact title")
    content: Optional[str] = Field(None, description="Artifact content (for markdown)")
    url: Optional[str] = Field(None, description="Artifact URL (for links)")


class ExecutionOutput(BaseModel):
    """Output from a completed crew execution."""

    summary: str = Field(..., description="Summary of what was accomplished")
    artifacts: list[Artifact] = Field(
        default_factory=list, description="Artifacts produced"
    )
    raw_output: Optional[str] = Field(None, description="Raw output from CrewAI")


class ExecutionStatusResponse(BaseModel):
    """Response with execution status and progress."""

    execution_id: str = Field(..., description="Execution ID")
    status: ExecutionStatus = Field(..., description="Current status")
    progress_percent: int = Field(0, ge=0, le=100, description="Progress percentage")
    current_step: Optional[str] = Field(None, description="Current step description")
    output: Optional[ExecutionOutput] = Field(
        None, description="Output (when completed)"
    )
    error_message: Optional[str] = Field(None, description="Error message (when failed)")
    started_at: Optional[datetime] = Field(None, description="Execution start time")
    completed_at: Optional[datetime] = Field(None, description="Execution completion time")


class CrewInfo(BaseModel):
    """Information about an available crew."""

    category: CrewCategory = Field(..., description="Crew category")
    name: str = Field(..., description="Human-readable name")
    description: str = Field(..., description="What the crew does")
    icon: str = Field(..., description="Emoji icon")
    risk_level: RiskLevel = Field(..., description="Default risk level")
    capabilities: list[str] = Field(..., description="List of capabilities")
    available: bool = Field(True, description="Whether crew is available")
    unavailable_reason: Optional[str] = Field(
        None, description="Why crew is unavailable"
    )


class CrewListResponse(BaseModel):
    """Response listing available crews."""

    crews: list[CrewInfo] = Field(..., description="List of available crews")


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(..., description="Service status: ok, degraded, error")
    version: str = Field(..., description="Service version")
    gemini_available: bool = Field(..., description="Gemini API availability")
    search_available: bool = Field(..., description="Search API availability")
    gmail_available: bool = Field(..., description="Gmail API availability")
    docs_available: bool = Field(..., description="Google Docs API availability")
    sheets_available: bool = Field(..., description="Google Sheets API availability")


# =============================================================================
# Callback Models (sent to Next.js)
# =============================================================================


class ProgressCallback(BaseModel):
    """Progress update sent to Next.js during execution."""

    execution_id: str
    progress_percent: int
    current_step: str
    status: ExecutionStatus = ExecutionStatus.RUNNING


class CompletionCallback(BaseModel):
    """Completion notification sent to Next.js."""

    execution_id: str
    status: ExecutionStatus
    output: Optional[ExecutionOutput] = None
    error_message: Optional[str] = None
