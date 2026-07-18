import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
  const navigate = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const hash = window.location.hash;
    const m = hash.match(/session_id=([^&]+)/);
    if (!m) { navigate("/auth/login"); return; }

    (async () => {
      try {
        const r = await api.post("/auth/google/session", { session_id: m[1] });
        localStorage.setItem("rm_token", r.data.token);
        localStorage.setItem("rm_user", JSON.stringify(r.data.user));
        window.location.href = "/app";
      } catch {
        navigate("/auth/login");
      }
    })();
  }, [navigate]);

  return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-slate-400">Signing you in...</div>;
}
