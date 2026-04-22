from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os, json, time
from datetime import datetime

try:
    import fitz
except ImportError:
    fitz = None

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    anthropic = None
    ANTHROPIC_AVAILABLE = False

try:
    from jose import jwt
    JOSE_AVAILABLE = True
except ImportError:
    jwt = None
    JOSE_AVAILABLE = False

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

app = FastAPI(title="FinAdvisor API", version="4.0")

SECRET_KEY = os.getenv("SECRET_KEY", "finAdvisorSecretKey2025")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

if ANTHROPIC_API_KEY and ANTHROPIC_AVAILABLE:
    print(f"✅ Anthropic Claude ready | Key: ...{ANTHROPIC_API_KEY[-6:]}")
else:
    print("⚠️  ANTHROPIC_API_KEY not set")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

class LoginRequest(BaseModel):
    email: str
    password: str

class ChatRequest(BaseModel):
    message: str
    history: list = []
    user_data: dict = {}

class ReportRequest(BaseModel):
    net_worth: float = 4250000
    gross_salary: float = 1200000
    tax_saved: float = 46500
    monthly_savings: float = 38500


@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "FinAdvisor API v4.0 — Powered by Claude AI",
        "ai_ready": bool(ANTHROPIC_API_KEY and ANTHROPIC_AVAILABLE),
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "claude_configured": bool(ANTHROPIC_API_KEY and ANTHROPIC_AVAILABLE),
        "anthropic_key_set": bool(ANTHROPIC_API_KEY),
        "pymupdf_available": fitz is not None,
        "reportlab_available": REPORTLAB_AVAILABLE,
    }


@app.post("/auth/login")
async def login(req: LoginRequest):
    if not req.email or not req.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    try:
        if JOSE_AVAILABLE:
            token = jwt.encode(
                {"sub": req.email, "exp": int(time.time()) + 86400, "iat": int(time.time())},
                SECRET_KEY, algorithm="HS256",
            )
        else:
            import base64
            token = base64.b64encode(req.email.encode()).decode()
        return {
            "access_token": token, "token_type": "bearer",
            "user": {"email": req.email, "name": req.email.split("@")[0].title()},
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auth error: {str(e)}")


@app.post("/parse-form16")
async def parse_form16(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File must be under 10MB")

    fallback_data = {
        "gross_salary": 1200000, "tax_deducted": 120000,
        "investments_80c": 150000, "hra_exemption": 60000,
        "net_taxable_income": 990000,
    }

    # Extract text from PDF
    extracted_text = ""
    if fitz is not None:
        try:
            doc = fitz.open(stream=contents, filetype="pdf")
            for page in doc:
                extracted_text += page.get_text()
            doc.close()
            print(f"✅ PDF text extracted: {len(extracted_text)} chars")
        except Exception as e:
            print(f"PDF parse error: {e}")
    else:
        return {"status": "success", "data": fallback_data, "note": "PyMuPDF unavailable"}

    if not ANTHROPIC_API_KEY or not ANTHROPIC_AVAILABLE:
        return {"status": "success", "data": fallback_data, "note": "ANTHROPIC_API_KEY not set"}

    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

        prompt = f"""Extract financial data from this Indian Form 16 document.
Return ONLY a JSON object with these exact keys (numeric values, no commas, no symbols):
{{
  "gross_salary": <number>,
  "tax_deducted": <number>,
  "investments_80c": <number>,
  "hra_exemption": <number>,
  "net_taxable_income": <number>
}}
Document text: {extracted_text[:3000] if extracted_text else "No text extracted"}
If value not found, use 0. Return ONLY valid JSON, nothing else."""

        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )

        raw = message.content[0].text.strip()
        if raw.startswith("```"):
            lines = raw.split("\n")
            raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        data = json.loads(raw)
        print(f"✅ Extracted: {data}")
        return {"status": "success", "data": data}

    except json.JSONDecodeError:
        return {"status": "success", "data": fallback_data, "note": "JSON parse failed"}
    except Exception as e:
        print(f"Claude error in parse-form16: {e}")
        return {"status": "success", "data": fallback_data, "note": str(e)}


@app.post("/chat")
async def chat(req: ChatRequest):
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if not ANTHROPIC_API_KEY or not ANTHROPIC_AVAILABLE:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY not set in Render Environment")

    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

        system = """You are FinBot, an expert Indian financial advisor.
Give clear, concise, actionable advice on:
- Indian Income Tax (IT Act 1961), TDS, ITR filing
- Section 80C, 80D, 80CCD, HRA, LTA deductions
- Mutual funds, SIP, ELSS, PPF, NPS, EPF
- Real estate, REIT, wealth management, retirement planning
Keep responses under 250 words. Use bullet points. Use Rs. for amounts.
Respond in the same language the user writes in."""

        # Build messages array for Claude
        messages = []
        for h in req.history[-10:]:
            if not isinstance(h, dict):
                continue
            role = h.get("role", "")
            content = h.get("content", "")
            # Claude accepts "user" and "assistant" directly (no mapping needed)
            if role in ("user", "assistant") and isinstance(content, str) and content.strip():
                messages.append({"role": role, "content": content})

        # Add current message
        user_msg = f"Financial profile: {json.dumps(req.user_data)}\n\n{req.message}" if req.user_data else req.message
        messages.append({"role": "user", "content": user_msg})

        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            system=system,
            messages=messages,
        )

        return {"response": response.content[0].text, "status": "success"}

    except Exception as e:
        err = str(e)
        print(f"Chat error: {err}")
        if "credit" in err.lower() or "billing" in err.lower():
            raise HTTPException(status_code=429, detail="Anthropic API credit exhausted. Add credits at console.anthropic.com")
        if "api_key" in err.lower() or "authentication" in err.lower():
            raise HTTPException(status_code=500, detail="Invalid ANTHROPIC_API_KEY — check Render environment variables")
        raise HTTPException(status_code=500, detail=f"Chat error: {err}")


@app.post("/generate-report")
async def generate_report(data: ReportRequest):
    if not REPORTLAB_AVAILABLE:
        raise HTTPException(status_code=503, detail="ReportLab not installed")
    try:
        filename = f"/tmp/fin_report_{int(time.time())}.pdf"
        doc = SimpleDocTemplate(filename, pagesize=letter,
                                rightMargin=60, leftMargin=60, topMargin=60, bottomMargin=60)
        styles = getSampleStyleSheet()
        story = []

        story.append(Paragraph("FinAdvisor AI — Financial Report", styles["Title"]))
        story.append(Paragraph(f"Generated: {datetime.now().strftime('%d %B %Y, %I:%M %p')}", styles["Normal"]))
        story.append(Spacer(1, 24))
        story.append(Paragraph("Financial Summary", styles["Heading2"]))
        story.append(Spacer(1, 8))

        table_data = [
            ["Metric", "Value"],
            ["Net Worth", f"Rs.{data.net_worth:,.0f}"],
            ["Annual Income", f"Rs.{data.gross_salary:,.0f}"],
            ["Tax Saved (80C+HRA)", f"Rs.{data.tax_saved:,.0f}"],
            ["Monthly Savings", f"Rs.{data.monthly_savings:,.0f}"],
            ["Savings Rate", f"{(data.monthly_savings / (data.gross_salary / 12) * 100):.1f}%" if data.gross_salary > 0 else "N/A"],
        ]

        t = Table(table_data, colWidths=[260, 180])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F62FE")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 11),
            ("ALIGN", (1, 0), (1, -1), "RIGHT"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F0F4FF")]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ]))
        story.append(t)
        story.append(Spacer(1, 24))
        story.append(Paragraph("AI Recommendations", styles["Heading2"]))
        story.append(Spacer(1, 8))

        recs = [
            ("Tax Optimization", "Maximize Section 80C up to Rs.1.5L via ELSS mutual funds."),
            ("NPS Boost", "Invest Rs.50,000 in NPS for extra deduction under 80CCD(1B)."),
            ("Emergency Fund", "Keep 6 months expenses in liquid fund or sweep-in FD."),
            ("Portfolio Mix", "Follow 60:30:10 — Equity, Debt, Gold allocation."),
            ("Health Insurance", "Ensure Rs.10L+ cover. Premiums deductible u/s 80D."),
        ]
        for title, text in recs:
            story.append(Paragraph(f"<b>{title}:</b> {text}", styles["Normal"]))
            story.append(Spacer(1, 8))

        story.append(Spacer(1, 16))
        story.append(Paragraph(
            "<i>Disclaimer: For informational purposes only. Consult a SEBI-registered advisor.</i>",
            styles["Normal"]
        ))
        doc.build(story)

        return FileResponse(filename, media_type="application/pdf",
                            filename="FinAdvisor_Report.pdf",
                            headers={"Content-Disposition": "attachment; filename=FinAdvisor_Report.pdf"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
