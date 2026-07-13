# CivicPulse — AI-Powered Municipal Grievance Redressal System

CivicPulse is an AI-powered civic tech platform that allows citizens to report municipal complaints, track their status, and simulate the impact of policy decisions — all in one place.

---

## Live Links

- **Frontend (Citizen Portal):** https://civic-pulse-seven-pi.vercel.app
- **Backend API:** https://civicpulse-backend-6d08.onrender.com
- **API Documentation:** https://civicpulse-backend-6d08.onrender.com/docs
- **Dashboard:** https://civicpulse-dashboard-mauve.vercel.app/

---

## What It Does

Citizens can report civic issues like potholes, water supply failures, garbage overflow, and broken streetlights. The AI backend automatically understands the complaint, categorizes it, scores its urgency, routes it to the correct government department, and drafts a formal communication to the officer — all without any human involvement.

Officers and admins can view all complaints sorted by priority on the admin dashboard, and citizens can track the status of their complaint in real time.

The Policy Playground lets citizens simulate what would happen if the municipal budget were spent differently — and file their policy recommendation as a real complaint to the municipality.


---

## Tech Stack

**Backend**
- Python + FastAPI
- Google Gemini 2.5 Flash (AI agents)
- Neo4j AuraDB (graph database)
- APScheduler (auto-escalation every 2 hours)
- Deployed on Render

**Frontend**
- React + Vite
- Tailwind CSS
- Recharts (data visualization)
- React Leaflet (maps)
- Deployed on Vercel

---

## How the AI Works

When a citizen submits a complaint, 5 AI agents run in sequence:

1. **Agent 1 — Understand:** Reads the complaint and extracts category, urgency, location, affected people estimate, and a one-line summary
2. **Agent 2 — Route:** Maps the category to the correct government department and officer email
3. **Agent 3 — Prioritize:** Scores the complaint from 1–100 based on urgency, affected people, and whether it is a repeat complaint from the same area
4. **Agent 4 — Draft Communication:** Writes a formal official letter to the assigned officer
5. **Agent 5 — Escalate:** If a complaint is ignored for 48+ hours, automatically drafts an escalation notice to the senior officer

---

## Key Features

- Natural language complaint submission — no forms, just type what happened
- AI automatically extracts category, urgency, location, and affected people
- Priority scoring from 1–100 so officers know what to fix first
- Formal officer communication drafted automatically
- Auto-escalation if complaints are ignored for 48 hours
- Real-time complaint tracking with SLA countdown
- Policy Playground — simulate municipal budget decisions and download a PDF report
- Admin dashboard with complaint analytics and charts
- Fully deployed and live

---
