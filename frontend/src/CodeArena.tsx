import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Download, Code, Trash2 } from "lucide-react";

const CodeArena = () => {
  const [codeTests, setCodeTests] = useState<any[]>([]);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);

  // Form State
  const [testForm, setTestForm] = useState({ 
    title: "", pass_key: "", time_limit: 60, problems: [] as any[] 
  });
  const [currentProblem, setCurrentProblem] = useState({ 
    title: "", description: "", difficulty: "Easy", test_cases: JSON.stringify([{input: "", output: ""}]) 
  });

  const theme = { blue: "#0066cc", green: "#8cc63f", darkBlue: "#004080", border: "#e0e0e0" };

  useEffect(() => { fetchTests(); }, []);

  const fetchTests = async () => {
    try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://127.0.0.1:8000/api/v1/code-tests", {
            headers: { Authorization: `Bearer ${token}` }
        });
        setCodeTests(res.data);
    } catch(err) { console.error("Failed to load tests"); }
  };

  const handleCreateTest = async () => {
      try {
          const token = localStorage.getItem("token");
          await axios.post("http://127.0.0.1:8000/api/v1/code-tests", testForm, {
              headers: { Authorization: `Bearer ${token}` }
          });
          alert("✅ Test Created Successfully!");
          setShowTestModal(false);
          setTestForm({ title: "", pass_key: "", time_limit: 60, problems: [] });
          fetchTests();
      } catch(err) { alert("Failed to create test"); }
  };

  const addProblemToTest = () => {
      if(!currentProblem.title) return alert("Problem title required");
      setTestForm({...testForm, problems: [...testForm.problems, currentProblem]});
      setCurrentProblem({ 
        title: "", description: "", difficulty: "Easy", 
        test_cases: JSON.stringify([{input: "", output: ""}]) 
      });
      alert("Problem Added!");
  };

  const fetchResults = async (testId: number) => {
      setSelectedTestId(testId);
      try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`http://127.0.0.1:8000/api/v1/code-tests/${testId}/results`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setTestResults(res.data);
      } catch(err) { alert("Failed to fetch results"); }
  };

  const downloadResults = () => {
      if(testResults.length === 0) return alert("No results to export");
      const csvContent = "data:text/csv;charset=utf-8,Name,Email,Score,Problems Solved,Time Taken,Date\n" 
          + testResults.map(r => `${r.student_name},${r.email},${r.score},${r.problems_solved},${r.time_taken},${r.submitted_at}`).join("\n");
      const link = document.createElement("a");
      link.href = encodeURI(csvContent);
      link.download = `test_results_${selectedTestId}.csv`;
      document.body.appendChild(link);
      link.click();
  };

  return (
    <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", alignItems: "center" }}>
            <div>
                <h2 style={{ margin: "0 0 5px 0", color: "#1e293b" }}>Code Arena</h2>
                <p style={{ margin: 0, color: "#64748b" }}>Manage coding assessments and view results.</p>
            </div>
            <button onClick={() => setShowTestModal(true)} style={{ background: theme.green, color: "white", padding: "12px 24px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
                <Plus size={18} /> Create Challenge
            </button>
        </div>

        {/* ACTIVE TESTS GRID */}
        <div style={{ display: "grid", gap: "20px" }}>
            {codeTests.length === 0 && <div style={{padding: "40px", textAlign: "center", color: "#999", background: "white", borderRadius: "10px"}}>No active tests found. Create one!</div>}
            
            {codeTests.map(test => (
                <div key={test.id} style={{ background: "white", padding: "25px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                        <div style={{ padding: "12px", background: "#f0f9ff", borderRadius: "10px", color: theme.blue }}>
                            <Code size={24} />
                        </div>
                        <div>
                            <h3 style={{ margin: "0 0 5px 0", fontSize: "18px", color: "#1e293b" }}>{test.title}</h3>
                            <div style={{ display: "flex", gap: "20px", fontSize: "13px", color: "#64748b" }}>
                                <span>🔑 Pass Key: <b>{test.pass_key}</b></span>
                                <span>⏱️ Limit: <b>{test.time_limit} mins</b></span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => fetchResults(test.id)} style={{ background: theme.blue, color: "white", padding: "10px 24px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
                        View Results
                    </button>
                </div>
            ))}
        </div>

        {/* RESULTS TABLE SECTION */}
        {selectedTestId && (
            <div style={{ marginTop: "40px", background: "white", padding: "30px", borderRadius: "12px", border: "1px solid #e0e0e0", animation: "fadeIn 0.3s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
                    <h3 style={{ margin: 0 }}>Results Log (Test ID: {selectedTestId})</h3>
                    <button onClick={downloadResults} style={{ background: "#1e293b", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Download size={16} /> Export CSV
                    </button>
                </div>
                
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#f8fafc", textAlign: "left", color: "#475569" }}>
                            <th style={{padding: "15px", borderBottom: "1px solid #eee"}}>Student Name</th>
                            <th style={{padding: "15px", borderBottom: "1px solid #eee"}}>Email</th>
                            <th style={{padding: "15px", borderBottom: "1px solid #eee"}}>Score</th>
                            <th style={{padding: "15px", borderBottom: "1px solid #eee"}}>Solved</th>
                            <th style={{padding: "15px", borderBottom: "1px solid #eee"}}>Time</th>
                            <th style={{padding: "15px", borderBottom: "1px solid #eee"}}>Submitted</th>
                        </tr>
                    </thead>
                    <tbody>
                        {testResults.map((r, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={{padding: "15px", fontWeight: "600"}}>{r.student_name}</td>
                                <td style={{padding: "15px", color: "#666"}}>{r.email}</td>
                                <td style={{padding: "15px", color: theme.green, fontWeight: "bold"}}>{r.score}</td>
                                <td style={{padding: "15px"}}>{r.problems_solved}</td>
                                <td style={{padding: "15px"}}>{r.time_taken}</td>
                                <td style={{padding: "15px", fontSize: "12px", color: "#888"}}>{r.submitted_at}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* CREATE MODAL */}
        {showTestModal && (
            <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}>
                <div style={{ background: "white", width: "800px", maxHeight: "90vh", borderRadius: "16px", padding: "30px", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
                    <h2 style={{color: theme.darkBlue, borderBottom: "1px solid #eee", paddingBottom: "15px", marginTop: 0}}>Define New Challenge</h2>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "20px" }}>
                        <div><label style={{fontSize:"12px", fontWeight:"bold"}}>Title</label><input value={testForm.title} onChange={e => setTestForm({...testForm, title: e.target.value})} style={{width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "6px", marginTop: "5px"}} /></div>
                        <div><label style={{fontSize:"12px", fontWeight:"bold"}}>Pass Key</label><input value={testForm.pass_key} onChange={e => setTestForm({...testForm, pass_key: e.target.value})} style={{width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "6px", marginTop: "5px"}} /></div>
                        <div><label style={{fontSize:"12px", fontWeight:"bold"}}>Time (Mins)</label><input type="number" value={testForm.time_limit} onChange={e => setTestForm({...testForm, time_limit: Number(e.target.value)})} style={{width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "6px", marginTop: "5px"}} /></div>
                    </div>
                    
                    <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                        <h4 style={{margin: "0 0 15px 0", color: "#333"}}>Add Problem ({testForm.problems.length} added)</h4>
                        <input placeholder="Problem Title (e.g. Fibonacci Series)" value={currentProblem.title} onChange={e => setCurrentProblem({...currentProblem, title: e.target.value})} style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ccc" }} />
                        <textarea placeholder="Problem Description..." value={currentProblem.description} onChange={e => setCurrentProblem({...currentProblem, description: e.target.value})} style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ccc", minHeight: "80px" }} />
                        <button onClick={addProblemToTest} style={{ background: "#334155", color: "white", padding: "10px 20px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>+ Add Problem</button>
                    </div>

                    <div style={{display: "flex", gap: "10px"}}>
                        <button onClick={handleCreateTest} style={{ flex: 1, padding: "15px", background: theme.green, color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>Save Challenge & Notify Students</button>
                        <button onClick={() => setShowTestModal(false)} style={{ flex: 0.3, padding: "15px", background: "#e2e8f0", border: "none", color: "#333", cursor: "pointer", borderRadius: "8px", fontWeight: "bold" }}>Cancel</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CodeArena;