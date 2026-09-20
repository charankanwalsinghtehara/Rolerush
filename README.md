# RoleRush — AI Career Copilot

RoleRush is a modular full-stack career practice app: resume intelligence, role matching,
mock interviews, voice interviews, job tracking, and plan-based usage.

## Project layout

The backend is deliberately organized around product areas instead of one giant feature file:

- `backend/accounts/` — account boundary
- `backend/resumes/` — resume boundary
- `backend/interviews/` — text + voice interview boundary and provider adapters
- `backend/jobs/` — jobs and application boundary
- `backend/billing/` — plans and payment boundary
- `backend/career/` — progress and challenge boundary
- `backend/api/` — compatibility API gateway used by the React client

The gateway keeps the original endpoints working while the product areas have clear homes.
This makes it easier for a human developer to extend one feature without touching the whole app.

## Voice Interview

The new Voice Interview page uses browser-native speech recognition where available:

1. RoleRush starts a normal interview.
2. The browser asks for microphone permission.
3. Speech Recognition turns the answer into text.
4. The transcript is sent to the Django interview endpoint.
5. The existing scoring engine evaluates the answer.
6. Speech Synthesis reads the next interviewer question aloud.
7. The final scorecard is generated like the text interview.

The server has a small `interviews/providers.py` adapter boundary so a hosted STT/TTS
provider can be added later without rewriting the interview UI.

For Chrome/Edge, allow microphone access for the local development site.

## Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment

Copy the example environment files and add production values when deploying.

Razorpay keys belong in `backend/.env`:

```text
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

## Deploy on Render

Create a new Render Blueprint from this repository. The root `render.yaml` creates
the Django API, React static site, and a PostgreSQL database. After the services are
created, set these values in Render:

- `SECRET_KEY` on `rolerush-api`
- `CORS_ALLOWED_ORIGINS` on `rolerush-api` to the full React site URL
- `VITE_API_URL` on `rolerush-web` to the full API URL ending in `/api`
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` on `rolerush-api` if billing is enabled

Redeploy the web service after changing `VITE_API_URL`, because Vite embeds it at build time.

## Notes

This is a production-oriented MVP foundation, not a claim of a fully audited SaaS.
The demo job feed is database-backed, the scoring engine has a deterministic fallback,
and browser voice mode avoids forcing a paid speech provider during local development.
