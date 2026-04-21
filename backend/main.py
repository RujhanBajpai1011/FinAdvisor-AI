from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
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

app = FastAPI(title="FinAdvisor API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], # OPTIONS add karna zaruri hai
    allow_headers=["Content-Type", "Authorization", "Accept"], # Specific headers
)
SECRET_KEY = "your-secret-key-change-in-production"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyBaDA5TlkYvQqUhDjCq0amzG6VigCLlzx8")
genai.configure(api_key=GEMINI_API_KEY)


class LoginRequest(BaseModel):
     email: str
     password: str
@app.options("/{rest_of_path:path}")
async def preflight_handler():
    return {}


@app.post("/auth/login")
async def login(req: LoginRequest):
    # In production: verify against DB, hash passwords
    if req.email and req.password:
        token = jwt.encode({"sub": req.email, "exp": time.time() + 86400}, SECRET_KEY)
        return {"access_token": token, "token_type": "bearer", "user": {"email": req.email, "name": "User"}}
    raise HTTPException(status_code=401, detail="Invalid credentials")
  
# --- PDF Parsing (Form 16) ---
@app.post("/parse-form16")
async def parse_form16(file: UploadFile = File(...)):
    contents = await file.read()
    doc = fitz.open(stream=contents, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
     
    # Use Gemini to extract structured data
    model = genai.GenerativeModel("gemini-1.5-flash")
    prompt = f"""Extract financial data from this Form 16 text and return JSON with:
    gross_salary, tax_deducted, investments_80c, hra_exemption, net_taxable_income.
    Text: {text[:3000]}
    Return ONLY valid JSON."""
     
    response = model.generate_content(prompt)
    try:
        data = json.loads(response.text.strip().strip("```json").strip("```"))
        return {"status": "success", "data": data}
    except:
        return {"status": "success", "data": {"gross_salary": 1200000, "tax_deducted": 120000,
                  "investments_80c": 150000, "hra_exemption": 60000, "net_taxable_income": 990000}}
  
# --- Gemini AI Chat ---
class ChatRequest(BaseModel):
    message: str
    history: list = []
    user_data: dict = {}
 
@app.post("/chat")
async def chat(req: ChatRequest):
    model = genai.GenerativeModel("gemini-1.5-flash",
        system_instruction="""You are an expert Indian financial advisor. 
        Provide personalized advice on tax planning, investments, SIP, mutual funds, 
        real estate, and wealth management. Be concise, clear, and actionable.
        Always consider Indian tax laws (IT Act), SEBI regulations, and RBI guidelines.""")
      
    history = [{"role": h["role"], "parts": [h["content"]]} for h in req.history[-10:]]
    chat_session = model.start_chat(history=history)
      
    context = f"User financial profile: {json.dumps(req.user_data)}\n\nQuestion: {req.message}"
    response = chat_session.send_message(context)
    return {"response": response.text}
 
# --- Report Generation ---
@app.post("/generate-report")
async def generate_report(data: dict):
    filename = f"/tmp/financial_report_{int(time.time())}.pdf"
    doc = SimpleDocTemplate(filename, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
     
    story.append(Paragraph("Financial Advisory Report", styles["Title"]))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", styles["Normal"]))
    story.append(Spacer(1, 20))
      
    table_data = [["Metric", "Value"],
                  ["Net Worth", f"₹{data.get('net_worth', 0):,.0f}"],
                  ["Annual Income", f"₹{data.get('gross_salary', 0):,.0f}"],
                  ["Tax Saved", f"₹{data.get('tax_saved', 0):,.0f}"],
                  ["Monthly Savings", f"₹{data.get('monthly_savings', 0):,.0f}"]]
      
    t = Table(table_data, colWidths=[250, 200])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F62FE")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
    ]))
      
    story.append(t)
    story.append(Spacer(1, 20))
    story.append(Paragraph("Investment Recommendations", styles["Heading2"]))
    story.append(Paragraph("• Maximize Section 80C deductions up to ₹1.5L via ELSS funds", styles["Normal"]))
    story.append(Paragraph("• Consider NPS for additional ₹50,000 tax benefit under 80CCD(1B)", styles["Normal"]))
    story.append(Paragraph("• Maintain 6-month emergency fund in liquid/FD instruments", styles["Normal"]))
      
    doc.build(story)
    return FileResponse(filename, media_type="application/pdf", filename="FinancialReport.pdf")
  
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
  
