"""
Research Crew - Web search, information gathering, and summarization.

This crew consists of:
- Senior Researcher: Searches the web and gathers information
- Research Analyst: Analyzes and synthesizes findings into reports
"""

import asyncio
from typing import Any, Callable, Optional

from crewai import Agent, Crew, Process, Task

from app.config import settings
from app.crews.base_crew import ProgressTracker, build_user_context_string, get_llm
from app.models import Artifact, ExecutionOutput


def create_research_crew(
    task_data: dict[str, Any],
    user_context: dict[str, Any],
) -> Crew:
    """
    Create a research crew for the given task.

    Args:
        task_data: Task information (id, title, description)
        user_context: User context for personalization

    Returns:
        Configured CrewAI Crew instance
    """
    llm = get_llm()
    context_str = build_user_context_string(user_context)

    # Define agents
    researcher = Agent(
        role="Senior Researcher",
        goal="Find accurate, current, and comprehensive information on the given topic",
        backstory=f"""You are an experienced researcher with excellent skills in finding
        and evaluating online information. You excel at identifying credible sources
        and extracting key insights. You adapt your research style based on the user's
        background: {context_str}""",
        llm=llm,
        verbose=settings.crewai_verbose,
        max_iter=settings.crewai_max_iterations,
        # Tools will be added when available
        tools=[],
    )

    analyst = Agent(
        role="Research Analyst",
        goal="Synthesize research findings into clear, actionable insights",
        backstory="""You specialize in analyzing research and creating well-structured
        summaries. You excel at identifying patterns, drawing conclusions, and presenting
        information in a clear, organized manner with proper citations.""",
        llm=llm,
        verbose=settings.crewai_verbose,
        max_iter=settings.crewai_max_iterations,
    )

    # Define tasks
    search_task = Task(
        description=f"""Research the following topic thoroughly:

        Topic: {task_data['title']}

        Additional context: {task_data.get('description', 'No additional context provided')}

        Requirements:
        1. Find 5-7 high-quality, credible sources
        2. Focus on recent information (preferably from the last 2 years)
        3. Include a mix of overview articles and detailed resources
        4. Note the URL and key points from each source

        Your output should be a list of sources with:
        - Source title
        - URL
        - Key points (2-3 bullet points per source)
        - Credibility assessment
        """,
        agent=researcher,
        expected_output="A comprehensive list of 5-7 sources with URLs, key points, and credibility notes",
    )

    analysis_task = Task(
        description="""Analyze the research findings and create a comprehensive summary report.

        Your report should include:

        1. **Executive Summary** (2-3 sentences)
           - What is the topic about?
           - What are the key takeaways?

        2. **Key Findings** (3-5 bullet points)
           - The most important insights from the research

        3. **Detailed Analysis** (organized by theme/subtopic)
           - Group related information together
           - Provide context and explanation

        4. **Recommendations** (if applicable)
           - Actionable next steps based on the research

        5. **Sources**
           - List all sources used with URLs

        Format the output as clean markdown that can be easily read and shared.
        """,
        agent=analyst,
        expected_output="A well-structured markdown research report with executive summary, key findings, detailed analysis, and sources",
        context=[search_task],
    )

    # Create crew
    crew = Crew(
        agents=[researcher, analyst],
        tasks=[search_task, analysis_task],
        process=Process.sequential,
        verbose=settings.crewai_verbose,
    )

    return crew


async def execute_research(
    execution_id: str,
    task_data: dict[str, Any],
    user_context: dict[str, Any],
    progress_callback: Optional[Callable[[int, str], None]] = None,
) -> ExecutionOutput:
    """
    Execute the research crew for the given task.

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
        total_steps=4,
    )

    tracker.update("Creating research crew...")

    # Create the crew
    crew = create_research_crew(task_data, user_context)

    tracker.update("Researching topic...")

    # Execute the crew (this is synchronous, so we run in executor)
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, crew.kickoff)

    tracker.update("Processing results...")

    # Extract the output
    raw_output = str(result) if result else ""

    # Create the execution output
    output = ExecutionOutput(
        summary=f"Research completed for: {task_data['title']}",
        artifacts=[
            Artifact(
                type="markdown",
                title=f"Research Report: {task_data['title']}",
                content=raw_output,
            )
        ],
        raw_output=raw_output,
    )

    tracker.complete("Research complete!")

    return output
