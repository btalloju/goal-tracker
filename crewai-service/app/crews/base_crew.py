"""
Base crew utilities and shared functionality.
"""

from typing import Any, Callable, Optional

from crewai import LLM

from app.config import settings


def get_llm() -> LLM:
    """
    Get the configured LLM instance (Google Gemini).

    Returns:
        Configured CrewAI LLM instance
    """
    return LLM(
        model=settings.default_llm_model,
        api_key=settings.google_ai_api_key,
        temperature=settings.default_llm_temperature,
    )


def build_user_context_string(user_context: dict[str, Any]) -> str:
    """
    Build a context string from user profile information.

    Args:
        user_context: User context dictionary with skills, experience, etc.

    Returns:
        Formatted string for use in agent backstories/prompts
    """
    parts = []

    skills = user_context.get("skills", [])
    if skills:
        parts.append(f"Skills: {', '.join(skills)}")

    experience = user_context.get("experience")
    if experience:
        parts.append(f"Experience level: {experience}")

    preferences = user_context.get("preferences", {})
    if preferences:
        pref_str = ", ".join(f"{k}: {v}" for k, v in preferences.items())
        parts.append(f"Preferences: {pref_str}")

    return "; ".join(parts) if parts else "No specific context provided"


class ProgressTracker:
    """
    Helper class to track and report execution progress.
    """

    def __init__(
        self,
        execution_id: str,
        callback: Optional[Callable[[int, str], None]] = None,
        total_steps: int = 5,
    ):
        self.execution_id = execution_id
        self.callback = callback
        self.total_steps = total_steps
        self.current_step = 0

    def update(self, step_name: str, step_number: Optional[int] = None):
        """
        Update progress with a new step.

        Args:
            step_name: Description of the current step
            step_number: Optional explicit step number (1-indexed)
        """
        if step_number is not None:
            self.current_step = step_number
        else:
            self.current_step += 1

        progress = min(int((self.current_step / self.total_steps) * 100), 99)

        print(f"📊 [{self.execution_id}] Progress: {progress}% - {step_name}")

        if self.callback:
            self.callback(progress, step_name)

    def complete(self, message: str = "Complete"):
        """Mark execution as complete."""
        if self.callback:
            self.callback(100, message)
