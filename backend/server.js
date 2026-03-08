const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

dotenv.config();
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "edutrack-secret-key-change-in-production";

// ─── MIDDLEWARE ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));
app.use(express.json());

// Auth middleware
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!req.user) return res.status(401).json({ error: "User not found" });
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

const requireTeacher = (req, res, next) => {
  if (req.user.role !== "TEACHER") return res.status(403).json({ error: "Teachers only" });
  next();
};

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "EduTrack API running ✅", version: "1.0.0" }));
app.get("/health", (req, res) => res.json({ status: "ok" }));

// ─── AUTH ROUTES ──────────────────────────────────────────────
app.post("/api/auth/register", [
  body("name").trim().notEmpty(),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("role").isIn(["STUDENT", "TEACHER"]),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, role, batch, subject } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role, batch, subject, avatar: initials }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    const { password: _, ...userSafe } = user;
    res.status(201).json({ token, user: userSafe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/login", [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    const { password: _, ...userSafe } = user;
    res.json({ token, user: userSafe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/auth/me", authenticate, (req, res) => {
  const { password: _, ...userSafe } = req.user;
  res.json(userSafe);
});

// ─── USER ROUTES ──────────────────────────────────────────────
app.get("/api/users/students", authenticate, async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true, name: true, email: true, avatar: true, batch: true, role: true }
    });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── ASSIGNMENT ROUTES ────────────────────────────────────────
// Get all assignments (with submissions)
app.get("/api/assignments", authenticate, async (req, res) => {
  try {
    const where = req.user.role === "TEACHER" ? {} : {};

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        teacher: { select: { id: true, name: true, avatar: true, subject: true } },
        submissions: {
          include: {
            student: { select: { id: true, name: true, avatar: true, email: true } }
          }
        }
      },
      orderBy: { dueDate: "asc" }
    });

    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get single assignment
app.get("/api/assignments/:id", authenticate, async (req, res) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id },
      include: {
        teacher: { select: { id: true, name: true, avatar: true } },
        submissions: {
          include: {
            student: { select: { id: true, name: true, avatar: true, email: true } }
          }
        }
      }
    });
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Create assignment (teacher only)
app.post("/api/assignments", authenticate, requireTeacher, [
  body("title").trim().notEmpty(),
  body("subject").trim().notEmpty(),
  body("dueDate").isISO8601(),
  body("priority").isIn(["LOW", "MEDIUM", "HIGH"]),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, subject, dueDate, priority } = req.body;
  try {
    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        title, description: description || "",
        subject, dueDate: new Date(dueDate),
        priority, teacherId: req.user.id,
      }
    });

    // Auto-create pending submissions for all students
    const students = await prisma.user.findMany({ where: { role: "STUDENT" } });
    await prisma.submission.createMany({
      data: students.map(s => ({
        assignmentId: assignment.id,
        studentId: s.id,
        status: "PENDING"
      }))
    });

    // Return with full data
    const full = await prisma.assignment.findUnique({
      where: { id: assignment.id },
      include: {
        teacher: { select: { id: true, name: true, avatar: true } },
        submissions: { include: { student: { select: { id: true, name: true, avatar: true, email: true } } } }
      }
    });

    res.status(201).json(full);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update assignment (teacher only)
app.put("/api/assignments/:id", authenticate, requireTeacher, async (req, res) => {
  const { title, description, subject, dueDate, priority } = req.body;
  try {
    const assignment = await prisma.assignment.findUnique({ where: { id: req.params.id } });
    if (!assignment) return res.status(404).json({ error: "Not found" });
    if (assignment.teacherId !== req.user.id) return res.status(403).json({ error: "Not your assignment" });

    const updated = await prisma.assignment.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(subject && { subject }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(priority && { priority }),
      },
      include: {
        teacher: { select: { id: true, name: true, avatar: true } },
        submissions: { include: { student: { select: { id: true, name: true, avatar: true } } } }
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Delete assignment
app.delete("/api/assignments/:id", authenticate, requireTeacher, async (req, res) => {
  try {
    const assignment = await prisma.assignment.findUnique({ where: { id: req.params.id } });
    if (!assignment) return res.status(404).json({ error: "Not found" });
    if (assignment.teacherId !== req.user.id) return res.status(403).json({ error: "Not your assignment" });

    await prisma.assignment.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── SUBMISSION ROUTES ────────────────────────────────────────
// Submit assignment (student)
app.post("/api/submissions/:assignmentId/submit", authenticate, async (req, res) => {
  if (req.user.role !== "STUDENT") return res.status(403).json({ error: "Students only" });
  try {
    const submission = await prisma.submission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: req.params.assignmentId,
          studentId: req.user.id
        }
      },
      update: {
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
      create: {
        assignmentId: req.params.assignmentId,
        studentId: req.user.id,
        status: "SUBMITTED",
        submittedAt: new Date(),
      }
    });
    res.json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Grade submission (teacher)
app.patch("/api/submissions/:assignmentId/:studentId/grade", authenticate, requireTeacher, async (req, res) => {
  const { grade, feedback } = req.body;
  try {
    const submission = await prisma.submission.update({
      where: {
        assignmentId_studentId: {
          assignmentId: req.params.assignmentId,
          studentId: req.params.studentId
        }
      },
      data: { grade, feedback }
    });
    res.json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── STATS ROUTES ─────────────────────────────────────────────
app.get("/api/stats", authenticate, async (req, res) => {
  try {
    if (req.user.role === "TEACHER") {
      const [assignments, submissions, students] = await Promise.all([
        prisma.assignment.count({ where: { teacherId: req.user.id } }),
        prisma.submission.count({ where: { status: "SUBMITTED" } }),
        prisma.user.count({ where: { role: "STUDENT" } }),
      ]);
      const ungraded = await prisma.submission.count({ where: { status: "SUBMITTED", grade: null } });
      res.json({ assignments, submissions, students, ungraded });
    } else {
      const total = await prisma.submission.count({ where: { studentId: req.user.id } });
      const submitted = await prisma.submission.count({ where: { studentId: req.user.id, status: "SUBMITTED" } });
      const graded = await prisma.submission.count({ where: { studentId: req.user.id, grade: { not: null } } });
      res.json({ total, submitted, pending: total - submitted, graded });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── START SERVER ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 EduTrack API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
