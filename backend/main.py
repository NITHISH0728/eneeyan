from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
import bcrypt 
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Optional
import models
from database import SessionLocal, engine
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import io
import json
import shutil
import os
import random
import string
import pandas as pd    
import requests 
import razorpay
import google.generativeai as genai # ✅ Added Google AI Library
import re  # 👈 Add this with your other imports
# --- 📄 PDF GENERATION IMPORTS ---
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader

# 1. Initialize Database Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="iQmath Pro LMS API")

# 2. CONFIG: CORS POLICY
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# --- 🔐 SECURITY & AUTH CONFIG ---
SECRET_KEY = "supersecretkey_change_this_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/login") 

# --- 💳 RAZORPAY CONFIGURATION ---
RAZORPAY_KEY_ID = "rzp_test_Ru8lDcv8KvAiC0" 
RAZORPAY_KEY_SECRET = "puZLB2DQS8FmH0Z7SNrJtOBb"

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# --- ✨ GEMINI AI CONFIGURATION (REAL AI) ---
# 👇 PASTE YOUR KEY HERE 👇
GEMINI_API_KEY = "AIzaSyBgfLU5nf8l3KbhtsPmcg3f1s7k4irU3UU" 

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

# --- 🗄️ DATABASE UTILITIES ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 📋 DATA MODELS ---
class UserCreate(BaseModel):
    email: str; password: str; name: str; role: str

class CourseCreate(BaseModel):
    title: str; description: str; price: int; image_url: Optional[str] = None

class ModuleCreate(BaseModel):
    title: str; order: int

class ContentCreate(BaseModel):
    title: str; type: str; data_url: Optional[str] = None; duration: Optional[int] = None; 
    is_mandatory: bool = False; instructions: Optional[str] = None; test_config: Optional[str] = None; module_id: int

class StatusUpdate(BaseModel):
    status: str 

class Token(BaseModel):
    access_token: str; token_type: str; role: str
    
class AssignmentSubmission(BaseModel):
    link: str; lesson_id: int

class AdmitStudentRequest(BaseModel):
    full_name: str
    email: str
    course_ids: List[int] 

class EnrollmentRequest(BaseModel):
    type: str 

class PasswordChange(BaseModel):
    new_password: str

# ✅ Code Test Models
class ProblemSchema(BaseModel):
    title: str
    description: str
    difficulty: str
    test_cases: str 

class CodeTestCreate(BaseModel):
    title: str
    pass_key: str
    time_limit: int
    problems: List[ProblemSchema]

class TestSubmission(BaseModel):
    test_id: int
    score: int
    problems_solved: int
    time_taken: str

class ContentUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None

class CodeExecutionRequest(BaseModel):
    source_code: str
    stdin: str

# ✅ AI Request Model
class AIGenerateRequest(BaseModel):
    title: str

# --- 🔑 AUTH LOGIC ---
def verify_password(plain_password, hashed_password):
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password)

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None: raise HTTPException(status_code=401, detail="Invalid session")
    except JWTError: raise HTTPException(status_code=401, detail="Session expired")
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None: raise HTTPException(status_code=401, detail="User not found")
    return user

def generate_random_password(length=8):
    characters = string.ascii_letters + string.digits + "!@#$"
    return ''.join(random.choice(characters) for i in range(length))

def create_certificate_pdf(student_name: str, course_name: str, date_str: str):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)
    BRAND_BLUE = colors.Color(0/255, 94/255, 184/255)
    BRAND_GREEN = colors.Color(135/255, 194/255, 50/255)
    c.setStrokeColor(BRAND_BLUE); c.setLineWidth(5); c.rect(20, 20, width-40, height-40)
    c.setStrokeColor(BRAND_GREEN); c.setLineWidth(2); c.rect(28, 28, width-56, height-56)
    
    logo_path = "logo.png" if os.path.exists("logo.png") else "logo.jpg"
    if os.path.exists(logo_path):
        try:
            logo = ImageReader(logo_path)
            c.drawImage(logo, (width - 1.5*inch) / 2, height - 130, width=1.5*inch, height=1.5*inch*logo.getSize()[1]/logo.getSize()[0], mask='auto')
        except: pass

    c.setFont("Helvetica-Bold", 40); c.setFillColor(BRAND_BLUE); c.drawCentredString(width/2, height - 180, "CERTIFICATE")
    c.setFont("Helvetica", 16); c.setFillColor(colors.black); c.drawCentredString(width/2, height - 210, "OF COMPLETION")
    c.setFont("Helvetica-BoldOblique", 32); c.drawCentredString(width/2, height - 310, student_name)
    c.setFont("Helvetica-Bold", 24); c.setFillColor(BRAND_BLUE); c.drawCentredString(width/2, height - 400, course_name)
    c.showPage(); c.save(); buffer.seek(0); return buffer

# --- 🚀 API ENDPOINTS ---

@app.post("/api/v1/users", status_code=201)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(email=user.email, hashed_password=get_password_hash(user.password), full_name=user.name, role=user.role)
    db.add(new_user); db.commit()
    return {"message": "User created successfully"}

@app.post("/api/v1/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "role": user.role}

@app.post("/api/v1/admin/admit-student")
def admit_single_student(req: AdmitStudentRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403, detail="Only Instructors can admit students")
    existing_user = db.query(models.User).filter(models.User.email == req.email).first()
    student = existing_user
    if not student:
        student = models.User(email=req.email, full_name=req.full_name, hashed_password=get_password_hash(generate_random_password()), role="student")
        db.add(student); db.commit(); db.refresh(student)
    
    enrolled = []
    for cid in req.course_ids:
        if not db.query(models.Enrollment).filter(models.Enrollment.user_id == student.id, models.Enrollment.course_id == cid).first():
            db.add(models.Enrollment(user_id=student.id, course_id=cid))
            enrolled.append(cid)
    db.commit()
    return {"message": f"Enrolled in {len(enrolled)} courses"}

@app.post("/api/v1/admin/bulk-admit")
async def bulk_admit_students(file: UploadFile = File(...), course_id: int = Form(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403)
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents)) if file.filename.endswith('.csv') else pd.read_excel(io.BytesIO(contents))
    except: raise HTTPException(status_code=400, detail="Invalid file")
    
    df.columns = [c.lower().strip() for c in df.columns]
    if "email" not in df.columns: raise HTTPException(status_code=400, detail="Missing 'email' column")
    
    count = 0
    for _, row in df.iterrows():
        email = str(row["email"]).strip()
        if not email or email == "nan": continue
        student = db.query(models.User).filter(models.User.email == email).first()
        if not student:
            student = models.User(email=email, full_name=str(row.get("name", "Student")), hashed_password=get_password_hash("pass123"), role="student")
            db.add(student); db.commit(); db.refresh(student)
        
        if not db.query(models.Enrollment).filter(models.Enrollment.user_id == student.id, models.Enrollment.course_id == course_id).first():
            db.add(models.Enrollment(user_id=student.id, course_id=course_id))
            count += 1
    db.commit()
    return {"message": f"Enrolled {count} students"}

# --- 🚀 CODE ARENA ENDPOINTS (HYBRID AI ENHANCED) ---

# ✅ 1. REAL GEMINI AI GENERATION ENDPOINT
@app.post("/api/v1/ai/generate")
async def generate_problem_content(req: AIGenerateRequest, db: Session = Depends(get_db)):
    if not GEMINI_API_KEY or "PASTE_YOUR" in GEMINI_API_KEY:
        print("❌ Error: API Key is missing or default.")
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")

    try:
        # 1. Enhanced Prompt to force valid JSON
        prompt = f"""
        Act as a strict coding instructor. 
        Create a programming challenge based on the topic: "{req.title}".
        
        REQUIRED OUTPUT FORMAT (JSON ONLY):
        {{
            "description": "A clear, concise problem statement asking the student to solve the task.",
            "test_cases": [
                {{"input": "example_input", "output": "expected_output", "hidden": false}},
                {{"input": "test_input_2", "output": "test_output_2", "hidden": false}},
                {{"input": "edge_case", "output": "edge_output", "hidden": true}}
            ]
        }}
        
        Do NOT wrap in markdown code blocks. Return ONLY the raw JSON string.
        """
        
        # 2. Call Gemini
        print(f"🤖 Sending request to Gemini for: {req.title}")
        response = model.generate_content(prompt)
        
        # 3. Robust Cleaning (The Fix)
        # Use Regex to find the first '{' and the last '}' to ignore any extra text
        text = response.text.strip()
        match = re.search(r'\{.*\}', text, re.DOTALL)
        
        if not match:
            raise ValueError("AI did not return valid JSON format.")
            
        clean_json = match.group()
        ai_data = json.loads(clean_json)
        
        # 4. Success Return
        print("✅ AI Generation Successful!")
        return {
            "description": ai_data.get("description", "No description generated."),
            "test_cases": json.dumps(ai_data.get("test_cases", [])) 
        }

    except Exception as e:
        print(f"🔥 AI GENERATION FAILED: {str(e)}")
        # Check your terminal! This print will tell you exactly why it failed.
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")
    
@app.post("/api/v1/code-tests")
def create_code_test(test: CodeTestCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403)
    new_test = models.CodeTest(title=test.title, pass_key=test.pass_key, time_limit=test.time_limit, instructor_id=current_user.id)
    db.add(new_test); db.commit(); db.refresh(new_test)
    
    for prob in test.problems:
        new_prob = models.Problem(
            test_id=new_test.id, 
            title=prob.title, 
            description=prob.description, 
            difficulty=prob.difficulty, 
            test_cases=prob.test_cases 
        )
        db.add(new_prob)
    db.commit()
    return {"message": "Test Created Successfully!"}

@app.get("/api/v1/code-tests")
def get_code_tests(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == "instructor": 
        return db.query(models.CodeTest).filter(models.CodeTest.instructor_id == current_user.id).all()
    
    # For Students: Check if they completed it
    tests = db.query(models.CodeTest).all()
    response_data = []
    
    for t in tests:
        # Check if a result exists for this student & test
        submission = db.query(models.TestResult).filter(
            models.TestResult.test_id == t.id, 
            models.TestResult.user_id == current_user.id
        ).first()
        
        response_data.append({
            "id": t.id,
            "title": t.title,
            "time_limit": t.time_limit,
            "problems": t.problems, # Serialize problems if needed, or keep simple
            "completed": True if submission else False # ✅ FLAG FOR FRONTEND
        })
        
    return response_data

@app.post("/api/v1/code-tests/{test_id}/start")
def start_code_test(test_id: int, pass_key: str = Form(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # ✅ SECURITY CHECK: Prevent Re-entry
    existing_result = db.query(models.TestResult).filter(
        models.TestResult.test_id == test_id, 
        models.TestResult.user_id == current_user.id
    ).first()
    
    if existing_result:
        raise HTTPException(status_code=403, detail="Test already submitted. You cannot retake it.")

    test = db.query(models.CodeTest).filter(models.CodeTest.id == test_id).first()
    if not test: raise HTTPException(status_code=404, detail="Test not found")
    if test.pass_key != pass_key: raise HTTPException(status_code=403, detail="Invalid Pass Key")
    
    return {
        "id": test.id, 
        "title": test.title, 
        "time_limit": test.time_limit, 
        "problems": [
            {
                "id": p.id, 
                "title": p.title, 
                "description": p.description, 
                "test_cases": p.test_cases 
            } for p in test.problems
        ]
    }

@app.post("/api/v1/code-tests/submit")
def submit_test_result(sub: TestSubmission, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    result = models.TestResult(test_id=sub.test_id, user_id=current_user.id, score=sub.score, problems_solved=sub.problems_solved, time_taken=sub.time_taken)
    db.add(result); db.commit(); return {"message": "Test Submitted Successfully!"}

@app.get("/api/v1/code-tests/{test_id}/results")
def get_test_results(test_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403)
    results = db.query(models.TestResult).filter(models.TestResult.test_id == test_id).all()
    return [{"student_name": r.student.full_name, "email": r.student.email, "score": r.score, "problems_solved": r.problems_solved, "time_taken": r.time_taken, "submitted_at": r.submitted_at.strftime("%Y-%m-%d %H:%M")} for r in results]

# ✅ REAL CODE EXECUTION (JUDGE0 PROXY)
@app.post("/api/v1/execute")
def execute_code(req: CodeExecutionRequest, db: Session = Depends(get_db)):
    # ⚠️ REPLACE 'YOUR_RAPIDAPI_KEY_HERE' WITH YOUR REAL KEY
    
    url = "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true"
    
    # 71 = Python 3.8.1 in Judge0
    payload = { "source_code": req.source_code, "language_id": 71, "stdin": req.stdin }
    headers = {
        "content-type": "application/json",
        "X-RapidAPI-Key": "0708d014ebmsh3e0532f99384efbp139119jsn3736fb5bd1c2", 
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        return response.json()
    except Exception as e:
        print(f"Judge0 Error: {e}")
        raise HTTPException(status_code=500, detail="Compiler Service Error")

# ... [Keep existing course/content/player endpoints] ...

@app.get("/api/v1/courses")
def get_courses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == "instructor": return db.query(models.Course).filter(models.Course.instructor_id == current_user.id).all()
    return db.query(models.Course).filter(models.Course.is_published == True).all()

@app.post("/api/v1/courses")
def create_course(course: CourseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_course = models.Course(**course.dict(), instructor_id=current_user.id)
    db.add(new_course); db.commit(); db.refresh(new_course); return new_course

@app.post("/api/v1/courses/{course_id}/modules")
def create_module(course_id: int, module: ModuleCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_module = models.Module(**module.dict(), course_id=course_id)
    db.add(new_module); db.commit(); db.refresh(new_module); return new_module

@app.get("/api/v1/courses/{course_id}/modules")
def get_modules(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Module).filter(models.Module.course_id == course_id).order_by(models.Module.order).all()

@app.post("/api/v1/content")
def add_content(content: ContentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_content = models.ContentItem(title=content.title, type=content.type, content=content.data_url, order=0, module_id=content.module_id, duration=content.duration, is_mandatory=content.is_mandatory, instructions=content.instructions, test_config=content.test_config)
    db.add(new_content); db.commit(); return {"message": "Content added"}

@app.patch("/api/v1/courses/{course_id}/publish")
def publish_course(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    course.is_published = True; db.commit(); return {"message": "Published"}

@app.get("/api/v1/courses/{course_id}/player")
def get_course_player(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course: raise HTTPException(status_code=404)
    enrollment = db.query(models.Enrollment).filter(models.Enrollment.user_id == current_user.id, models.Enrollment.course_id == course_id).first()
    if not enrollment and current_user.role != "instructor": raise HTTPException(status_code=403)
    if enrollment and enrollment.enrollment_type == "trial" and enrollment.expiry_date and datetime.utcnow() > enrollment.expiry_date:
        raise HTTPException(status_code=402, detail="Trial Expired")
    return {"id": course.id, "title": course.title, "modules": [{"id": m.id, "title": m.title, "lessons": [{"id": c.id, "title": c.title, "type": c.type, "url": c.content} for c in m.items]} for m in course.modules]}

@app.post("/api/v1/enroll/{course_id}")
def enroll_student(course_id: int, req: EnrollmentRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    existing = db.query(models.Enrollment).filter(models.Enrollment.user_id == current_user.id, models.Enrollment.course_id == course_id).first()
    if existing:
        if existing.enrollment_type == "trial" and req.type == "paid":
            existing.enrollment_type = "paid"; existing.expiry_date = None; db.commit(); return {"message": "Upgraded"}
        return {"message": "Already enrolled"}
    new_enrollment = models.Enrollment(user_id=current_user.id, course_id=course_id, enrollment_type=req.type, expiry_date=(datetime.utcnow() + timedelta(days=7)) if req.type == "trial" else None)
    db.add(new_enrollment); db.commit(); return {"message": "Enrolled"}

@app.get("/api/v1/generate-pdf/{course_id}")
def generate_pdf_endpoint(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    pdf = create_certificate_pdf(current_user.full_name, course.title, datetime.now().strftime("%B %d, %Y"))
    return StreamingResponse(pdf, media_type="application/pdf")

@app.get("/api/v1/my-courses")
def get_my_courses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    enrollments = db.query(models.Enrollment).filter(models.Enrollment.user_id == current_user.id).all()
    return [e.course for e in enrollments]

@app.post("/api/v1/user/change-password")
def change_password(req: PasswordChange, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    current_user.hashed_password = get_password_hash(req.new_password); db.commit(); return {"message": "Password updated"}

@app.delete("/api/v1/content/{content_id}")
def delete_content(content_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    item = db.query(models.ContentItem).filter(models.ContentItem.id == content_id).first()
    if item: db.delete(item); db.commit(); return {"message": "Deleted"}
    raise HTTPException(status_code=404)

@app.patch("/api/v1/content/{content_id}")
def update_content(content_id: int, update: ContentUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    item = db.query(models.ContentItem).filter(models.ContentItem.id == content_id).first()
    if item: 
        if update.title: item.title = update.title
        if update.url: item.content = update.url
        db.commit(); return {"message": "Updated"}
    raise HTTPException(status_code=404)

# --- ✅ RAZORPAY ENDPOINT (FIXED) ---
@app.post("/api/v1/create-order")
def create_payment_order(data: dict = Body(...)):
    amount = data.get("amount") # Amount in RUPEES (e.g., 599)

    # Razorpay expects amount in PAISE (multiply by 100)
    order_data = {
        "amount": amount * 100, 
        "currency": "INR",
        "payment_capture": 1
    }

    order = client.order.create(data=order_data)
    return order
@app.post("/api/v1/submit-assignment")
async def submit_assignment(
    file: UploadFile = File(...),
    course_title: str = Form(...),
    lesson_title: str = Form(...),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Create a tidy folder structure: "assignments/student_email/CourseName"
    base_folder = "assignments"
    
    # Sanitize email (replace @ and . with _)
    safe_email = current_user.email.replace("@", "_at_").replace(".", "_")
    student_folder = f"{base_folder}/{safe_email}_{current_user.id}"
    
    # Sanitize folder names to prevent errors with spaces/special chars
    safe_course = "".join([c for c in course_title if c.isalnum() or c in (' ', '-', '_')]).strip()
    safe_lesson = "".join([c for c in lesson_title if c.isalnum() or c in (' ', '-', '_')]).strip()
    
    course_folder = f"{student_folder}/{safe_course}"
    
    # Create directory if it doesn't exist
    os.makedirs(course_folder, exist_ok=True)
    
    # 2. Save the file
    file_path = f"{course_folder}/{safe_lesson}_{file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"message": "Assignment received successfully", "path": file_path}

@app.get("/")
def read_root(): return {"status": "online", "message": "iQmath API Active 🟢"}