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
import smtplib
import random
import string
import pandas as pd     
import requests 
import razorpay
import google.generativeai as genai 
import re  
from dotenv import load_dotenv

# --- 📄 PDF GENERATION IMPORTS ---
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# 🟢 NEW GOOGLE DRIVE IMPORTS (OAUTH)
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload

# Load environment variables
load_dotenv()

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
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/login") 

# --- 💳 RAZORPAY CONFIGURATION ---
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# --- ✨ GEMINI AI CONFIGURATION ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

# --- 🗄️ DATABASE UTILITIES ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 📋 DATA MODELS ---
class UserCreate(BaseModel):
    email: str; password: str; name: str; role: str; phone_number: str

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
    password: Optional[str] = None 

class EnrollmentRequest(BaseModel):
    type: str 

class PasswordChange(BaseModel):
    new_password: str

# Code Test Models
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

class AIGenerateRequest(BaseModel):
    title: str

# ✅ NEW: Live Session Model
class LiveSessionRequest(BaseModel):
    youtube_url: str
    topic: str

class CourseCreate(BaseModel):
    title: str; description: str; price: int; image_url: Optional[str] = None
    course_type: str = "standard" # Added
    language: Optional[str] = None # Added

class ChallengeCreate(BaseModel):
    title: str
    description: str
    difficulty: str
    test_cases: str # JSON string
    
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

# ✅ FIXED: Email Sender
def send_credentials_email(to_email: str, name: str, password: str):
    sender_email = os.getenv("EMAIL_SENDER")
    sender_password = os.getenv("EMAIL_PASSWORD")
    smtp_server = "smtp.gmail.com"
    smtp_port = 587

    subject = "Welcome to iQmath! Here are your credentials"
    
    body = f"""
    Welcome to iQmath {name} !,
    
    User ID: {to_email}
    Password: {password}

    "Education is the passport to the future,
    for tomorrow belongs to those who prepare for it today."
    """

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        print(f"✅ Email sent successfully to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
 
# 🟢 UPDATED: Upload to Drive using TOKEN.JSON (OAuth)
def upload_file_to_drive(file_obj, filename, folder_link):
    try:
        # A. Extract Folder ID
        folder_id = folder_link
        if "drive.google.com" in folder_link:
            folder_id = folder_link.split("/")[-1].split("?")[0]

        # B. Authenticate using token.json
        TOKEN_FILE = 'token.json'
        creds = None
        
        if os.path.exists(TOKEN_FILE):
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, ['https://www.googleapis.com/auth/drive.file'])
        
        # If no valid credentials available, fail gracefully
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                    # Save refreshed token
                    with open(TOKEN_FILE, 'w') as token:
                        token.write(creds.to_json())
                except:
                    print("❌ Token expired and refresh failed.")
                    return None
            else:
                print("❌ Error: Valid token.json not found! Run get_token.py first.")
                return None

        service = build('drive', 'v3', credentials=creds)

        # C. Upload Config
        file_metadata = {
            'name': filename,
            'parents': [folder_id] 
        }

        # D. Execute Upload
        media = MediaIoBaseUpload(file_obj, mimetype='application/pdf', resumable=True)
        uploaded_file = service.files().create(
            body=file_metadata, 
            media_body=media, 
            fields='id'
        ).execute()

        print(f"✅ Google Drive Upload Success! File ID: {uploaded_file.get('id')}")
        return uploaded_file.get('id')

    except Exception as e:
        print(f"🔥 Google Drive Upload Failed: {str(e)}")
        return None
            
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
    
    # ✅ Save phone number here
    new_user = models.User(
        email=user.email, 
        hashed_password=get_password_hash(user.password), 
        full_name=user.name, 
        role=user.role,
        phone_number=user.phone_number # <--- ADD THIS
    )
    db.add(new_user)
    db.commit()
    return {"message": "User created successfully"}

@app.post("/api/v1/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "role": user.role}

# ✅ FIXED: Now calls send_credentials_email
@app.post("/api/v1/admin/admit-student")
def admit_single_student(req: AdmitStudentRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403, detail="Only Instructors can admit students")
    
    existing_user = db.query(models.User).filter(models.User.email == req.email).first()
    student = existing_user
    
    # Generate password if not provided (fallback)
    final_password = req.password if req.password else generate_random_password()

    if not student:
        student = models.User(email=req.email, full_name=req.full_name, hashed_password=get_password_hash(final_password), role="student")
        db.add(student); db.commit(); db.refresh(student)
        
        # 🚀 TRIGGER EMAIL HERE
        send_credentials_email(req.email, req.full_name, final_password)
    
    enrolled = []
    for cid in req.course_ids:
        if not db.query(models.Enrollment).filter(models.Enrollment.user_id == student.id, models.Enrollment.course_id == cid).first():
            db.add(models.Enrollment(user_id=student.id, course_id=cid))
            enrolled.append(cid)
    db.commit()
    return {"message": f"Enrolled in {len(enrolled)} courses"}

# ✅ FIXED: Now calls send_credentials_email for each row
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
        name = str(row.get("name", "Student"))
        
        if not email or email == "nan": continue
        
        student = db.query(models.User).filter(models.User.email == email).first()
        if not student:
            # Generate random password for bulk user
            bulk_password = generate_random_password()
            student = models.User(email=email, full_name=name, hashed_password=get_password_hash(bulk_password), role="student")
            db.add(student); db.commit(); db.refresh(student)
            
            # 🚀 TRIGGER EMAIL HERE
            send_credentials_email(email, name, bulk_password)
        
        if not db.query(models.Enrollment).filter(models.Enrollment.user_id == student.id, models.Enrollment.course_id == course_id).first():
            db.add(models.Enrollment(user_id=student.id, course_id=course_id))
            count += 1
    db.commit()
    return {"message": f"Enrolled {count} students"}

# --- CODE ARENA & OTHER ENDPOINTS (UNCHANGED) ---
@app.post("/api/v1/ai/generate")
async def generate_problem_content(req: AIGenerateRequest, db: Session = Depends(get_db)):
    if not GEMINI_API_KEY:
        print("❌ Error: API Key is missing.")
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")

    try:
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
        print(f"🤖 Sending request to Gemini for: {req.title}")
        response = model.generate_content(prompt)
        text = response.text.strip()
        match = re.search(r'\{.*\}', text, re.DOTALL)
        
        if not match: raise ValueError("AI did not return valid JSON format.")
            
        clean_json = match.group()
        ai_data = json.loads(clean_json)
        print("✅ AI Generation Successful!")
        return {
            "description": ai_data.get("description", "No description generated."),
            "test_cases": json.dumps(ai_data.get("test_cases", [])) 
        }

    except Exception as e:
        print(f"🔥 AI GENERATION FAILED: {str(e)}")
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

@app.get("/api/v1/courses/{course_id}")
def get_course_details(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Fetch the course
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    
    # 2. Security check (Optional: Ensure only instructor or enrolled student can view)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    return course

@app.get("/api/v1/code-tests")
def get_code_tests(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == "instructor": 
        return db.query(models.CodeTest).filter(models.CodeTest.instructor_id == current_user.id).all()
    tests = db.query(models.CodeTest).all()
    response_data = []
    for t in tests:
        submission = db.query(models.TestResult).filter(models.TestResult.test_id == t.id, models.TestResult.user_id == current_user.id).first()
        response_data.append({
            "id": t.id, "title": t.title, "time_limit": t.time_limit, "problems": t.problems, "completed": True if submission else False
        })
    return response_data

@app.post("/api/v1/code-tests/{test_id}/start")
def start_code_test(test_id: int, pass_key: str = Form(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    existing_result = db.query(models.TestResult).filter(models.TestResult.test_id == test_id, models.TestResult.user_id == current_user.id).first()
    if existing_result: raise HTTPException(status_code=403, detail="Test already submitted. You cannot retake it.")
    test = db.query(models.CodeTest).filter(models.CodeTest.id == test_id).first()
    if not test: raise HTTPException(status_code=404, detail="Test not found")
    if test.pass_key != pass_key: raise HTTPException(status_code=403, detail="Invalid Pass Key")
    return {
        "id": test.id, "title": test.title, "time_limit": test.time_limit, 
        "problems": [{"id": p.id, "title": p.title, "description": p.description, "test_cases": p.test_cases} for p in test.problems]
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

# ✅ UPDATE: USE KEYS FROM ENV FOR JUDGE0
@app.post("/api/v1/execute")
def execute_code(req: CodeExecutionRequest, db: Session = Depends(get_db)):
    url = f"https://{os.getenv('JUDGE0_API_HOST')}/submissions?base64_encoded=false&wait=true"
    payload = { "source_code": req.source_code, "language_id": 71, "stdin": req.stdin }
    headers = { 
        "content-type": "application/json", 
        "X-RapidAPI-Key": os.getenv("JUDGE0_API_KEY"), 
        "X-RapidAPI-Host": os.getenv("JUDGE0_API_HOST") 
    }
    try:
        response = requests.post(url, json=payload, headers=headers)
        return response.json()
    except Exception as e:
        print(f"Judge0 Error: {e}")
        raise HTTPException(status_code=500, detail="Compiler Service Error")

@app.get("/api/v1/courses")
def get_courses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == "instructor": return db.query(models.Course).filter(models.Course.instructor_id == current_user.id).all()
    return db.query(models.Course).filter(models.Course.is_published == True).all()

@app.post("/api/v1/courses")
def create_course(course: CourseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Logic to handle Course Type
    new_course = models.Course(
        title=course.title, 
        description=course.description, 
        price=course.price, 
        image_url=course.image_url,
        instructor_id=current_user.id,
        course_type=course.course_type, # New
        language=course.language # New
    )
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
    
    # ✅ FIX: Added test_config, instructions, and other fields to the response
    return {
        "id": course.id, 
        "title": course.title, 
        "course_type": course.course_type, # <--- NEW LINE
        "language": course.language,       # <--- NEW LINE
        "modules": [
            {
                "id": m.id, 
                "title": m.title, 
                "lessons": [
                    {
                        "id": c.id, 
                        "title": c.title, 
                        "type": c.type, 
                        "url": c.content, 
                        "test_config": c.test_config,   # <--- CRITICAL FIX FOR CODE ARENA
                        "instructions": c.instructions, # <--- CRITICAL FIX FOR ASSIGNMENTS
                        "duration": c.duration,
                        "is_mandatory": c.is_mandatory
                    } for c in m.items
                ]
            } for m in course.modules
        ]
    }

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

@app.post("/api/v1/create-order")
def create_payment_order(data: dict = Body(...)):
    amount = data.get("amount") 
    order_data = { "amount": amount * 100, "currency": "INR", "payment_capture": 1 }
    order = client.order.create(data=order_data)
    return order

@app.post("/api/v1/submit-assignment")
async def submit_assignment(
    file: UploadFile = File(...),
    lesson_title: str = Form(...), 
    course_title: str = Form(...),
    db: Session = Depends(get_db),
    # ✅ FIX: Removed 'auth.' prefix here
    current_user: models.User = Depends(get_current_user)
):
    print(f"📥 Receiving Assignment: {file.filename} from {current_user.full_name}")

    # 1. Look up the Assignment in DB to find the Instructor's Drive Link
    # We search for the content item by title and type
    assignment_data = db.query(models.ContentItem).filter(
        models.ContentItem.title == lesson_title,
        models.ContentItem.type == "assignment"
    ).first()

    drive_status = "Not Uploaded"
    
    # 2. Read the file
    content = await file.read()
    
    # 3. Create a unique filename (Student Name + Original File Name)
    safe_filename = f"{current_user.full_name}_{file.filename}"

    # 4. Attempt Upload to Drive
    if assignment_data and assignment_data.content: # Use .content instead of .data_url if model uses content
        instructor_folder_link = assignment_data.content # Changed to match model field 'content'
        print(f"🔗 Found Target Drive Link: {instructor_folder_link}")
        
        # Create a stream for the upload function
        file_stream = io.BytesIO(content)
        
        # 🚀 THE MAGIC UPLOAD
        file_id = upload_file_to_drive(file_stream, safe_filename, instructor_folder_link)
        
        if file_id:
            drive_status = "✅ Successfully sent to Instructor's Drive"
        else:
            drive_status = "⚠️ Drive Upload Failed (Check Backend Console)"
    else:
        print("⚠️ No Drive Link found in database for this assignment.")
        drive_status = "Skipped (No Folder Link Configured)"

    # 5. Local Backup (Optional but safe)
    os.makedirs("assignments_backup", exist_ok=True)
    with open(f"assignments_backup/{safe_filename}", "wb") as f:
        f.write(content)

    return {
        "message": "Assignment Submitted Successfully",
        "drive_status": drive_status
    }

@app.get("/api/v1/admin/students")
def get_all_students(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Security: Only instructors can view this
    if current_user.role != "instructor": 
        raise HTTPException(status_code=403, detail="Access Denied")
    
    # 1. Get all users who are 'students'
    students = db.query(models.User).filter(models.User.role == "student").all()
    
    real_data = []
    for s in students:
        # 2. Get their enrolled courses
        enrollments = db.query(models.Enrollment).filter(models.Enrollment.user_id == s.id).all()
        course_ids = [e.course_id for e in enrollments]
        
        # Fetch course names securely
        if course_ids:
            courses = db.query(models.Course).filter(models.Course.id.in_(course_ids)).all()
            course_names = [c.title for c in courses]
        else:
            course_names = []

        # 3. Format Date (Handle cases where created_at might be missing)
        join_date = s.created_at.strftime("%Y-%m-%d") if hasattr(s, "created_at") and s.created_at else "N/A"

        real_data.append({
            "id": s.id,
            "full_name": s.full_name,
            "email": s.email,
            "joined_at": join_date,
            "enrolled_courses": course_names
        })
        
    return real_data

@app.delete("/api/v1/admin/students/{user_id}")
def delete_student(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": 
        raise HTTPException(status_code=403, detail="Access Denied")
        
    student = db.query(models.User).filter(models.User.id == user_id).first()
    if not student: 
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Optional: Delete their enrollments first to be clean
    db.query(models.Enrollment).filter(models.Enrollment.user_id == user_id).delete()
    db.query(models.TestResult).filter(models.TestResult.user_id == user_id).delete()
    
    # Delete the user
    db.delete(student)
    db.commit()
    
    return {"message": "Student removed successfully"}

@app.delete("/api/v1/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": 
        raise HTTPException(status_code=403, detail="Access Denied")
    
    # Find course owned by this instructor
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.instructor_id == current_user.id).first()
    
    if not course: 
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Delete the course (Cascades should handle modules/content if configured in DB, otherwise this removes the course entry)
    db.delete(course)
    db.commit()
    
    return {"message": "Course deleted successfully"}

# ✅ NEW ENDPOINTS FOR LIVE SESSIONS
@app.post("/api/v1/live/start")
def start_live_session(req: LiveSessionRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403)
    
    # Deactivate old sessions for this instructor
    old_sessions = db.query(models.LiveSession).filter(models.LiveSession.instructor_id == current_user.id, models.LiveSession.is_active == True).all()
    for s in old_sessions:
        s.is_active = False
    
    new_session = models.LiveSession(
        instructor_id=current_user.id,
        youtube_url=req.youtube_url,
        topic=req.topic,
        is_active=True
    )
    db.add(new_session); db.commit(); db.refresh(new_session)
    return {"message": "Live session started", "session_id": new_session.id}

@app.get("/api/v1/live/active")
def get_active_live_sessions(db: Session = Depends(get_db)):
    return db.query(models.LiveSession).filter(models.LiveSession.is_active == True).all()

@app.post("/api/v1/live/end/{session_id}")
def end_live_session(session_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403)
    session = db.query(models.LiveSession).filter(models.LiveSession.id == session_id).first()
    if session:
        session.is_active = False
        db.commit()
    return {"message": "Session ended"}

@app.post("/api/v1/courses/{course_id}/challenges")
def add_challenge(course_id: int, chal: ChallengeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403)
    
    # Limit check: Max 20 per difficulty
    count = db.query(models.CourseChallenge).filter(
        models.CourseChallenge.course_id == course_id, 
        models.CourseChallenge.difficulty == chal.difficulty
    ).count()
    
    if count >= 20:
        raise HTTPException(status_code=400, detail=f"Limit reached for {chal.difficulty} section (Max 20)")

    new_chal = models.CourseChallenge(
        course_id=course_id, title=chal.title, description=chal.description, 
        difficulty=chal.difficulty, test_cases=chal.test_cases
    )
    db.add(new_chal); db.commit(); return {"message": "Challenge Added"}

@app.get("/api/v1/courses/{course_id}/challenges")
def get_challenges(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # For Instructor: Return all raw data
    # For Student: We also need to return "is_solved" status
    challenges = db.query(models.CourseChallenge).filter(models.CourseChallenge.course_id == course_id).all()
    
    progress_map = {}
    if current_user.role == "student":
        progs = db.query(models.ChallengeProgress).filter(models.ChallengeProgress.user_id == current_user.id).all()
        progress_map = {p.challenge_id: p.is_solved for p in progs}

    return [{
        "id": c.id, "title": c.title, "description": c.description, 
        "difficulty": c.difficulty, "test_cases": c.test_cases,
        "is_solved": progress_map.get(c.id, False)
    } for c in challenges]

@app.post("/api/v1/challenges/{challenge_id}/solve")
def mark_challenge_solved(challenge_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # This is called ONLY when the frontend Judge0 verifies all test cases passed
    prog = db.query(models.ChallengeProgress).filter(
        models.ChallengeProgress.user_id == current_user.id,
        models.ChallengeProgress.challenge_id == challenge_id
    ).first()
    
    if not prog:
        prog = models.ChallengeProgress(user_id=current_user.id, challenge_id=challenge_id, is_solved=True)
        db.add(prog)
    else:
        prog.is_solved = True
        
    db.commit()
    return {"message": "Problem Solved!"}

@app.post("/api/v1/ai/generate-challenge")
async def generate_challenge_ai(req: AIGenerateRequest):
    # 1. Reuse API Key Validation
    if not GEMINI_API_KEY or "PASTE_YOUR" in GEMINI_API_KEY:
        print("❌ Error: API Key is missing or default.")
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")

    try:
        # 2. NEW Prompt specifically for Coding Challenges
        prompt = f"""
        Act as a strict coding instructor.
        Create a coding problem based on the topic: "{req.title}".

        REQUIRED OUTPUT FORMAT (JSON ONLY):
        {{
            "description": "A clear, concise problem statement explaining what the code should do.",
            "test_cases": [
                {{"input": "example_input", "output": "expected_output", "hidden": false}},
                {{"input": "test_input_2", "output": "test_output_2", "hidden": false}},
                {{"input": "edge_case", "output": "edge_output", "hidden": true}}
            ]
        }}

        Do NOT wrap in markdown code blocks. Return ONLY the raw JSON string.
        """
        
        print(f"🤖 Sending Challenge request to Gemini for: {req.title}")
        
        # 3. Reuse Existing Execution & Parsing Logic
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Extract JSON using Regex (Robust against markdown wrapping)
        match = re.search(r'\{.*\}', text, re.DOTALL)
        
        if not match: 
            raise ValueError("AI did not return valid JSON format.")
            
        clean_json = match.group()
        ai_data = json.loads(clean_json)
        
        print("✅ AI Challenge Generation Successful!")
        
        # 4. Return formatted response (Matches frontend expectations)
        return {
            "description": ai_data.get("description", "No description generated."),
            # We json.dumps the test_cases so they are sent as a string, 
            # consistent with your existing data structure
            "test_cases": json.dumps(ai_data.get("test_cases", [])) 
        }

    except Exception as e:
        print(f"🔥 AI CHALLENGE GENERATION FAILED: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")
    
@app.get("/")
def read_root(): return {"status": "online", "message": "iQmath API Active 🟢"}