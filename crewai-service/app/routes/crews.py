"""
Crew management routes.

Endpoints for listing available crews and their capabilities.
"""

from fastapi import APIRouter

from app.config import settings
from app.models import CrewCategory, CrewInfo, CrewListResponse, RiskLevel

router = APIRouter()

# =============================================================================
# Crew Definitions
# =============================================================================

CREW_DEFINITIONS: dict[CrewCategory, dict] = {
    CrewCategory.RESEARCH: {
        "name": "Research Crew",
        "description": "Web search, information gathering, and summarization",
        "icon": "🔍",
        "risk_level": RiskLevel.LOW,
        "capabilities": [
            "Search the web for information",
            "Read and summarize articles",
            "Compile research reports",
            "Cite sources automatically",
        ],
        "requires": ["serpapi_key"],
    },
    CrewCategory.WRITING: {
        "name": "Content Writer Crew",
        "description": "Draft blogs, emails, reports, and documents",
        "icon": "✍️",
        "risk_level": RiskLevel.LOW,
        "capabilities": [
            "Draft blog posts and articles",
            "Write professional emails",
            "Create reports and summaries",
            "Save to Google Docs",
        ],
        "requires": [],  # Only needs Gemini
    },
    CrewCategory.DATA: {
        "name": "Data Analysis Crew",
        "description": "Spreadsheet creation, data analysis, and visualization",
        "icon": "📊",
        "risk_level": RiskLevel.MEDIUM,
        "capabilities": [
            "Analyze spreadsheet data",
            "Create charts and visualizations",
            "Generate insights and summaries",
            "Create new Google Sheets",
        ],
        "requires": ["google_sheets_api_key"],
    },
    CrewCategory.COMMUNICATION: {
        "name": "Communication Crew",
        "description": "Send emails, schedule meetings, update CRM",
        "icon": "📧",
        "risk_level": RiskLevel.HIGH,
        "capabilities": [
            "Draft and send emails",
            "Schedule calendar events",
            "Send meeting invitations",
            "Update contact records",
        ],
        "requires": ["gmail_client_id", "gmail_client_secret"],
    },
}


def check_crew_availability(crew_category: CrewCategory) -> tuple[bool, str | None]:
    """
    Check if a crew is available based on configured API keys.

    Returns:
        Tuple of (is_available, unavailable_reason)
    """
    definition = CREW_DEFINITIONS[crew_category]
    required = definition.get("requires", [])

    for requirement in required:
        if not getattr(settings, requirement, None):
            return False, f"Missing configuration: {requirement}"

    return True, None


# =============================================================================
# Routes
# =============================================================================


@router.get("/crews", response_model=CrewListResponse)
async def list_crews():
    """
    List all available crews with their capabilities.

    Returns information about each crew type, including:
    - Name and description
    - Risk level
    - Capabilities
    - Whether the crew is currently available (based on API configuration)
    """
    crews = []

    for category in CrewCategory:
        definition = CREW_DEFINITIONS[category]
        available, unavailable_reason = check_crew_availability(category)

        crews.append(
            CrewInfo(
                category=category,
                name=definition["name"],
                description=definition["description"],
                icon=definition["icon"],
                risk_level=definition["risk_level"],
                capabilities=definition["capabilities"],
                available=available,
                unavailable_reason=unavailable_reason,
            )
        )

    return CrewListResponse(crews=crews)


@router.get("/crews/{category}", response_model=CrewInfo)
async def get_crew(category: CrewCategory):
    """
    Get information about a specific crew.

    Args:
        category: The crew category (RESEARCH, WRITING, DATA, COMMUNICATION)
    """
    definition = CREW_DEFINITIONS[category]
    available, unavailable_reason = check_crew_availability(category)

    return CrewInfo(
        category=category,
        name=definition["name"],
        description=definition["description"],
        icon=definition["icon"],
        risk_level=definition["risk_level"],
        capabilities=definition["capabilities"],
        available=available,
        unavailable_reason=unavailable_reason,
    )
