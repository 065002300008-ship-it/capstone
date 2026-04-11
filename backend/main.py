from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date
import models, database

#vira

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= SCHEMA =================

class ProjectCreate(BaseModel):
    id: str
    name: str
    client_name: str
    start_date: date
    deadline: date
    status: str = "Planning"
    progress: int = 0

class TestCreate(BaseModel):
    id: str
    project_name: str
    test_type: str
    test_date: date
    status: str = "On Progress"
    result: str = "Pending"

class ReportCreate(BaseModel):
    id: str
    title: str
    project_name: str
    status: str = "Generated"

# ================= PROJECT =================

@app.get("/api/v1/projects")
def get_projects(db: Session = Depends(database.get_db)):
    return db.query(models.Project).all()

@app.post("/api/v1/projects")
def create_project(project: ProjectCreate, db: Session = Depends(database.get_db)):
    existing = db.query(models.Project).filter(models.Project.id == project.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="ID Proyek sudah terdaftar")
    new_project = models.Project(**project.model_dump())
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

# ================= TEST =================

@app.get("/api/v1/tests")
def get_tests(db: Session = Depends(database.get_db)):
    return db.query(models.Test).all()

@app.post("/api/v1/tests")
def create_test(test: TestCreate, db: Session = Depends(database.get_db)):
    existing = db.query(models.Test).filter(models.Test.id == test.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="ID Test sudah digunakan")
    new_test = models.Test(**test.model_dump())
    db.add(new_test)
    db.commit()
    db.refresh(new_test)
    return new_test

# ================= REPORT =================

@app.get("/api/v1/reports")
def get_reports(db: Session = Depends(database.get_db)):
    return db.query(models.Report).all()

@app.post("/api/v1/reports")
def create_report(report: ReportCreate, db: Session = Depends(database.get_db)):
    existing = db.query(models.Report).filter(models.Report.id == report.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="ID Laporan sudah digunakan")
    new_report = models.Report(**report.model_dump())
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report

@app.delete("/api/v1/reports/{id}")
def delete_report(id: str, db: Session = Depends(database.get_db)):
    report = db.query(models.Report).filter(models.Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    db.delete(report)
    db.commit()
    return {"detail": "Laporan berhasil dihapus"}

# ================= DOCUMENT =================

@app.get("/api/v1/documents")
def get_documents(db: Session = Depends(database.get_db)):
    return db.query(models.Document).all()