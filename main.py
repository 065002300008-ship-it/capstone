"""
Root entrypoint for local development.

Run from the project root:
  uvicorn main:app --reload
"""

from backend.main import app  # noqa: F401

