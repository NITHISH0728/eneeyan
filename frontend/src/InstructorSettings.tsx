import { useState } from "react";
import axios from "axios";
import { Lock, Save } from "lucide-react";

const InstructorSettings = () => {
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return alert("Password too short");
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://127.0.0.1:8000/api/v1/user/change-password", { new_password: newPassword }, { headers: { Authorization: `Bearer ${token}` } });
      alert("✅ Password updated successfully!");
      setNewPassword("");
    } catch (err) { alert("Failed to update password."); } 
    finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", animation: "fadeIn 0.3s ease" }}>
        <div style={{ background: "white", borderRadius: "12px", padding: "40px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "30px", paddingBottom: "20px", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ padding: "12px", background: "#e0f2fe", borderRadius: "10px", color: "#005EB8" }}><Lock size={24} /></div>
                <div><h3 style={{ margin: 0, fontSize: "18px", color: "#004080" }}>Security Settings</h3><p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#666" }}>Update your instructor account password</p></div>
            </div>
            <form onSubmit={handlePasswordChange}>
                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#333", marginBottom: "8px", textTransform: "uppercase" }}>New Password</label>
                    <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new strong password" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", outline: "none", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
                <button type="submit" disabled={saving} style={{ padding: "12px 24px", background: "#005EB8", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", opacity: saving ? 0.7 : 1 }}>
                    <Save size={18} /> {saving ? "Updating..." : "Update Password"}
                </button>
            </form>
        </div>
    </div>
  );
};

export default InstructorSettings;