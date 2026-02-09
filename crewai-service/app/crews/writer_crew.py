"""
Writer Crew - Content creation and document drafting.

This crew consists of:
- Content Strategist: Plans content structure and key points
- Writer: Drafts the content
- Editor: Reviews and refines the draft
"""

import asyncio
from typing import Any, Callable, Optional

from crewai import Agent, Crew, Process, Task

from app.config import settings
from app.crews.base_crew import ProgressTracker, build_user_context_string, get_llm
from app.models import Artifact, ExecutionOutput


async def execute_writing(
    execution_id: str,
    task_data: dict[str, Any],
    user_context: dict[str, Any],
    progress_callback: Optional[Callable[[int, str], None]] = None,
) -> ExecutionOutput:
    """
    Execute the writing crew for the given task.

    Args:
        execution_id: Unique execution identifier
        task_data: Task information (id, title, description)
        user_context: User context for personalization
        progress_callback: Optional callback for progress updates

    Returns:
        ExecutionOutput with summary and artifacts
    """
    tracker = ProgressTracker(
        execution_id=execution_id,
        callback=progress_callback,
        total_steps=5,
    )

    tracker.update("Creating writing crew...")

    llm = get_llm()
    context_str = build_user_context_string(user_context)

    # Define agents
    strategist = Agent(
        role="Content Strategist",
        goal="Plan engaging content that meets the user's needs",
        backstory=f"""You are an expert content strategist who understands how to
        structure content for maximum impact. User context: {context_str}""",
        llm=llm,
        verbose=settings.crewai_verbose,
    )

    writer = Agent(
        role="Professional Writer",
        goal="Create clear, engaging, and well-written content",
        backstory="""You are a skilled writer who can adapt your tone and style
        to different audiences and purposes. You write clearly and concisely.""",
        llm=llm,
        verbose=settings.crewai_verbose,
    )

    editor = Agent(
        role="Editor",
        goal="Polish and refine content for clarity and impact",
        backstory="""You are a meticulous editor with an eye for detail. You improve
        flow, fix errors, and ensure content is professional and polished.""",
        llm=llm,
        verbose=settings.crewai_verbose,
    )

    # Define tasks
    planning_task = Task(
        description=f"""Create a content plan for:

        Topic: {task_data['title']}
        Details: {task_data.get('description', 'No additional details')}

        Provide:
        1. Target audience
        2. Key message/thesis
        3. Outline with main sections
        4. Tone and style recommendations
        """,
        agent=strategist,
        expected_output="A content plan with audience, message, outline, and tone guidance",
    )

    writing_task = Task(
        description="""Write the content based on the strategy plan.

        Requirements:
        - Follow the outline provided
        - Use the recommended tone
        - Include relevant examples or evidence
        - Keep it engaging and readable
        """,
        agent=writer,
        expected_output="A complete draft of the content",
        context=[planning_task],
    )

    editing_task = Task(
        description="""Review and polish the draft.

        Focus on:
        - Clarity and flow
        - Grammar and punctuation
        - Consistency in tone
        - Formatting

        Provide the final, polished version.
        """,
        agent=editor,
        expected_output="A polished, final version of the content in markdown format",
        context=[writing_task],
    )

    tracker.update("Planning content structure...")

    crew = Crew(
        agents=[strategist, writer, editor],
        tasks=[planning_task, writing_task, editing_task],
        process=Process.sequential,
        verbose=settings.crewai_verbose,
    )

    tracker.update("Writing content...")

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, crew.kickoff)

    tracker.update("Editing and polishing...")

    raw_output = str(result) if result else ""

    output = ExecutionOutput(
        summary=f"Content created for: {task_data['title']}",
        artifacts=[
            Artifact(
                type="markdown",
                title=task_data["title"],
                content=raw_output,
            )
        ],
        raw_output=raw_output,
    )

    tracker.complete("Content creation complete!")

    return output
