import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ─── AUTH ──────────────────────────────────────────────────────
export const login = (email, password) =>
  API.post("/api/auth/login", { email, password }).then((r) => r.data);

export const register = (data) =>
  API.post("/api/auth/register", data).then((r) => r.data);

export const getMe = () =>
  API.get("/api/auth/me").then((r) => r.data);

// ─── ASSIGNMENTS ───────────────────────────────────────────────
export const getAssignments = () =>
  API.get("/api/assignments").then((r) => r.data);

export const getAssignment = (id) =>
  API.get(`/api/assignments/${id}`).then((r) => r.data);

export const createAssignment = (data) =>
  API.post("/api/assignments", data).then((r) => r.data);

export const updateAssignment = (id, data) =>
  API.put(`/api/assignments/${id}`, data).then((r) => r.data);

export const deleteAssignment = (id) =>
  API.delete(`/api/assignments/${id}`).then((r) => r.data);

// ─── SUBMISSIONS ───────────────────────────────────────────────
export const submitAssignment = (assignmentId) =>
  API.post(`/api/submissions/${assignmentId}/submit`).then((r) => r.data);

export const gradeSubmission = (assignmentId, studentId, grade, feedback) =>
  API.patch(`/api/submissions/${assignmentId}/${studentId}/grade`, { grade, feedback }).then((r) => r.data);

// ─── USERS ────────────────────────────────────────────────────
export const getStudents = () =>
  API.get("/api/users/students").then((r) => r.data);

// ─── STATS ────────────────────────────────────────────────────
export const getStats = () =>
  API.get("/api/stats").then((r) => r.data);

export default API;
