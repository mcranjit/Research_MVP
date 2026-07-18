import { useEffect, useState } from "react";
import { Users, Plus, Crown, UserPlus, X } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";

export default function Workspaces() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");

  const load = () => api.get("/workspaces").then((r) => setItems(r.data.workspaces));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.post("/workspaces", { name });
      setName("");
      toast.success("Workspace created");
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    }
  };

  const invite = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/workspaces/${selected.id}/invite`, { email: inviteEmail, role: inviteRole });
      setInviteEmail("");
      toast.success("Member invited");
      const r = await api.get(`/workspaces/${selected.id}`);
      setSelected(r.data);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invite failed");
    }
  };

  const removeMember = async (uid) => {
    try {
      await api.delete(`/workspaces/${selected.id}/members/${uid}`);
      const r = await api.get(`/workspaces/${selected.id}`);
      setSelected(r.data);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.3em] text-indigo-400 font-mono mb-3">/ Workspaces</div>
        <h1 className="font-display text-4xl font-medium tracking-tight">Team Research Spaces</h1>
        <p className="text-slate-400 mt-2">Collaborate on documents with role-based access control.</p>
      </div>

      <form onSubmit={create} className="flex gap-3 mb-8">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New workspace name"
          className="bg-white/[0.04] border-white/10 text-slate-100 h-11" data-testid="ws-name" />
        <Button type="submit" className="bg-indigo-500 hover:bg-indigo-400 text-white h-11 px-5" data-testid="ws-create">
          <Plus className="w-4 h-4 mr-1" /> Create
        </Button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {items.map((w) => (
          <button key={w.id} onClick={() => setSelected(w)} data-testid={`ws-${w.id}`}
            className={`text-left p-5 rounded-xl bg-[#0E0E0E] border transition-colors ${selected?.id === w.id ? "border-indigo-500/50" : "border-white/[0.08] hover:border-white/[0.18]"}`}>
            <div className="flex items-start justify-between mb-3">
              <Users className="w-5 h-5 text-indigo-400" />
              {w.owner_id && <Crown className="w-4 h-4 text-amber-400" />}
            </div>
            <h3 className="font-display text-lg font-medium">{w.name}</h3>
            <div className="text-xs text-slate-500 mt-1 font-mono">{w.members?.length || 0} members</div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-8 rounded-xl bg-[#0E0E0E] border border-white/[0.08] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-medium">{selected.name} — Members</h2>
            <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white" data-testid="ws-close">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={invite} className="flex gap-2 mb-6">
            <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} type="email"
              placeholder="member@example.com" className="bg-white/[0.04] border-white/10 text-slate-100" data-testid="ws-invite-email" />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
              className="bg-white/[0.04] border border-white/10 text-slate-100 rounded-md px-3 text-sm" data-testid="ws-invite-role">
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <Button type="submit" className="bg-indigo-500 hover:bg-indigo-400 text-white" data-testid="ws-invite-btn">
              <UserPlus className="w-4 h-4 mr-1" /> Invite
            </Button>
          </form>

          <div className="space-y-2">
            {selected.members?.map((m) => (
              <div key={m.user_id} className="flex items-center justify-between p-3 rounded-md bg-white/[0.03] border border-white/[0.06]">
                <div>
                  <div className="text-sm text-slate-100">{m.email}</div>
                  <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">{m.role}</div>
                </div>
                {m.role !== "owner" && (
                  <button onClick={() => removeMember(m.user_id)} className="text-slate-500 hover:text-red-400 text-xs" data-testid={`ws-rm-${m.user_id}`}>Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
