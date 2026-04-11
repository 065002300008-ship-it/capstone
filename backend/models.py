from sqlalchemy import Column, String, Integer, Date, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Project(Base):
    __tablename__ = "projects"
    id = Column(String(100), primary_key=True, index=True)
    name = Column(String(255))
    client_name = Column(String(255))
    start_date = Column(Date)
    deadline = Column(Date)
    status = Column(String(100), default="Planning")
    progress = Column(Integer, default=0)

class Test(Base):
    __tablename__ = "tests"
    id = Column(String(100), primary_key=True, index=True)
    project_name = Column(String(255))  # Harus sama dengan frontend
    test_type = Column(String(255))
    test_date = Column(Date)
    status = Column(String(100), default="On Progress")
    result = Column(String(100), default="Pending")

class Report(Base):
    __tablename__ = "reports"
    id = Column(String(100), primary_key=True, index=True)
    title = Column(String(255))
    project_name = Column(String(255))   # Sinkron dengan frontend
    status = Column(String(100), default="Generated")
    created_at = Column(DateTime, default=datetime.utcnow)

class Document(Base):
    __tablename__ = "documents"
    id = Column(String(100), primary_key=True, index=True)
    name = Column(String(255))
    category = Column(String(100))
    project_id = Column(String(100))
    upload_date = Column(Date, default=datetime.utcnow)
    file_size = Column(String(50))
    file_path = Column(String(500))