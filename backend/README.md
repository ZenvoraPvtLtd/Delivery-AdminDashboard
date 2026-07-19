# Delivery Admin Dashboard Backend

This is the enterprise production-grade backend for the Delivery Admin Dashboard.

## Technology Stack
- **Framework**: FastAPI (Python 3.12+)
- **Database**: MongoDB Atlas via Motor & Beanie ODM
- **Validation**: Pydantic V2
- **Auth**: JWT, Passlib, bcrypt
- **Security & Reliability**: slowapi (Rate Limiting), CORS, Gzip Compression, Exception handling
- **Logging**: Loguru

## Folder Architecture

```
backend/
├── app/
│   ├── api/          # API routers and endpoints (v1)
│   ├── background/   # Background tasks and workers
│   ├── config/       # Other configurations if necessary
│   ├── constants/    # App-wide constants
│   ├── core/         # Core config, logging, and exceptions
│   ├── database/     # MongoDB connection logic
│   ├── dependencies/ # FastAPI dependencies (e.g. get_current_user)
│   ├── exceptions/   # Custom domain exceptions
│   ├── logs/         # Log outputs
│   ├── middleware/   # Custom middlewares
│   ├── models/       # Beanie ODM models (Database schemas)
│   ├── repositories/ # Data access layer
│   ├── routes/       # Alternative routing setup if needed
│   ├── schemas/      # Pydantic models for validation and responses
│   ├── security/     # Hashing, JWT logic
│   ├── services/     # Business logic layer
│   ├── tests/        # Pytest cases
│   ├── utils/        # Helper functions
│   ├── websocket/    # WebSocket handlers
│   └── main.py       # FastAPI application entrypoint
├── uploads/          # Directory for uploaded files
├── Dockerfile        # Docker build instructions
├── docker-compose.yml# Docker compose setup
├── requirements.txt  # Python dependencies
└── .env.example      # Environment variables template
```

## How to Install and Run

### 1. Prerequisites
- Python 3.12+
- MongoDB (Local or Atlas)
- Docker (Optional)

### 2. Local Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment:
   - Copy `.env.example` to `.env`
   - Fill in your `MONGODB_URL` and other required fields.
5. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

### 3. Docker Setup
1. Ensure Docker and Docker Compose are installed.
2. Run the application:
   ```bash
   docker-compose up --build
   ```

### 4. Verification
Once running, check the health endpoint:
- `http://127.0.0.1:8000/api/v1/health`

View the API documentation at:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
