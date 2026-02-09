"""
Communication Crew - Email drafting and scheduling.

This crew consists of:
- Email Composer: Drafts professional communications
- Scheduler: Handles meeting scheduling and calendar management

Note: This is a HIGH RISK crew that requires approval before execution.
"""

import asyncio
from typing import Any, Callable, Optional

from crewai import Agent, Crew, Process, Task

from app.config import settings
from app.crews.base_crew import ProgressTracker, build_user_context_string, get_llm
from app.models import Artifact, ExecutionOutput


async def execute_communication(
    execution_id: str,
    task_data: dict[str, Any],
    user_context: dict[str, Any],
    progress_callback: Optional[Callable[[int, str], None]] = None,
) -> ExecutionOutput:
    """
    Execute the communication crew for the given task.

    WARNING: This crew can send emails and create calendar events on behalf of the user.
    It should require approval before execution.

    Args:
        execution_id: Unique execution identifier
        task_data: Task information (id, title, description)
        user_context: User context for personalization
        progress_callback: Optional callback for progress updates

    Returns:
        ExecutionOutput with summary and artifacts (drafts for review)
    """
    tracker = ProgressTracker(
        execution_id=execution_id,
        callback=progress_callback,
        total_steps=4,
    )

    tracker.update("Creating communication crew...")

    llm = get_llm()
    context_str = build_user_context_string(user_context)

    # Define agents
    composer = Agent(
        role="Email Composer",
        goal="Draft professional, clear, and effective communications",
        backstory=f"""You are an expert at writing professional emails and messages.
        You adapt your tone based on the recipient and purpose. User context: {context_str}""",
        llm=llm,
        verbose=settings.crewai_verbose,
    )

    scheduler = Agent(
        role="Meeting Scheduler",
        goal="Efficiently schedule meetings and manage calendar invitations",
        backstory="""You specialize in scheduling and coordination. You write clear
        meeting invitations and ensure all necessary details are included.""",
        llm=llm,
        verbose=settings.crewai_verbose,
    )

    # Determine the type of communication task
    task_title = task_data["title"].lower()
    is_meeting = any(word in task_title for word in ["meeting", "schedule", "calendar", "invite"])

    if is_meeting:
        # Meeting scheduling task
        main_task = Task(
            description=f"""Create a meeting invitation for:

            Task: {task_data['title']}
            Details: {task_data.get('description', 'No additional details')}

            Provide:
            1. Meeting subject line
            2. Meeting description/agenda
            3. Suggested duration
            4. List of attendees (if mentioned)
            5. Any preparation notes for attendees
            """,
            agent=scheduler,
            expected_output="A complete meeting invitation draft with subject, description, and details",
        )
    else:
        # Email composition task
        main_task = Task(
            description=f"""Draft an email for:

            Task: {task_data['title']}
            Details: {task_data.get('description', 'No additional details')}

            Provide:
            1. Subject line
            2. Email body
            3. Appropriate greeting and closing
            4. Call to action (if applicable)

            Format for easy copying into an email client.
            """,
            agent=composer,
            expected_output="A complete email draft with subject, greeting, body, and closing",
        )

    review_task = Task(
        description="""Review the draft for:

        1. Professional tone
        2. Clarity and conciseness
        3. Proper formatting
        4. Any missing information

        Provide the final polished version ready for sending.
        Include a note about what action will be taken (email sent, meeting created).
        """,
        agent=composer if is_meeting else scheduler,
        expected_output="A polished communication draft ready for user approval",
        context=[main_task],
    )

    tracker.update("Composing communication...")

    crew = Crew(
        agents=[composer, scheduler],
        tasks=[main_task, review_task],
        process=Process.sequential,
        verbose=settings.crewai_verbose,
    )

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, crew.kickoff)

    tracker.update("Finalizing draft...")

    raw_output = str(result) if result else ""

    # Note: In production, this would NOT automatically send
    # The draft is returned for user approval first
    artifact_type = "meeting_draft" if is_meeting else "email_draft"
    artifact_title = f"Meeting Invitation: {task_data['title']}" if is_meeting else f"Email Draft: {task_data['title']}"

    output = ExecutionOutput(
        summary=f"{'Meeting invitation' if is_meeting else 'Email'} drafted for: {task_data['title']}. Awaiting approval to send.",
        artifacts=[
            Artifact(
                type=artifact_type,
                title=artifact_title,
                content=raw_output,
            )
        ],
        raw_output=raw_output,
    )

    tracker.complete("Draft ready for approval!")

    return output
