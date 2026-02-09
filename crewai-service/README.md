# CrewAI Microservice

Python microservice for AI agent execution using CrewAI with Google Gemini.

## Overview

This service handles the execution of AI agent "crews" that can:
- **Research Crew**: Web search and information synthesis
- **Writer Crew**: Content drafting and editing
- **Data Crew**: Data analysis and visualization recommendations
- **Communication Crew**: Email drafting and meeting scheduling

## Quick Start

### Prerequisites

- Python 3.11+
- Google AI API key (Gemini)

### Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

### Running Locally

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --port 8000

# Or using Python directly
python -m app.main
```

### API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Health Check
```
GET /health
```

### List Available Crews
```
GET /api/crews
```

### Execute a Crew
```
POST /api/execute
{
  "execution_id": "exec_123",
  "crew_type": "RESEARCH",
  "task": {
    "id": "task_456",
    "title": "Research REST API best practices",
    "description": "Find current best practices with examples"
  },
  "user_context": {
    "skills": ["Python", "FastAPI"],
    "experience": "intermediate"
  }
}
```

### Check Execution Status
```
GET /api/status/{execution_id}
```

### Cancel Execution
```
POST /api/cancel/{execution_id}
```

## Configuration

See `.env.example` for all configuration options.

### Required
- `GOOGLE_AI_API_KEY`: Gemini API key

### Optional (enables additional crews)
- `SERPAPI_KEY`: Enables Research Crew search
- `GMAIL_CLIENT_ID/SECRET`: Enables Communication Crew
- `GOOGLE_DOCS_API_KEY`: Enables Writer Crew doc creation
- `GOOGLE_SHEETS_API_KEY`: Enables Data Crew sheet creation

## Deployment

### Docker

```bash
docker build -t crewai-service .
docker run -p 8000:8000 --env-file .env crewai-service
```

### Railway

The service includes a `railway.json` for easy deployment:

```bash
railway up
```

### Vercel (Serverless)

Note: Some crews may timeout on serverless platforms due to execution time limits.

## Architecture

```
crewai-service/
├── app/
│   ├── main.py           # FastAPI application
│   ├── config.py         # Environment configuration
│   ├── models.py         # Pydantic models
│   ├── crews/            # CrewAI crew definitions
│   │   ├── research_crew.py
│   │   ├── writer_crew.py
│   │   ├── data_crew.py
│   │   └── communication_crew.py
│   ├── tools/            # CrewAI tools
│   │   └── google_search.py
│   └── routes/           # API routes
│       ├── crews.py
│       └── executions.py
└── tests/                # Test files
```

## Testing

```bash
# Run all tests
pytest

# With coverage
pytest --cov=app --cov-report=html

# Run specific tests
pytest tests/test_crews/test_research_crew.py
```

## Integration with Questive

This service integrates with the Questive Next.js app:

1. **Task Assignment**: User assigns a task to a crew in Questive
2. **API Call**: Questive calls `POST /api/execute` with task details
3. **Background Execution**: CrewAI executes the crew in the background
4. **Progress Callbacks**: Service sends progress updates to Questive
5. **Completion**: Results are returned and stored in Questive

### Environment Variables for Integration

```bash
# In Questive (.env.local)
CREWAI_SERVICE_URL=http://localhost:8000
CREWAI_SERVICE_API_KEY=your_shared_secret

# In CrewAI Service (.env)
API_KEY=your_shared_secret
NEXTJS_APP_URL=http://localhost:3000
NEXTJS_CALLBACK_SECRET=your_callback_secret
```

## License

MIT - Part of the Questive project
