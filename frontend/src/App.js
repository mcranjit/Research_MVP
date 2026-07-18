import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import CommandPalette from "@/components/CommandPalette";
import Landing from "@/pages/Landing";
import { LoginPage, RegisterPage } from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Documents from "@/pages/Documents";
import DocumentDetail from "@/pages/DocumentDetail";
import Chat from "@/pages/Chat";
import Search from "@/pages/Search";
import Clusters from "@/pages/Clusters";
import KnowledgeGraph from "@/pages/KnowledgeGraph";
import LiteratureReview from "@/pages/LiteratureReview";
import ResearchGap from "@/pages/ResearchGap";
import Hypothesis from "@/pages/Hypothesis";
import Workspaces from "@/pages/Workspaces";
import Patents from "@/pages/Patents";
import Datasets from "@/pages/Datasets";
import Billing from "@/pages/Billing";
import Profile from "@/pages/Profile";
import Citations from "@/pages/Citations";
import AuthCallback from "@/pages/AuthCallback";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-slate-400">Loading...</div>;
  if (!user) return <Navigate to="/auth/login" replace />;
  return <Layout><CommandPalette />{children}</Layout>;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/app" element={<Protected><Dashboard /></Protected>} />
            <Route path="/app/documents" element={<Protected><Documents /></Protected>} />
            <Route path="/app/documents/:id" element={<Protected><DocumentDetail /></Protected>} />
            <Route path="/app/chat" element={<Protected><Chat /></Protected>} />
            <Route path="/app/search" element={<Protected><Search /></Protected>} />
            <Route path="/app/clusters" element={<Protected><Clusters /></Protected>} />
            <Route path="/app/graph" element={<Protected><KnowledgeGraph /></Protected>} />
            <Route path="/app/review" element={<Protected><LiteratureReview /></Protected>} />
            <Route path="/app/gaps" element={<Protected><ResearchGap /></Protected>} />
            <Route path="/app/hypothesis" element={<Protected><Hypothesis /></Protected>} />
            <Route path="/app/workspaces" element={<Protected><Workspaces /></Protected>} />
            <Route path="/app/patents" element={<Protected><Patents /></Protected>} />
            <Route path="/app/datasets" element={<Protected><Datasets /></Protected>} />
            <Route path="/app/billing" element={<Protected><Billing /></Protected>} />
            <Route path="/app/billing/success" element={<Protected><Billing /></Protected>} />
            <Route path="/app/profile" element={<Protected><Profile /></Protected>} />
            <Route path="/app/citations" element={<Protected><Citations /></Protected>} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" theme="dark" />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
