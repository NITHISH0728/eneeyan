import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Plus, ArrowLeft, Video, HelpCircle, Zap, FileText, 
  Edit3, ChevronRight, Layout, X, Link, Clock, Radio, 
  AlertCircle, Save, Smartphone, Trash2, CheckCircle, Code, PlusCircle
} from "lucide-react";

interface Module {
  id: number;
  title: string;
  order: number;
}

const CourseBuilder = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  // --- ⚙️ CORE STATE MANAGEMENT ---
  const [modules, setModules] = useState<Module[]>([]);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [showAddModule, setShowAddModule] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);

  // --- 🎭 MODAL & CONTENT STATES ---
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Universal Form States
  const [itemTitle, setItemTitle] = useState("");
  const [itemUrl, setItemUrl] = useState(""); 
  const [itemInstructions, setItemInstructions] = useState("");
  const [duration, setDuration] = useState(""); 
  const [isMandatory, setIsMandatory] = useState(false);
  
  // 🧩 CODE TEST SPECIFIC STATES
  const [codeDifficulty, setCodeDifficulty] = useState("Easy");
  const [timeLimit, setTimeLimit] = useState("1000");
  const [memoryLimit, setMemoryLimit] = useState("256000");
  const [testCases, setTestCases] = useState([{ input: "", output: "" }]);

  // ✅ NEW: Toast State
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // 🎨 iQmath Professional Brand Palette
  const brand = { blue: "#005EB8", green: "#87C232", bg: "#F8FAFC", border: "#e2e8f0", textMain: "#1e293b", textLight: "#64748b" };

  // --- HELPER: Trigger Toast ---
  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  useEffect(() => { fetchModules(); }, [courseId]);

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://127.0.0.1:8000/api/v1/courses/${courseId}/modules`, { headers: { Authorization: `Bearer ${token}` } });
      setModules(res.data);
      if (res.data.length > 0 && !selectedModuleId) setSelectedModuleId(res.data[0].id);
    } catch (err) { console.error("Failed to load modules", err); }
  };

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://127.0.0.1:8000/api/v1/courses/${courseId}/modules`, { title: newModuleTitle, order: modules.length + 1 }, { headers: { Authorization: `Bearer ${token}` } });
      setNewModuleTitle(""); setShowAddModule(false); fetchModules();
      triggerToast("Module added successfully!", "success");
    } catch (err) { triggerToast("Error adding module", "error"); } finally { setLoading(false); }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`http://127.0.0.1:8000/api/v1/courses/${courseId}/publish`, {}, { headers: { Authorization: `Bearer ${token}` } });
      triggerToast("🎉 Course Published! It is now live for iQmath students.", "success");
      setTimeout(() => navigate("/dashboard/courses"), 2000);
    } catch (err) { triggerToast("Error publishing course.", "error"); } finally { setIsPublishing(false); }
  };

  // --- 📝 TEST CASE HELPERS ---
  const addTestCase = () => setTestCases([...testCases, { input: "", output: "" }]);
  const updateTestCase = (idx: number, field: "input" | "output", val: string) => {
    const newCases = [...testCases];
    newCases[idx][field] = val;
    setTestCases(newCases);
  };
  const removeTestCase = (idx: number) => setTestCases(testCases.filter((_, i) => i !== idx));

  // ✅ MERGED CONTENT SAVING LOGIC
  const saveContentItem = async () => {
    if (!selectedModuleId) return triggerToast("Select a module from the sidebar first!", "error");
    if (!itemTitle.trim()) return triggerToast("Please enter a title.", "error");

    const token = localStorage.getItem("token");
    const typeKey = activeModal?.toLowerCase().replace(" ", "_") || "video";

    // 🏗️ Construct Payload
    const payload: any = {
      title: itemTitle,
      type: typeKey,
      data_url: itemUrl,
      duration: duration ? parseInt(duration) : null,
      is_mandatory: isMandatory,
      instructions: itemInstructions,
      module_id: selectedModuleId
    };

    // 🏗️ Code Test Specific Payload Packing
    if (activeModal === "Code Test") {
        const config = {
            difficulty: codeDifficulty,
            timeLimit: parseInt(timeLimit),
            memoryLimit: parseInt(memoryLimit),
            testCases: testCases
        };
        payload.test_config = JSON.stringify(config); // Save as JSON string
    }

    try {
      await axios.post(`http://127.0.0.1:8000/api/v1/content`, payload, { headers: { Authorization: `Bearer ${token}` } });
      triggerToast(`✅ ${activeModal} added successfully!`, "success");
      setActiveModal(null); resetForm();
    } catch (err) { triggerToast("Failed to save. Ensure your backend CORS is fixed.", "error"); }
  };

  const resetForm = () => {
    setItemTitle(""); setItemUrl(""); setItemInstructions(""); setDuration(""); setIsMandatory(false);
    setCodeDifficulty("Easy"); setTimeLimit("1000"); setMemoryLimit("256000"); setTestCases([{ input: "", output: "" }]);
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "100px", background: brand.bg, minHeight: "100vh" }}>
      
      {/* 🟢 TOP ACTION BAR */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", background: "white", padding: "16px 40px", borderBottom: `1px solid ${brand.border}`, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <button onClick={() => navigate("/dashboard/courses")} style={{ background: "#f1f5f9", border: "none", padding: "10px", borderRadius: "50%", cursor: "pointer" }}><ArrowLeft size={20} color={brand.textMain} /></button>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: brand.textMain, margin: 0 }}>Course Curriculum Builder</h2>
            <p style={{ fontSize: "13px", color: brand.textLight, margin: 0 }}>Configure modules and frame content for learners</p>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "12px" }}>
           <button 
             onClick={() => navigate(`/dashboard/course/${courseId}/preview`)} 
             style={{ 
               padding: "10px 20px", 
               background: "white", 
               color: "#005EB8", 
               border: "1px solid #005EB8", 
               borderRadius: "8px", 
               fontWeight: "600", 
               cursor: "pointer" 
             }}
           >
             Preview & Manage
           </button>
           <button onClick={handlePublish} disabled={isPublishing} style={{ padding: "12px 32px", borderRadius: "10px", border: "none", background: brand.green, color: "white", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 12px rgba(135, 194, 50, 0.3)" }}>{isPublishing ? "Publishing..." : "Publish Course"}</button>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "40px", padding: "0 40px" }}>
        
        {/* 🛠️ LEFT SIDEBAR */}
        <aside style={{ background: "white", borderRadius: "16px", border: `1px solid ${brand.border}`, padding: "24px", height: "fit-content" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "800" }}>Curriculum</h3>
            <button onClick={() => setActiveModal("Heading")} style={{ color: brand.blue, background: "none", border: "none", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>+ New Heading</button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {modules.map((m) => (
              <div key={m.id} onClick={() => setSelectedModuleId(m.id)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", background: selectedModuleId === m.id ? "#f0f7ff" : "white", borderRadius: "12px", border: selectedModuleId === m.id ? `1.5px solid ${brand.blue}` : `1px solid ${brand.border}`, cursor: "pointer", transition: "all 0.2s ease" }}>
                <Layout size={18} color={selectedModuleId === m.id ? brand.blue : brand.textLight} />
                <span style={{ fontSize: "14px", fontWeight: "600", color: brand.textMain }}>{m.title}</span>
              </div>
            ))}

            {showAddModule ? (
              <div style={{ marginTop: "10px", padding: "15px", background: "#f8fafc", borderRadius: "12px" }}>
                <input autoFocus placeholder="Module Name..." value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${brand.border}`, marginBottom: "10px", outline: "none" }} />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleAddModule} style={{ flex: 1, background: brand.blue, color: "white", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "700" }}>Add</button>
                  <button onClick={() => setShowAddModule(false)} style={{ flex: 1, background: "white", border: `1px solid ${brand.border}`, padding: "10px", borderRadius: "8px" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddModule(true)} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: `2px dashed ${brand.border}`, color: brand.textLight, background: "none", fontWeight: "700", cursor: "pointer", marginTop: "10px" }}>+ Add Module</button>
            )}
          </div>
        </aside>

        {/* 📝 RIGHT MAIN: GRAPHY CONTENT SELECTOR */}
        <main style={{ background: "white", borderRadius: "20px", border: `1px solid ${brand.border}`, padding: "60px", textAlign: "center" }}>
          <Layout size={48} color={brand.border} style={{ marginBottom: "20px" }} />
          <h2 style={{ fontSize: "28px", fontWeight: "800", color: brand.textMain, marginBottom: "8px" }}>Create new learning item</h2>
          <p style={{ color: brand.textLight, marginBottom: "48px" }}>Items will be added to: <span style={{color: brand.blue, fontWeight: "700"}}>{modules.find(m => m.id === selectedModuleId)?.title || "Select a module"}</span></p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px", maxWidth: "850px", margin: "0 auto" }}>
            
            {/* CONTENT TYPES */}
            {[
                { type: "Note", icon: <Edit3 size={28} color={brand.blue} />, desc: "Drive PDF Links" },
                { type: "Video", icon: <Video size={28} color={brand.blue} />, desc: "YouTube lessons" },
                { type: "Quiz", icon: <HelpCircle size={28} color={brand.blue} />, desc: "Google Form Links" },
                { type: "Code Test", icon: <Code size={28} color="#7c3aed" />, desc: "Compiler Challenges" },
                { type: "Assignment", icon: <FileText size={28} color={brand.blue} />, desc: "PDF projects (Drive)" },
                { type: "Live Class", icon: <Radio size={28} color="#ef4444" />, desc: "YouTube Live Link" },
                { type: "Live Test", icon: <Zap size={28} color="#EAB308" />, desc: "Timed assessment" },
            ].map(item => (
                <div key={item.type} onClick={() => setActiveModal(item.type)} style={selectorCard}>
                    {item.icon}
                    <div style={{ textAlign: "left" }}>
                        <div style={cardTitle}>{item.type}</div>
                        <div style={cardDesc}>{item.desc}</div>
                    </div>
                </div>
            ))}
          </div>
        </main>
      </div>

      {/* 🎭 DYNAMIC MODAL */}
      {activeModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
              <h3 style={{ fontSize: "22px", fontWeight: "800", margin: 0 }}>Add {activeModal}</h3>
              <X onClick={() => setActiveModal(null)} style={{ cursor: "pointer", color: brand.textLight }} />
            </div>
            
            {/* 🧩 CODE TEST FORM */}
            {activeModal === "Code Test" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxHeight: "60vh", overflowY: "auto", paddingRight: "10px" }}>
                    <div>
                        <label style={labelStyle}>Problem Title</label>
                        <input value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} placeholder="e.g. Binary Search" style={inputStyle} />
                    </div>
                    <div style={{ display: "flex", gap: "15px" }}>
                        <div style={{flex: 1}}>
                            <label style={labelStyle}>Difficulty</label>
                            <select value={codeDifficulty} onChange={(e) => setCodeDifficulty(e.target.value)} style={inputStyle}>
                                <option>Easy</option><option>Medium</option><option>Hard</option>
                            </select>
                        </div>
                        <div style={{flex: 1}}>
                            <label style={labelStyle}>Time Limit (ms)</label>
                            <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} style={inputStyle} />
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Problem Description</label>
                        <textarea rows={4} value={itemInstructions} onChange={(e) => setItemInstructions(e.target.value)} placeholder="Explain the logic required..." style={{...inputStyle, resize: "vertical"}} />
                    </div>
                    <div>
                        <label style={labelStyle}>Test Cases</label>
                        {testCases.map((tc, idx) => (
                            <div key={idx} style={{ background: "#f8fafc", padding: "15px", borderRadius: "8px", border: `1px solid ${brand.border}`, marginBottom: "10px" }}>
                                <div style={{display: "flex", justifyContent: "space-between", marginBottom: "8px"}}>
                                    <span style={{fontSize: "12px", fontWeight: "700", color: brand.textLight}}>CASE {idx + 1}</span>
                                    {testCases.length > 1 && <Trash2 size={14} color="#ef4444" cursor="pointer" onClick={() => removeTestCase(idx)} />}
                                </div>
                                <input placeholder="Input (e.g. 5 10)" value={tc.input} onChange={(e) => updateTestCase(idx, "input", e.target.value)} style={{...inputStyle, marginBottom: "8px"}} />
                                <input placeholder="Expected Output (e.g. 15)" value={tc.output} onChange={(e) => updateTestCase(idx, "output", e.target.value)} style={inputStyle} />
                            </div>
                        ))}
                        <button onClick={addTestCase} style={{fontSize: "13px", color: brand.blue, background: "none", border: "none", cursor: "pointer", fontWeight: "700", display: "flex", alignItems: "center", gap: "5px"}}>+ Add Another Test Case</button>
                    </div>
                </div>
            ) : (
                /* 🧩 STANDARD FORM */
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div>
                        <label style={labelStyle}>{activeModal === "Heading" ? "Heading Name" : "Item Title"}</label>
                        <input value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} placeholder="e.g. Phase 1: Basics" style={inputStyle} />
                    </div>
                    {activeModal !== "Heading" && (
                        <>
                        <div>
                            <label style={labelStyle}>
                                {activeModal === "Note" || activeModal === "Assignment" ? "Google Drive PDF Link" : "YouTube / Form Link"}
                            </label>
                            <div style={{ position: "relative" }}>
                                <Link size={18} style={{ position: "absolute", left: "14px", top: "14px", color: brand.textLight }} />
                                <input value={itemUrl} onChange={(e) => setItemUrl(e.target.value)} placeholder="https://..." style={{ ...inputStyle, paddingLeft: "45px" }} />
                            </div>
                        </div>
                        {activeModal === "Live Test" && (
                            <div>
                                <label style={labelStyle}>Test Duration (Minutes)</label>
                                <div style={{ position: "relative" }}>
                                    <Clock size={18} style={{ position: "absolute", left: "14px", top: "14px", color: brand.textLight }} />
                                    <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="60" style={{ ...inputStyle, paddingLeft: "45px" }} />
                                </div>
                            </div>
                        )}
                        </>
                    )}
                </div>
            )}

            <button onClick={saveContentItem} style={saveButton}>Save {activeModal === "Code Test" ? "Problem" : activeModal === "Heading" ? "Section Heading" : "Learning Item"}</button>
          </div>
        </div>
      )}

      {/* ✅ TOAST NOTIFICATION COMPONENT */}
      {toast.show && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: "white", padding: "16px 24px", borderRadius: "12px",
          boxShadow: "0 10px 30px -5px rgba(0,0,0,0.15)", borderLeft: `6px solid ${toast.type === "success" ? brand.green : "#ef4444"}`,
          display: "flex", alignItems: "center", gap: "12px", animation: "slideIn 0.3s ease-out"
        }}>
           {toast.type === "success" ? <CheckCircle size={24} color={brand.green} /> : <AlertCircle size={24} color="#ef4444" />}
           <div>
             <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700", color: brand.textMain }}>{toast.type === "success" ? "Success" : "Error"}</h4>
             <p style={{ margin: 0, fontSize: "13px", color: brand.textLight }}>{toast.message}</p>
           </div>
           <button onClick={() => setToast({ ...toast, show: false })} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "10px" }}>
             <X size={16} color="#94a3b8" />
           </button>
           <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
        </div>
      )}
    </div>
  );
};

// --- 💅 STYLES ---
const selectorCard = { 
  display: "flex", alignItems: "center", gap: "20px", padding: "24px", 
  background: "white", borderRadius: "16px", border: "1.5px solid #e2e8f0", 
  cursor: "pointer", transition: "all 0.2s ease", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" 
};
const cardTitle = { fontSize: "16px", fontWeight: "800", color: "#1e293b", marginBottom: "4px" };
const cardDesc = { fontSize: "12px", color: "#64748b" };
const modalOverlay = { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" };
const modalContent = { background: "white", width: "100%", maxWidth: "550px", padding: "40px", borderRadius: "24px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" };
const labelStyle = { display: "block", marginBottom: "8px", fontSize: "12px", fontWeight: "800", color: "#1e293b", textTransform: "uppercase" as const, letterSpacing: "0.5px" };
const inputStyle = { width: "100%", padding: "14px", borderRadius: "12px", border: "1.5px solid #e2e8f0", fontSize: "15px", outline: "none", boxSizing: "border-box" as const, background: "#f8fafc" };
const saveButton = { width: "100%", padding: "16px", marginTop: "32px", background: "#005EB8", color: "white", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: "800", cursor: "pointer", boxShadow: "0 10px 15px -3px rgba(0, 94, 184, 0.3)" };

export default CourseBuilder;