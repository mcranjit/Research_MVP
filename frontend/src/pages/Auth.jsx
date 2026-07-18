import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brain, ArrowRight } from "lucide-react";
import { useAuth } from "../lib/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      navigate("/app");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return <AuthShell title="Welcome back" sub="Sign in to continue your research.">
    <form onSubmit={submit} className="space-y-5">
      <div>
        <Label className="text-slate-300">Email</Label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="bg-white/[0.04] border-white/10 text-slate-100 mt-1.5 h-11" data-testid="login-email" />
      </div>
      <div>
        <Label className="text-slate-300">Password</Label>
        <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          className="bg-white/[0.04] border-white/10 text-slate-100 mt-1.5 h-11" data-testid="login-password" />
      </div>
      <Button type="submit" disabled={loading} data-testid="login-submit"
        className="w-full h-11 bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_24px_rgba(99,102,241,0.35)]">
        {loading ? "Signing in..." : <>Sign in <ArrowRight className="w-4 h-4 ml-1" /></>}
      </Button>
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider font-mono"><span className="px-2 bg-[#0A0A0A] text-slate-500">or</span></div>
      </div>
      {/* REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH */}
      <Button type="button" onClick={() => {
        const redirectUrl = window.location.origin + '/auth/callback';
        window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      }} className="w-full h-11 bg-white/[0.04] hover:bg-white/[0.08] text-slate-100 border border-white/10" data-testid="google-login">
        Continue with Google
      </Button>
    </form>
    <div className="text-sm text-slate-400 text-center mt-6">
      No account? <Link to="/auth/register" className="text-indigo-400 hover:text-indigo-300" data-testid="goto-register">Create one</Link>
    </div>
  </AuthShell>;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, name);
      toast.success("Account created");
      navigate("/app");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return <AuthShell title="Start researching" sub="Create your ResearchMind workspace.">
    <form onSubmit={submit} className="space-y-5">
      <div>
        <Label className="text-slate-300">Name</Label>
        <Input required value={name} onChange={(e) => setName(e.target.value)}
          className="bg-white/[0.04] border-white/10 text-slate-100 mt-1.5 h-11" data-testid="register-name" />
      </div>
      <div>
        <Label className="text-slate-300">Email</Label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="bg-white/[0.04] border-white/10 text-slate-100 mt-1.5 h-11" data-testid="register-email" />
      </div>
      <div>
        <Label className="text-slate-300">Password</Label>
        <Input type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)}
          className="bg-white/[0.04] border-white/10 text-slate-100 mt-1.5 h-11" data-testid="register-password" />
      </div>
      <Button type="submit" disabled={loading} data-testid="register-submit"
        className="w-full h-11 bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_24px_rgba(99,102,241,0.35)]">
        {loading ? "Creating..." : <>Create account <ArrowRight className="w-4 h-4 ml-1" /></>}
      </Button>
    </form>
    <div className="text-sm text-slate-400 text-center mt-6">
      Already have one? <Link to="/auth/login" className="text-indigo-400 hover:text-indigo-300" data-testid="goto-login">Sign in</Link>
    </div>
  </AuthShell>;
}

function AuthShell({ title, sub, children }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-100 grain relative overflow-hidden flex">
      <div className="absolute inset-0 aurora" />
      <div className="absolute inset-0 dotgrid opacity-30" />
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 mb-10" data-testid="auth-logo">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center">
              <Brain className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-display font-semibold">ResearchMind <span className="text-indigo-400 font-mono text-xs">AI</span></span>
          </Link>
          <div className="glass rounded-2xl p-8">
            <h1 className="font-display text-3xl font-medium mb-2">{title}</h1>
            <p className="text-slate-400 mb-8">{sub}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
