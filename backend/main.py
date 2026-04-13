from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, Integer, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from datetime import datetime, date
from pydantic import BaseModel
import uuid

# ================= DATABASE =================
DATABASE_URL = "mysql+pymysql://root:@127.0.0.1:3306/mixindo_db"

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# ================= MODEL =================
class Project(Base):
    __tablename__ = "projects"

    id = Column(String(100), primary_key=True, default=lambda: str(uuid.uuid4()))
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

    id = Column(String(100), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(
    String(100),
    ForeignKey("projects.id", ondelete="CASCADE")
)
    title = Column(String(255))
    status = Column(String(50), default="Pending")

    created_at = Column(DateTime, default=datetime.utcnow)


# AUTO CREATE TABLE
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
    status: str


# ================= HELPER =================
def serialize_project(project: Project):
    return {
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
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return

    if project.status == "Completed":
        project.progress = 100
        db.commit()
        return

    tasks = db.query(Task).filter(Task.project_id == project_id).all()

    if len(tasks) == 0:
        project.progress = 0
    else:
        done = len([t for t in tasks if t.status == "Done"])
        project.progress = int((done / len(tasks)) * 100)

    db.commit()


# ================= PROJECT =================

# GET ALL
@app.get("/api/v1/projects")
def get_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    return [serialize_project(p) for p in projects]


# ✅ GET DETAIL (FIX UTAMA)
@app.get("/api/v1/projects/{project_id}")
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project tidak ditemukan")

    return serialize_project(project)


# CREATE (ID AUTO)
@app.post("/api/v1/projects")
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    try:
        new_project = Project(**project.model_dump())
        db.add(new_project)
        db.commit()
        db.refresh(new_project)
        return serialize_project(new_project)
    except Exception as e:
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))


# UPDATE
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


# DELETE
@app.delete("/api/v1/projects/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project tidak ditemukan")

    db.delete(project)
    db.commit()

    return {"message": "Project berhasil dihapus"}


# ================= TASK =================

@app.post("/api/v1/tasks")
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    try:
        new_task = Task(**task.model_dump())
        db.add(new_task)
        db.commit()

        update_project_progress(task.project_id, db)

        return {"message": "Task berhasil dibuat"}
    except Exception as e:
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/v1/tasks/{task_id}")
def update_task(task_id: str, data: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task tidak ditemukan")

    task.status = data.status
    db.commit()

    update_project_progress(task.project_id, db)

    return {"message": "Task berhasil diupdate"}

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

@app.get("/api/v1/tests")
def get_tests():
    return []