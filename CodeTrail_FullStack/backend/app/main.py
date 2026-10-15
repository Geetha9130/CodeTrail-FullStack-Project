from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from .tracer import trace_code, TraceError

app = FastAPI(title="CodeTrail API", version="1.0.0", description="Safe AST-based Python learning tracer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

class TraceRequest(BaseModel):
    code: str = Field(min_length=1, max_length=8000)

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "CodeTrail API"}

@app.post("/api/trace")
def create_trace(request: TraceRequest):
    try:
        return trace_code(request.code)
    except TraceError as exc:
        return {"ok": False, "error": str(exc), "steps": [], "output": "", "summary": "Could not visualize this program."}
    except SyntaxError as exc:
        line = exc.lineno or "unknown"
        return {
            "ok": False,
            "error": f"Syntax error near line {line}. Check spelling, brackets, colons, and indentation.",
            "steps": [],
            "output": "",
            "summary": "Python could not parse this code."
        }
