import { useEffect, useState } from "react";
import { Crown, Check, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

const PRO_FEATURES = [
  "Unlimited document uploads",
  "Patent Intelligence analysis",
  "Dataset discovery (HF + Kaggle + UCI)",
  "Workspace collaboration",
  "Priority Claude Sonnet 4.5 access",
  "Literature review PDF export",
];

export default function Billing() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [polling, setPolling] = useState(false);

  // Handle return from Stripe
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sid = params.get("session_id");
    if (sid && location.pathname.endsWith("/success")) {
      pollStatus(sid);
    }
  }, [location]);

  const pollStatus = async (sid, attempts = 0) => {
    if (attempts === 0) setPolling(true);
    if (attempts >= 6) { setPolling(false); toast.error("Payment status check timed out"); return; }
    try {
      const r = await api.get(`/billing/status/${sid}`);
      if (r.data.payment_status === "paid") {
        setPolling(false);
        toast.success("🎉 Welcome to Pro!");
        // refresh user data
        const me = await api.get("/auth/me");
        localStorage.setItem("rm_user", JSON.stringify(me.data.user));
        setTimeout(() => navigate("/app"), 1500);
        return;
      }
      if (r.data.status === "expired") {
        setPolling(false); toast.error("Session expired"); return;
      }
      setTimeout(() => pollStatus(sid, attempts + 1), 2000);
    } catch {
      setTimeout(() => pollStatus(sid, attempts + 1), 2000);
    }
  };

  const upgrade = async () => {
    setLoading(true);
    try {
      const r = await api.post("/billing/checkout-session", { origin: window.location.origin });
      window.location.href = r.data.url;
    } catch (err) {
      toast.error(err.response?.data?.detail || "Checkout failed");
      setLoading(false);
    }
  };

  const isPro = user?.tier === "pro" || user?.tier === "enterprise";

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-amber-400 mb-4">
          <Crown className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-display text-4xl font-medium tracking-tight">Upgrade to Pro</h1>
        <p className="text-slate-400 mt-2">Unlock the full ResearchMind experience.</p>
      </div>

      {polling && (
        <div className="mb-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3 text-indigo-200">
          <Loader2 className="w-4 h-4 animate-spin" /> Confirming your payment...
        </div>
      )}

      <div className="p-8 rounded-2xl bg-gradient-to-b from-indigo-500/[0.08] to-transparent border border-indigo-500/30 shadow-[0_0_80px_rgba(99,102,241,0.15)]">
        <div className="text-sm uppercase tracking-[0.2em] font-mono text-indigo-300 mb-3">Pro Plan</div>
        <div className="font-display text-5xl font-medium mb-1">$29<span className="text-base text-slate-500">/mo</span></div>
        <div className="text-sm text-slate-400 mb-8">Cancel anytime · Test mode</div>

        <ul className="space-y-3 mb-8">
          {PRO_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-slate-200">
              <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> {f}
            </li>
          ))}
        </ul>

        {isPro ? (
          <div className="w-full p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-center font-medium" data-testid="pro-active">
            <Crown className="w-4 h-4 inline mr-2" /> You're on Pro
          </div>
        ) : (
          <Button onClick={upgrade} disabled={loading} className="w-full h-12 bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_24px_rgba(99,102,241,0.35)]" data-testid="upgrade-btn">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opening checkout...</> : "Upgrade to Pro"}
          </Button>
        )}

        <p className="text-xs text-slate-500 mt-4 text-center">
          Stripe test mode · Use card 4242 4242 4242 4242, any future date, any CVC.
        </p>
      </div>
    </div>
  );
}
