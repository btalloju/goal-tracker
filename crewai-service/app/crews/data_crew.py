"""
Data Analysis Crew - Spreadsheet analysis and visualization.

This crew consists of:
- Data Analyst: Analyzes data and identifies patterns
- Visualization Specialist: Creates charts and visual summaries
"""

import asyncio
from typing import Any, Callable, Optional

from crewai import Agent, Crew, Process, Task

from app.config import settings
from app.crews.base_crew import ProgressTracker, build_user_context_string, get_llm
from app.models import Artifact, ExecutionOutput


async def execute_data_analysis(
    execution_id: str,
    task_data: dict[str, Any],
    user_context: dict[str, Any],
    progress_callback: Optional[Callable[[int, str], None]] = None,
) -> ExecutionOutput:
    """
    Execute the data analysis crew for the given task.

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

    tracker.update("Creating data analysis crew...")

    llm = get_llm()
    context_str = build_user_context_string(user_context)

    # Define agents
    analyst = Agent(
        role="Data Analyst",
        goal="Analyze data to uncover meaningful insights and patterns",
        backstory=f"""You are an expert data analyst who can interpret complex data
        and identify key trends. User context: {context_str}""",
        llm=llm,
        verbose=settings.crewai_verbose,
    )

    visualizer = Agent(
        role="Visualization Specialist",
        goal="Create clear and informative data visualizations",
        backstory="""You specialize in presenting data visually. You know how to
        choose the right chart type and create descriptions for visualizations.""",
        llm=llm,
        verbose=settings.crewai_verbose,
    )

    # Define tasks
    analysis_task = Task(
        description=f"""Analyze the following data task:

        Task: {task_data['title']}
        Details: {task_data.get('description', 'No additional details')}

        Provide:
        1. Data overview and summary statistics
        2. Key patterns and trends identified
        3. Notable outliers or anomalies
        4. Statistical insights
        5. Recommendations based on findings
        """,
        agent=analyst,
        expected_output="A comprehensive data analysis with statistics, patterns, and recommendations",
    )

    visualization_task = Task(
        description="""Based on the analysis, recommend and describe visualizations.

        For each recommended visualization:
        1. Chart type (bar, line, pie, scatter, etc.)
        2. What data it would show
        3. Why this visualization is effective
        4. Key insights it would highlight

        Also provide a text-based summary table of key metrics.
        """,
        agent=visualizer,
        expected_output="Visualization recommendations and a summary of key metrics in markdown",
        context=[analysis_task],
    )

    tracker.update("Analyzing data...")

    crew = Crew(
        agents=[analyst, visualizer],
        tasks=[analysis_task, visualization_task],
        process=Process.sequential,
        verbose=settings.crewai_verbose,
    )

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, crew.kickoff)

    tracker.update("Generating insights...")

    raw_output = str(result) if result else ""

    output = ExecutionOutput(
        summary=f"Data analysis completed for: {task_data['title']}",
        artifacts=[
            Artifact(
                type="markdown",
                title=f"Data Analysis: {task_data['title']}",
                content=raw_output,
            )
        ],
        raw_output=raw_output,
    )

    tracker.complete("Data analysis complete!")

    return output
