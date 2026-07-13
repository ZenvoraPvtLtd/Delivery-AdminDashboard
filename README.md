# Delivery-AdminDashboard

A premium, state-of-the-art Delivery Admin Dashboard built with React, Vite, Redux, and a Python FastAPI backend powered by LangChain.

## Prerequisites

1. **Node.js** (v18 or higher recommended)
2. **Python 3** (v3.10 or higher recommended)

## Setup & Running Locally

### 1. Install Backend Dependencies
Navigate to the root directory and install python requirements:
```sh
pip install -r requirements.txt
```

### 2. Configure Environment Variables (Optional)
Copy `.env.example` to `.env` and set your API keys if you wish to run the live LangChain chatbot using Gemini or OpenAI models. If no key is set, the chatbot will run a highly optimized local semantic database querying chain.
```sh
copy .env.example .env
```

### 3. Start the Backend API
Start the FastAPI server from the root directory:
```sh
npm run server
```
This automatically finds the correct python path and runs the FastAPI backend on port `8000`.

### 4. Start the Frontend Dev Server
In a second terminal, start the Vite development server:
```sh
npm run dev
```
The app runs at `http://localhost:3000` and proxies API requests to `http://localhost:8000`.
