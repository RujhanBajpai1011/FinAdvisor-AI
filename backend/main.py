from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import fitz  # PyMuPDF
import google.generativeai as genai
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from jose import jwt
import os, json, time
from datetime import datetime

# ============================================================
# APP INITIALIZATION
# ============================================================
app = FastAPI(title="FinAdvisor API", version="1.0")

# ============================================================
# ALLOWED ORIGINS
# Render = Backend, Vercel = Frontend
# ============================================================
ALLOWED_ORIGINS = [
    # Local development
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",

    # ⚠️ Apni Vercel frontend URL yahan daalo
    # Vercel Dashboard → Project → Settings → Domains mein milegi
    "https://fin-advisor-ai.vercel.app",
]

# ============================================================
# HELPER FUNCTION - Origin check karne ke liye
# ============================================================
def is_origin_allowed(origin: str) -> bool:
    """
    Check karo request ka origin allowed hai ya nahi
    """
    if not origin:
        return False
    
    # Exact match check
    if origin in ALLOWED_ORIGINS:
        return True
    
    # Vercel preview deployments automatically allow karo
    # Format: https://your-app-randomstring.vercel.app
    if origin.endswith(".vercel.app"):
        return True
    
    # Local development
    if origin.startswith("http://localhost"):
        return True
    
    if origin.startswith("http://127.0.0.1"):
        return True
    
    return False

# ============================================================
# STEP 1: Custom HTTP Middleware
# Ye sabse pehle run hoga
# ============================================================
@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    origin = request.headers.get("Origin", "")
    allowed = is_origin_allowed(origin)

    # OPTIONS preflight request handle karo
    if request.method == "OPTIONS":
        if allowed:
            return JSONResponse(
                content={"message": "OK"},
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": (
                        "GET, POST, PUT, DELETE, OPTIONS, PATCH"
                    ),
                    "Access-Control-Allow-Headers": (
                        "Content-Type, Authorization, Accept, "
                        "X-Requested-With, Origin"
                    ),
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Max-Age": "600",
                },
            )
        return JSONResponse(
            content={"error": "CORS: Origin not allowed"},
            status_code=403,
        )

    # Normal request process karo
    response = await call_next(request)

    # Allowed origin ke liye headers add karo
    if allowed:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = (
            "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        )
        response.headers["Access-Control-Allow-Headers"] = (
            "Content-Type, Authorization, Accept"
        )

    return response

# ============================================================
# STEP 2: FastAPI Built-in CORS Middleware
# Double protection ke liye
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",  # ✅ Vercel previews
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
    ],
    expose_headers=["Content-Disposition"],
    max_age=600,
)

# ============================================================
# CONFIGURATION
# ============================================================
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")

# ✅ Render Dashboard mein Environment Variable set karo
# Dashboard → Your Service → Environment → Add Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

if not GEMINI_API_KEY:
    print("⚠️  WARNING: GEMINI_API_KEY set nahi hai!")
else:
    genai.configure(api_key=GEMINI_API_KEY)

# ============================================================
# MODELS
# ============================================================
class LoginRequest(BaseModel):
    email: str
    password: str

class ChatRequest(BaseModel):
    message: str
    history: list = []
    user_data: dict = {}

class ReportRequest(BaseModel):
    net_worth: float = 0
    gross_salary: float = 0
    tax_saved: float = 0
    monthly_savings: float = 0

# ============================================================
# ROUTES
# ============================================================
@app.get("/")
async def root():
    return {
        "message": "FinAdvisor API Running!",
        "status": "ok",
        "platform": "Render"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "gemini_configured": bool(GEMINI_API_KEY)
    }

# ✅ Manual OPTIONS handler - extra safety
@app.options("/{rest_of_path:path}")
async def preflight_handler(request: Request, rest_of_path: str):
    origin = request.headers.get("Origin", "")
    return JSONResponse(
        content={"message": "OK"},
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": origin if is_origin_allowed(origin) else "",
            "Access-Control-Allow-Methods": (
                "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            ),
            "Access-Control-Allow-Headers": (
                "Content-Type, Authorization, Accept, X-Requested-With"
            ),
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "600",
        },
    )

# ============================================================
# AUTH
# ============================================================
@app.post("/auth/login")
async def login(req: LoginRequest):
    if req.email and req.password:
        token = jwt.encode(
            {
                "sub": req.email,
                "exp": int(time.time()) + 86400,
                "iat": int(time.time()),
            },
            SECRET_KEY,
            algorithm="HS256",
        )
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "email": req.email,
                "name": req.email.split("@")[0].title(),
            },
        }
    raise HTTPException(status_code=401, detail="Invalid credentials")

# ============================================================
# PDF PARSING
# ============================================================
@app.post("/parse-form16")
async def parse_form16(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Sirf PDF files allowed hain")

    contents = await file.read()

    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File 10MB se badi nahi honi chahiye")

    try:
        doc = fitz.open(stream=contents, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF parse error: {str(e)}")

    if not GEMINI_API_KEY:
        return {
            "status": "success",
            "data": {
                "gross_salary": 1200000,
                "tax_deducted": 120000,
                "investments_80c": 150000,
                "hra_exemption": 60000,
                "net_taxable_income": 990000,
            },
            "note": "Demo data - API key nahi hai",
        }

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"""Extract financial data from this Form 16 and return JSON with:
        gross_salary, tax_deducted, investments_80c, hra_exemption, net_taxable_income.
        Numbers only, no commas, no symbols.
        Text: {text[:3000]}
        Return ONLY valid JSON."""

        response = model.generate_content(prompt)
        raw_text = response.text.strip()

        if raw_text.startswith("```"):
            lines = raw_text.split("\n")
            raw_text = "\n".join(lines[1:-1])

        data = json.loads(raw_text)
        return {"status": "success", "data": data}

    except json.JSONDecodeError:
        return {
            "status": "success",
            "data": {
                "gross_salary": 1200000,
                "tax_deducted": 120000,
                "investments_80c": 150000,
                "hra_exemption": 60000,
                "net_taxable_income": 990000,
            },
            "note": "Parse failed, estimated values use ho rahe hain",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {str(e)}")

# ============================================================
# CHAT
# ============================================================
@app.post("/chat")
async def chat(req: ChatRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service unavailable")

    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message empty nahi hona chahiye")

    try:
        model = genai.GenerativeModel(
            "gemini-1.5-flash",
            system_instruction="""You are an expert Indian financial advisor.
            Provide personalized advice on tax planning, investments, SIP,
            mutual funds, real estate, and wealth management.
            Be concise, clear, and actionable.
            Always consider Indian tax laws (IT Act), SEBI regulations,
            and RBI guidelines. Respond in the same language as the user.""",
        )

        history = []
        for h in req.history[-10:]:
            if isinstance(h, dict) and "role" in h and "content" in h:
                history.append({"role": h["role"], "parts": [h["content"]]})

        chat_session = model.start_chat(history=history)

        context = (
            f"User financial profile: {json.dumps(req.user_data)}\n\nQuestion: {req.message}"
            if req.user_data
            else req.message
        )

        response = chat_session.send_message(context)
        return {"response": response.text, "status": "success"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

# ============================================================
# REPORT GENERATION
# ============================================================
@app.post("/generate-report")
async def generate_report(data: ReportRequest):
    try:
        filename = f"/tmp/financial_report_{int(time.time())}.pdf"
        doc = SimpleDocTemplate(filename, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        story.append(Paragraph("Financial Advisory Report", styles["Title"]))
        story.append(
            Paragraph(
                f"Generated: {datetime.now().strftime('%B %d, %Y')}",
                styles["Normal"],
            )
        )
        story.append(Spacer(1, 20))

        table_data = [
            ["Metric", "Value"],
            ["Net Worth", f"Rs.{data.net_worth:,.0f}"],
            ["Annual Income", f"Rs.{data.gross_salary:,.0f}"],
            ["Tax Saved", f"Rs.{data.tax_saved:,.0f}"],
            ["Monthly Savings", f"Rs.{data.monthly_savings:,.0f}"],
        ]

        t = Table(table_data, colWidths=[250, 200])
        t.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F62FE")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 11),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#F4F4F4")],
                ),
            ])
        )

        story.append(t)
        story.append(Spacer(1, 20))
        story.append(Paragraph("Investment Recommendations", styles["Heading2"]))
        story.append(Spacer(1, 10))

        recommendations = [
            "Maximize Section 80C deductions up to Rs.1.5L via ELSS funds",
            "Consider NPS for additional Rs.50,000 benefit under 80CCD(1B)",
            "Maintain 6-month emergency fund in liquid/FD instruments",
            "Diversify: 60% equity, 30% debt, 10% gold",
            "Review health insurance coverage annually",
        ]

        for rec in recommendations:
            story.append(Paragraph(f"• {rec}", styles["Normal"]))
            story.append(Spacer(1, 5))

        doc.build(story)

        return FileResponse(
            filename,
            media_type="application/pdf",
            filename="FinancialReport.pdf",
            headers={"Content-Disposition": "attachment; filename=FinancialReport.pdf"},
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report error: {str(e)}")

# ============================================================
# MAIN
# ============================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
