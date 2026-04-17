from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, Integer, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from datetime import datetime, date
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
from io import BytesIO
import uuid
import random
import string
import traceback
import os

# ================= DATABASE =================
DATABASE_URL = "mysql+pymysql://root:@127.0.0.1:3306/mixindo_db"

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# ================= HELPER =================
def generate_project_code(db: Session):
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        existing = db.query(Project).filter(Project.project_code == code).first()
        if not existing:
            return code

# ================= MODEL =================
class Project(Base):
    __tablename__ = "projects"

    id = Column(String(100), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_code = Column(String(4), unique=True, index=True)

    name = Column(String(255))
    description = Column(Text)
    client_name = Column(String(255))
    start_date = Column(Date)
    deadline = Column(Date)

    status = Column(String(50), default="Planning")
    budget = Column(Integer, default=0)
    progress = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(100), primary_key=True)
    project_id = Column(
        String(100),
        ForeignKey("projects.id", ondelete="CASCADE")
    )

    title = Column(String(255))
    status = Column(String(50), default="Pending")

    created_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)

# ================= APP =================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= DB =================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ================= SCHEMA =================
class ProjectCreate(BaseModel):
    name: str
    description: str
    client_name: str
    start_date: date
    deadline: date
    status: str = "Planning"
    budget: int = 0


class ProjectUpdate(BaseModel):
    name: str
    description: str
    client_name: str
    status: str
    budget: int


class TaskCreate(BaseModel):
    project_id: str
    title: str


class TaskUpdate(BaseModel):
    title: str
    status: str

# ================= SERIALIZER =================
def serialize_project(project: Project):
    return {
        "project_code": project.project_code,
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "client_name": project.client_name,
        "start_date": str(project.start_date) if project.start_date else None,
        "deadline": str(project.deadline) if project.deadline else None,
        "status": project.status,
        "budget": project.budget,
        "progress": project.progress
    }

# ================= LOGIC =================
def update_project_progress(project_id: str, db: Session):
    project = db.query(Project).filter(
    (Project.id == project_id) | (Project.project_code == project_id)
).first()
    if not project:
        return

    tasks = db.query(Task).filter(Task.project_id == project.id).all()

    # ===== HITUNG PROGRESS =====
    if len(tasks) == 0:
        project.progress = 0
        project.status = "Planning"
    else:
        done = len([t for t in tasks if t.status == "Done"])
        project.progress = int((done / len(tasks)) * 100)

        # ===== AUTO STATUS =====
        if done == 0:
            project.status = "In Progress"
        elif done == len(tasks):
            project.status = "Completed"
        else:
            project.status = "In Progress"

    db.commit()

# ================= PROJECT =================

@app.get("/api/v1/projects")
def get_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    return [serialize_project(p) for p in projects]


@app.get("/api/v1/projects/{project_id}")
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project tidak ditemukan")

    return serialize_project(project)


@app.post("/api/v1/projects")
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    try:
        new_project = Project(
            **project.model_dump(),
            project_code=generate_project_code(db)
        )
        db.add(new_project)
        db.commit()
        db.refresh(new_project)
        return serialize_project(new_project)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/v1/projects/{project_id}")
def update_project(project_id: str, data: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project tidak ditemukan")

    project.name = data.name
    project.description = data.description
    project.client_name = data.client_name
    project.status = data.status
    project.budget = data.budget

    db.commit()

    update_project_progress(project_id, db)

    return {"message": "Project berhasil diupdate"}


@app.delete("/api/v1/projects/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project tidak ditemukan")

    db.delete(project)
    db.commit()

    return {"message": "Project berhasil dihapus"}

# ================= PENGUJIAN (TASK) =================

@app.post("/api/v1/tasks")
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    try:
        new_task = Task(
            id=str(uuid.uuid4()),
            **task.model_dump()
        )
        db.add(new_task)
        db.commit()

        update_project_progress(task.project_id, db)

        return {"message": "Pengujian berhasil dibuat"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/v1/tasks/{task_id}")
def update_task(task_id: str, data: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Pengujian tidak ditemukan")

    task.title = data.title
    task.status = data.status

    db.commit()

    update_project_progress(task.project_id, db)

    return {"message": "Pengujian berhasil diupdate"}


@app.delete("/api/v1/tasks/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Pengujian tidak ditemukan")

    project_id = task.project_id

    db.delete(task)
    db.commit()

    update_project_progress(project_id, db)

    return {"message": "Pengujian berhasil dihapus"}

@app.get("/api/v1/projects/{project_id}/tasks")
def get_tasks_by_project(project_id: str, db: Session = Depends(get_db)):
    tasks = db.query(Task).filter(Task.project_id == project_id).all()

    return [
        {
            "id": t.id,
            "title": t.title,
            "status": t.status
        }
        for t in tasks
    ]

@app.get("/api/v1/projects/{project_id}/report")
def generate_report(project_id: str, db: Session = Depends(get_db)):
    try:
        # ✅ SUPPORT ID + PROJECT CODE
        project = db.query(Project).filter(
            (Project.id == project_id) | (Project.project_code == project_id)
        ).first()

        if not project:
            raise HTTPException(status_code=404, detail="Project tidak ditemukan")

        tasks = db.query(Task).filter(Task.project_id == project.id).all()

        # ================= PDF =================
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet

        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer)
        styles = getSampleStyleSheet()
        elements = []

        # HEADER
        elements.append(Paragraph("<b>LAPORAN PROYEK</b>", styles['Title']))
        elements.append(Spacer(1, 10))

        elements.append(Paragraph(f"Nama: {project.name}", styles['Normal']))
        elements.append(Paragraph(f"Kode: {project.project_code}", styles['Normal']))
        elements.append(Paragraph(f"Client: {project.client_name}", styles['Normal']))
        elements.append(Paragraph(f"Status: {project.status}", styles['Normal']))
        elements.append(Paragraph(f"Progress: {project.progress}%", styles['Normal']))
        elements.append(Paragraph(f"Start Date: {project.start_date}", styles['Normal']))
        elements.append(Paragraph(f"Deadline: {project.deadline}", styles['Normal']))
        elements.append(Paragraph(f"Deskripsi: {project.description or '-'}", styles['Normal']))

        elements.append(Spacer(1, 15))
        elements.append(Paragraph("<b>Detail Pengujian</b>", styles['Heading2']))
        elements.append(Spacer(1, 10))

        if not tasks:
            elements.append(Paragraph("Belum ada pengujian", styles['Normal']))
        else:
            for t in tasks:
                elements.append(
                    Paragraph(f"- {t.title} ({t.status})", styles['Normal'])
                )

        doc.build(elements)

        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=report_{project.project_code}.pdf"
            }
        )

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))