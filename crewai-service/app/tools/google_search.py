"""
Google Search tool using SerpAPI.

Allows agents to search the web for information.
"""

from typing import Optional

from pydantic import Field

from app.config import settings

# Only import if crewai_tools is available
try:
    from crewai_tools import BaseTool

    class GoogleSearchTool(BaseTool):
        """Tool for searching Google via SerpAPI."""

        name: str = "Google Search"
        description: str = """Search Google for information on any topic.
        Use this to find current information, facts, articles, and resources.
        Input should be a search query string."""

        api_key: Optional[str] = Field(default=None)

        def __init__(self, **kwargs):
            super().__init__(**kwargs)
            self.api_key = settings.serpapi_key

        def _run(self, query: str) -> str:
            """
            Execute a Google search and return results.

            Args:
                query: The search query

            Returns:
                Formatted search results
            """
            if not self.api_key:
                return "Error: Search API is not configured. Please set SERPAPI_KEY."

            import requests

            url = "https://serpapi.com/search"
            params = {
                "q": query,
                "api_key": self.api_key,
                "num": 10,
                "engine": "google",
            }

            try:
                response = requests.get(url, params=params, timeout=30)
                response.raise_for_status()
                data = response.json()

                # Format results
                results = []
                organic_results = data.get("organic_results", [])

                if not organic_results:
                    return f"No results found for: {query}"

                for i, result in enumerate(organic_results[:7], 1):
                    title = result.get("title", "No title")
                    link = result.get("link", "No link")
                    snippet = result.get("snippet", "No description")

                    results.append(
                        f"{i}. **{title}**\n"
                        f"   URL: {link}\n"
                        f"   {snippet}\n"
                    )

                return "\n".join(results)

            except requests.RequestException as e:
                return f"Search error: {str(e)}"


except ImportError:
    # Provide a placeholder if crewai_tools is not installed
    class GoogleSearchTool:
        """Placeholder for GoogleSearchTool when crewai_tools is not installed."""

        def __init__(self):
            raise ImportError(
                "crewai_tools is required for GoogleSearchTool. "
                "Install with: pip install crewai-tools"
            )
