# 🎓 EduTrack — College Assignment Tracker

Full-stack web app for students and teachers to manage college assignments.

**Tech Stack:**
- **Frontend**: React + Vite → Deployed on **Vercel** (free)
- **Backend**: Node.js + Express + Prisma → Deployed on **Railway** (free)
- **Database**: PostgreSQL → Hosted on **Railway** (free)

---

## 🗂️ Project Structure

```
edutrack/
├── backend/          ← Express API + Prisma ORM
│   ├── server.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── .env.example
│   └── package.json
└── frontend/         ← React + Vite app
    ├── src/
    │   ├── App.jsx
    │   ├── AuthContext.jsx
    │   ├── api/client.js
    │   └── pages/
    │       ├── LoginPage.jsx
    │       ├── RegisterPage.jsx
    │       ├── StudentDashboard.jsx
    │       └── TeacherDashboard.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🚀 DEPLOYMENT GUIDE (Step by Step)

### STEP 1 — Upload Code to GitHub

1. Go to https://github.com → Click **New repository**
2. Name it `edutrack` → Click **Create repository**
3. On your computer, open terminal in the project folder and run:

```bash
git init
git add .
git commit -m "Initial EduTrack commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/edutrack.git
git push -u origin main
```

---

### STEP 2 — Deploy Backend on Railway

**Railway gives you free PostgreSQL + Node.js hosting.**

1. Go to https://railway.app → Sign up with GitHub (free)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `edutrack` repo
4. When asked for the root directory, type: `backend`
5. Railway will auto-detect Node.js

**Add PostgreSQL database:**
6. In your Railway project, click **+ New** → **Database** → **PostgreSQL**
7. After it's created, click on the PostgreSQL service
8. Go to **Variables** tab → Copy the `DATABASE_URL` value

**Set environment variables for the backend service:**
9. Click on your backend service → **Variables** tab → Add these:

```
DATABASE_URL     = (paste the DATABASE_URL you copied)
JWT_SECRET       = my-super-secret-jwt-key-minimum-32-chars-long
NODE_ENV         = production
FRONTEND_URL     = https://YOUR-APP.vercel.app  (fill in after Step 3)
PORT             = 5000
```

10. Railway will auto-deploy. Wait ~2 minutes.
11. Click on your backend service → **Settings** → Copy the **Public Domain** URL
    → It will look like: `https://edutrack-backend.up.railway.app`

---

### STEP 3 — Deploy Frontend on Vercel

1. Go to https://vercel.com → Sign up with GitHub (free)
2. Click **New Project** → Import your `edutrack` GitHub repo
3. Set **Root Directory** to: `frontend`
4. Under **Environment Variables**, add:

```
VITE_API_URL = https://edutrack-backend.up.railway.app
```
(Use the Railway URL from Step 2 Step 11)

5. Click **Deploy** → Wait ~1 minute
6. Copy your Vercel URL (e.g. `https://edutrack.vercel.app`)

**Go back to Railway** and update `FRONTEND_URL` to your Vercel URL.

---

### STEP 4 — Done! 🎉

Your app is live at your Vercel URL.

**Default demo accounts (password: `password123`):**
- Students: priya@college.edu | arjun@college.edu | neha@college.edu | rohan@college.edu
- Teachers: kavita@college.edu | suresh@college.edu

---

## 💻 Run Locally (Development)

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env and set DATABASE_URL to a local or cloud PostgreSQL URL
npm install
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev
# Runs at http://localhost:5000
```

### Frontend
```bash
cd frontend
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:5000
npm install
npm run dev
# Runs at http://localhost:3000
```

---

## 🔌 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register student/teacher |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/assignments | Get all assignments |
| POST | /api/assignments | Create assignment (teacher) |
| PUT | /api/assignments/:id | Update assignment (teacher) |
| DELETE | /api/assignments/:id | Delete assignment (teacher) |
| POST | /api/submissions/:id/submit | Submit assignment (student) |
| PATCH | /api/submissions/:aId/:sId/grade | Grade submission (teacher) |
| GET | /api/users/students | List all students |
| GET | /api/stats | Dashboard stats |
| GET | /health | Health check |

---

## ✨ Features

**Students:**
- View all assignments with due dates & priority
- Filter by subject or status
- Submit assignments with one click
- See grades and teacher feedback
- Progress tracking

**Teachers:**
- Create assignments for all students automatically
- View submission status per student
- Grade submissions with letter grade + feedback
- Delete assignments
- Student overview with completion rates

---

## 🛠️ Troubleshooting

**CORS error on frontend?**
→ Make sure `FRONTEND_URL` in Railway backend env matches your exact Vercel URL (with https://)

**Database connection error?**
→ Verify `DATABASE_URL` is correctly copied from Railway PostgreSQL service

**"Prisma client not generated"?**
→ Run `npx prisma generate` in the backend folder

**Students not seeing assignments after teacher creates one?**
→ The backend auto-creates submissions for all existing students. New students added after won't automatically get submissions for old assignments — this is by design.
