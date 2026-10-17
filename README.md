# Cosmic Eye

A public web app that helps people explore NASA SPHEREx infrared observations,
compare compatible images, and understand what the data shows — and doesn't show.

Built for the **2026 NASA Space Apps Challenge — "Planet X and SPHEREx"**.
Team-built prototype. Not an official NASA product.

## Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Python 3.11 + FastAPI + Astropy
- **Data:** NASA/IPAC IRSA, SPHEREx Quick Release 2 via SIA2

## Prerequisites

- Python 3.11
- Node.js 20 or 22
- Git

## Backend setup

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
