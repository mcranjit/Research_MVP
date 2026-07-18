import axios from "axios";

const resolveBackendUrl = () => {
  const configured = process.env.REACT_APP_BACKEND_URL || "";
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:8001";
  }
  return "http://localhost:8001";
};

const BACKEND_URL = resolveBackendUrl();
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rm_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("rm_token");
      localStorage.removeItem("rm_user");
      if (window.location.pathname !== "/" && !window.location.pathname.startsWith("/auth")) {
        window.location.href = "/auth/login";
      }
    }

    const message = err.response?.data?.detail || err.message || "Request failed";
    return Promise.reject({ ...err, message });
  }
);

export const auth = {
  register: (data) => api.post("/auth/register", data).then((r) => r.data),
  login: (data) => api.post("/auth/login", data).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};

export const docs = {
  list: () => api.get("/documents").then((r) => r.data),
  get: (id) => api.get(`/documents/${id}`).then((r) => r.data),
  upload: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/documents/upload", fd).then((r) => r.data);
  },
  delete: (id) => api.delete(`/documents/${id}`).then((r) => r.data),
};

export const chat = {
  send: (payload) => api.post("/chat/send", payload).then((r) => r.data),
  sessions: () => api.get("/chat/sessions").then((r) => r.data),
  session: (id) => api.get(`/chat/sessions/${id}`).then((r) => r.data),
};

export const research = {
  search: (query, top_k = 8) => api.post("/search", { query, top_k }).then((r) => r.data),
  clusters: () => api.get("/clusters").then((r) => r.data),
  knowledgeGraph: () => api.get("/knowledge-graph").then((r) => r.data),
  review: (topic, doc_ids) => api.post("/literature-review", { topic, doc_ids }).then((r) => r.data),
  gaps: (doc_ids) => api.post("/research-gaps", { doc_ids }).then((r) => r.data),
  hypothesis: (topic, use_documents = true) =>
    api.post("/hypothesis", { topic, use_documents }).then((r) => r.data),
};
