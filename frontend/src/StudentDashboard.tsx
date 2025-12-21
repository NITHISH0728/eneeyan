import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react"; // ✅ Professional Editor
import { 
  LayoutDashboard, BookOpen, Compass, Award, Settings, LogOut, 
  TrendingUp, BookCheck, Trophy, PlayCircle, ShoppingBag, 
  User, Download, Clock, CreditCard, X, Lock, Save, CheckCircle, AlertCircle,
  Code, Play, Terminal, Monitor, AlertTriangle, Eye, ChevronRight, ChevronLeft,
  Menu, Sparkles, Zap, Cpu
} from "lucide-react";
import { motion } from "framer-motion";

// ✅ AI IMPORTS
import * as tf from "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface";
import "@tensorflow/tfjs-backend-webgl";

// --- TYPES ---
interface Course { id: number; title: string; description: string; price: number; image_url: string; instructor_id: number; }
interface CodeTest { id: number; title: string; time_limit: number; problems: any[]; completed?: boolean; }

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home"); 
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  
  // Sidebar State
  const [collapsed, setCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const userData = { name: "Student", email: "student@iqmath.com" };

  // Modal & Settings
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [processing, setProcessing] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // --- CODE ARENA STATES ---
  const [codeTests, setCodeTests] = useState<CodeTest[]>([]);
  const [activeTest, setActiveTest] = useState<CodeTest | null>(null);
  const [passKeyInput, setPassKeyInput] = useState("");
  const [showPassKeyModal, setShowPassKeyModal] = useState<number | null>(null);
  
  // --- PROCTORING & IDE STATES ---
  const [timeLeft, setTimeLeft] = useState(0);
  const [fullScreenWarns, setFullScreenWarns] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [faceStatus, setFaceStatus] = useState<"ok" | "missing" | "multiple">("ok");
  
  // Problem & Code State
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [solutions, setSolutions] = useState<{[key: number]: string}>({});
  const [userCode, setUserCode] = useState("");
  const [language, setLanguage] = useState(71); // Python
  
  const [consoleOutput, setConsoleOutput] = useState("Ready to execute...");
  const [executionStatus, setExecutionStatus] = useState("idle"); 
  const [showHiddenCaseBtn, setShowHiddenCaseBtn] = useState(false);
  const [viewHiddenCase, setViewHiddenCase] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const brand = { blue: "#005EB8", green: "#87C232", bg: "#f8fafc", border: "#e2e8f0", textMain: "#1e293b", textLight: "#64748b" };

  // Language Options
  const languages = [
    { id: 71, name: "Python (3.8.1)", value: "python" },
    { id: 62, name: "Java (OpenJDK 13)", value: "java" },
    { id: 54, name: "C++ (GCC 9.2.0)", value: "cpp" },
    { id: 63, name: "JavaScript (Node.js)", value: "javascript" },
  ];

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "instructor") { navigate("/dashboard"); return; }
    fetchData();
    fetchCodeTests();
  }, [activeTab]);

  // --- 🔒 PROCTORING ENGINE (Strict Mode) ---
  useEffect(() => {
      let aiInterval: any;
      if (activeTest) {
          // Load saved state
          const savedWarns = localStorage.getItem(`warns_${activeTest.id}`);
          if (savedWarns) setFullScreenWarns(parseInt(savedWarns));

          const savedSolutions = localStorage.getItem(`sols_${activeTest.id}`);
          if (savedSolutions) {
              const parsed = JSON.parse(savedSolutions);
              setSolutions(parsed);
              setUserCode(parsed[0] || "# Write your solution here...");
          } else {
              setUserCode("# Write your solution here...");
          }

          // Timer
          const timer = setInterval(() => {
              setTimeLeft(prev => {
                  if (prev <= 1) { submitTest(); return 0; }
                  return prev - 1;
              });
          }, 1000);

          // 🚫 FULL SCREEN ENFORCEMENT
          const handleFullScreenChange = () => {
              if (!document.fullscreenElement) {
                  setIsFullScreen(false);
                  setFullScreenWarns(prev => {
                      const newCount = prev + 1;
                      localStorage.setItem(`warns_${activeTest.id}`, newCount.toString());
                      
                      // ⚠️ TERMINATE IF > 2 VIOLATIONS (3rd Strike)
                      if (newCount > 2) { 
                          submitTest(); 
                          alert("🛑 TEST TERMINATED: You exceeded the full-screen violation limit."); 
                      }
                      return newCount;
                  });
              } else {
                  setIsFullScreen(true);
              }
          };
          document.addEventListener("fullscreenchange", handleFullScreenChange);

          // 👁️ FACE DETECTION
          const setupAI = async () => {
              try {
                  await tf.setBackend('webgl'); 
                  const loadedModel = await blazeface.load();
                  
                  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                      if (videoRef.current) {
                          videoRef.current.srcObject = stream;
                          videoRef.current.onloadeddata = () => {
                              startDetection(loadedModel);
                          };
                      }
                  }
              } catch(err) { console.error("AI Init Failed", err); }
          };
          setupAI();

          const startDetection = (loadedModel: any) => {
              aiInterval = setInterval(async () => {
                  if (videoRef.current && videoRef.current.readyState === 4) {
                      const predictions = await loadedModel.estimateFaces(videoRef.current, false);
                      if (predictions.length === 0) setFaceStatus("missing");
                      else if (predictions.length > 1) setFaceStatus("multiple"); 
                      else setFaceStatus("ok");
                  }
              }, 500); 
          };

          return () => {
              clearInterval(timer);
              clearInterval(aiInterval);
              document.removeEventListener("fullscreenchange", handleFullScreenChange);
              if(videoRef.current && videoRef.current.srcObject) {
                  const stream = videoRef.current.srcObject as MediaStream;
                  stream.getTracks().forEach(track => track.stop());
              }
          };
      }
  }, [activeTest]);

  // --- DATA FETCHERS ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const allRes = await axios.get("http://127.0.0.1:8000/api/v1/courses", config);
      const myRes = await axios.get("http://127.0.0.1:8000/api/v1/my-courses", config);
      const myCourseIds = new Set(myRes.data.map((c: Course) => c.id));
      setAvailableCourses(allRes.data.filter((c: Course) => !myCourseIds.has(c.id)));
      setEnrolledCourses(myRes.data);
    } catch (err: any) { 
        if(err.response && err.response.status === 401) { localStorage.clear(); navigate("/"); }
    } finally { setLoading(false); }
  };

  const fetchCodeTests = async () => {
      const token = localStorage.getItem("token");
      try {
          const res = await axios.get("http://127.0.0.1:8000/api/v1/code-tests", { headers: { Authorization: `Bearer ${token}` } });
          setCodeTests(res.data);
      } catch(err) { console.error(err); }
  };

  const handleStartTest = async () => {
      const token = localStorage.getItem("token");
      try {
          const formData = new FormData(); formData.append("pass_key", passKeyInput);
          const res = await axios.post(`http://127.0.0.1:8000/api/v1/code-tests/${showPassKeyModal}/start`, formData, { headers: { Authorization: `Bearer ${token}` } });
          
          // Check previous violations immediately
          const prevWarns = localStorage.getItem(`warns_${res.data.id}`);
          if (prevWarns && parseInt(prevWarns) > 2) {
              alert("⛔ You have been disqualified from this test.");
              return;
          }

          setActiveTest(res.data);
          setTimeLeft(res.data.time_limit * 60);
          setShowPassKeyModal(null);
          
          // Trigger Full Screen
          if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen().catch((e) => alert("Please enable full screen manually."));
          }
      } catch(err) { triggerToast("Invalid Pass Key", "error"); }
  };

  const handleDownloadCertificate = async (id: number, title: string) => { 
    setDownloadingId(id); 
    try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://127.0.0.1:8000/api/v1/generate-pdf/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob' 
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Certificate-${title.replace(/\s+/g, "_")}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        triggerToast("Certificate Downloaded Successfully!");
    } catch (err) { triggerToast("Failed to generate certificate.", "error"); } finally { setDownloadingId(null); }
  };

  // --- 💻 IDE ACTIONS ---
  const handleSave = () => {
      if(!activeTest) return;
      const newSolutions = { ...solutions, [currentProblemIndex]: userCode };
      setSolutions(newSolutions);
      localStorage.setItem(`sols_${activeTest.id}`, JSON.stringify(newSolutions));
      triggerToast("✅ Code Saved! You can move to other questions.", "success");
  };

  const handleRun = async () => {
      setExecutionStatus("running");
      setConsoleOutput("🚀 Sending to compiler...");
      setShowHiddenCaseBtn(false); 
      setViewHiddenCase(false);
      
      const currentProb = activeTest?.problems[currentProblemIndex];
      const testCases = currentProb ? JSON.parse(currentProb.test_cases) : [];
      const sampleInput = testCases[0]?.input || "5"; 

      try {
          const token = localStorage.getItem("token");
          const res = await axios.post("http://127.0.0.1:8000/api/v1/execute", {
              source_code: userCode,
              language_id: language,
              stdin: sampleInput
          }, { headers: { Authorization: `Bearer ${token}` } });
          
          const output = res.data.stdout || res.data.stderr || res.data.compile_output || "No output";
          
          if (res.data.status?.id === 3) {
              setExecutionStatus("success");
              setConsoleOutput(`✅ Execution Successful:\n\n${output}`);
          } else {
              setExecutionStatus("error");
              setConsoleOutput(`❌ Execution Error (Status: ${res.data.status?.description})\n\n${output}`);
              setShowHiddenCaseBtn(true);
          }
      } catch (err: any) {
          setExecutionStatus("error");
          setConsoleOutput("❌ Network/Compiler Error.\n" + (err.response?.data?.detail || err.message));
      }
  };

  const switchQuestion = (index: number) => {
      handleSave();
      setCurrentProblemIndex(index);
      setUserCode(solutions[index] || "# Write your solution here...");
      setConsoleOutput("Ready to execute...");
      setExecutionStatus("idle");
      setShowHiddenCaseBtn(false);
      setViewHiddenCase(false);
  };

  const returnToFullScreen = () => {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
  };

  const submitTest = async () => {
      const token = localStorage.getItem("token");
      if(!activeTest) return;
      try {
          const timeSpent = Math.floor((activeTest.time_limit * 60 - timeLeft) / 60);
          await axios.post("http://127.0.0.1:8000/api/v1/code-tests/submit", {
              test_id: activeTest.id,
              score: executionStatus === "success" ? 100 : 40,
              problems_solved: Object.keys(solutions).length,
              time_taken: `${timeSpent} mins`
          }, { headers: { Authorization: `Bearer ${token}` } });
          
          setActiveTest(null); 
          localStorage.removeItem(`warns_${activeTest.id}`);
          localStorage.removeItem(`sols_${activeTest.id}`);
          if(document.fullscreenElement) document.exitFullscreen();
          triggerToast("Test Submitted Successfully! Check dashboard.", "success");
      } catch(err) { console.error(err); }
  };

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000); 
  };
  
  const openEnrollModal = (course: Course) => { setSelectedCourse(course); setShowModal(true); };
  const handlePayment = async (courseId: number, price: number) => {
    try {
        const orderUrl = "http://127.0.0.1:8000/api/v1/create-order";
        const { data } = await axios.post(orderUrl, { amount: price }); 
        const options = {
            key: "rzp_test_Ru8lDcv8KvAiC0", 
            amount: data.amount,
            currency: "INR",
            name: "iQmath Pro",
            description: "Lifetime Course Access",
            order_id: data.id, 
            handler: async function (response: any) { alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`); },
            prefill: { name: "Student Name", email: "student@example.com", contact: "9999999999" },
            theme: { color: "#87C232" }
        };
        const rzp1 = new (window as any).Razorpay(options);
        rzp1.open();
    } catch (error) { alert("Payment failed. Check backend console."); }
  };
  
  const handleTrialParams = async () => { if (!selectedCourse) return; setProcessing(true); try { const token = localStorage.getItem("token"); await axios.post(`http://127.0.0.1:8000/api/v1/enroll/${selectedCourse.id}`, { type: "trial" }, { headers: { Authorization: `Bearer ${token}` } }); triggerToast("Trial Activated!"); setShowModal(false); setActiveTab("learning"); fetchData(); } catch(e){ triggerToast("Error", "error"); } finally { setProcessing(false); }};
  const handlePasswordChange = async (e: React.FormEvent) => { e.preventDefault(); triggerToast("Password Updated!"); setSavingSettings(false); };
  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  // ============================================
  // 🔥 UPDATED: PROFESSIONAL CODE ARENA UI
  // ============================================
  if (activeTest) {
      const currentProbData = activeTest.problems[currentProblemIndex];
      const testCases = currentProbData ? JSON.parse(currentProbData.test_cases) : [];

      return (
          <div className="flex flex-col h-screen bg-[#F8FAFC] font-sans overflow-hidden">
              {/* TOP HEADER */}
              <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
                  <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-slate-800 font-extrabold text-lg">
                          <Code className="text-blue-600" /> iQmath <span className="text-slate-400 font-normal">Arena</span>
                      </div>
                      <div className="h-6 w-px bg-slate-200"></div>
                      <h3 className="text-sm font-bold text-slate-700">{activeTest.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                      {activeTest.problems.map((_, idx) => (
                          <button key={idx} onClick={() => switchQuestion(idx)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${idx === currentProblemIndex ? "bg-blue-600 text-white shadow-md" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                              Q{idx + 1}
                          </button>
                      ))}
                  </div>

                  <div className="flex items-center gap-4">
                      <div className={`px-3 py-1.5 rounded-lg border font-mono text-sm font-bold flex items-center gap-2 ${timeLeft < 300 ? "bg-red-50 border-red-200 text-red-600 animate-pulse" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
                          <Clock size={14} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                      </div>
                      <button onClick={submitTest} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">Finish Test</button>
                  </div>
              </div>

              {/* MAIN SPLIT LAYOUT */}
              <div className="flex flex-1 overflow-hidden p-4 gap-4">
                  
                  {/* LEFT COLUMN (40%) */}
                  <div className="w-[40%] flex flex-col gap-4">
                      {/* Problem Description Card */}
                      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-y-auto">
                          <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
                              <h2 className="text-xl font-bold text-slate-800">{currentProbData?.title}</h2>
                              <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded border border-blue-100">MEDIUM</span>
                          </div>
                          <p className="text-slate-600 text-sm leading-relaxed mb-6 whitespace-pre-wrap">{currentProbData?.description || "No description available."}</p>
                          
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Example Case</h4>
                              {testCases.length > 0 && (
                                  <div className="space-y-3">
                                      <div>
                                          <div className="text-[10px] font-bold text-slate-500 mb-1">INPUT</div>
                                          <code className="block bg-white border border-slate-200 p-2 rounded text-xs font-mono text-slate-700">{testCases[0].input}</code>
                                      </div>
                                      <div>
                                          <div className="text-[10px] font-bold text-slate-500 mb-1">OUTPUT</div>
                                          <code className="block bg-white border border-slate-200 p-2 rounded text-xs font-mono text-slate-700">{testCases[0].output}</code>
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* Webcam Proctoring */}
                      <div className="h-[200px] shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
                          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                              <div className={`px-2 py-1 rounded text-[10px] font-bold text-white flex items-center gap-1 ${faceStatus === "ok" ? "bg-green-500" : "bg-red-500"}`}>
                                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                  {faceStatus === "ok" ? "PROCTORING ACTIVE" : "WARNING"}
                              </div>
                              <div className="px-2 py-1 rounded bg-black/50 text-white text-[10px] font-bold">Warn: {fullScreenWarns}/3</div>
                          </div>
                          <video ref={videoRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]" />
                          {faceStatus !== "ok" && (
                              <div className="absolute inset-0 bg-red-500/20 backdrop-blur-sm flex items-center justify-center flex-col text-center p-4">
                                  <AlertTriangle className="text-red-600 mb-2" size={32} />
                                  <span className="bg-white text-red-600 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                      {faceStatus === "missing" ? "FACE NOT DETECTED" : "MULTIPLE FACES DETECTED"}
                                  </span>
                              </div>
                          )}
                      </div>
                  </div>

                  {/* RIGHT COLUMN (60%) */}
                  <div className="w-[60%] flex flex-col gap-4">
                      
                      {/* Top: Monaco Code Editor */}
                      <div className="flex-[2.5] bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                          <div className="bg-slate-50 border-b border-slate-200 h-10 flex items-center justify-between px-4">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                  <Code size={14} /> Editor
                              </div>
                              <select 
                                  value={language} 
                                  onChange={(e) => setLanguage(parseInt(e.target.value))} 
                                  className="bg-white border border-slate-300 text-xs rounded px-2 py-0.5 outline-none focus:border-blue-500 cursor-pointer"
                              >
                                  {languages.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                              </select>
                          </div>
                          <div className="flex-1 pt-2">
                              <Editor
                                  height="100%"
                                  defaultLanguage="python"
                                  language={languages.find(l => l.id === language)?.value}
                                  theme="light"
                                  value={userCode}
                                  onChange={(val) => setUserCode(val || "")}
                                  options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, padding: { top: 10 } }}
                              />
                          </div>
                      </div>

                      {/* Bottom: Console & Controls */}
                      <div className="flex-[1.5] flex flex-col gap-4">
                          <div className="flex-[1.3] bg-slate-900 rounded-xl shadow-sm border border-slate-800 flex flex-col overflow-hidden">
                              <div className="bg-slate-950 h-8 flex items-center px-4 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider gap-2">
                                  <Terminal size={12} /> Console Output
                              </div>
                              <div className="flex-1 p-4 font-mono text-xs text-green-400 overflow-y-auto whitespace-pre-wrap">
                                  {consoleOutput}
                              </div>
                          </div>

                          <div className="h-12 flex gap-3">
                              <button onClick={handleSave} className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm">
                                  <Save size={16} /> Save Code
                              </button>
                              <button onClick={handleRun} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm">
                                  {executionStatus === "running" ? <Cpu className="animate-spin" size={16} /> : <Play size={16} />} 
                                  {executionStatus === "running" ? "Running..." : "Run Code"}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>

              {/* 🛑 TEST INTERRUPTED OVERLAY (Proctoring) */}
              {!isFullScreen && (
                  <div className="fixed inset-0 bg-slate-900/95 z-[9999] flex flex-col items-center justify-center text-center p-8">
                      <AlertTriangle size={64} className="text-red-500 mb-6 animate-bounce" />
                      <h1 className="text-3xl font-bold text-white mb-2 tracking-widest uppercase text-red-500">Test Interrupted</h1>
                      <p className="text-slate-400 max-w-md mb-8 text-lg">
                          You have exited full-screen mode. This is a proctoring violation.
                          <br/><span className="text-slate-500 text-sm">Your attempt has been logged.</span>
                      </p>
                      <div className="bg-red-500/10 text-red-400 px-6 py-3 rounded-lg font-mono font-bold mb-8 border border-red-500/30 text-xl">
                          Remaining Warnings: {2 - fullScreenWarns}
                      </div>
                      <button 
                          onClick={returnToFullScreen} 
                          className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-red-900/20 flex items-center gap-2"
                      >
                          <Monitor size={20} /> RETURN TO FULL SCREEN
                      </button>
                  </div>
              )}
          </div>
      );
  }

  // --- DASHBOARD LAYOUT & COMPONENTS (Rest of file unchanged) ---
  const SidebarItem = ({ icon, label, active, onClick }: any) => (
    <button onClick={onClick} title={collapsed ? label : ""} style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: "12px", width: "100%", padding: "12px 16px", border: "none", borderRadius: "100px", background: active ? `${brand.blue}10` : "transparent", color: active ? brand.blue : brand.textLight, fontWeight: active ? "700" : "500", cursor: "pointer", transition: "all 0.2s" }}>
      {icon} {!collapsed && <span style={{ fontSize: "15px" }}>{label}</span>}
    </button>
  );

  const stats = { assigned: enrolledCourses.length, rank: Math.floor(Math.random() * 100) + 1 };

  // Counter
  const AnimatedCounter = ({ value }: { value: number }) => {
      const [count, setCount] = useState(0);
      useEffect(() => {
          let start = 0;
          const end = value;
          const duration = 1000;
          const increment = end / (duration / 16);
          const timer = setInterval(() => {
              start += increment;
              if (start >= end) { setCount(end); clearInterval(timer); } 
              else { setCount(Math.floor(start)); }
          }, 16);
          return () => clearInterval(timer);
      }, [value]);
      return <span>{count}</span>;
  };

  const StatCard = ({ title, value, icon, color, delay }: any) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay * 0.2, duration: 0.5 }} whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex-1 flex flex-col gap-3 cursor-pointer group">
      <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-500">{title}</span><div style={{ backgroundColor: `${color}15`, color }} className="p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">{icon}</div></div>
      <div className="text-3xl font-extrabold text-slate-800"><AnimatedCounter value={typeof value === 'number' ? value : parseInt(value.replace(/\D/g,'')) || 0} />{typeof value === 'string' && value.includes('#') && <span className="text-sm text-slate-400 ml-1">Rank</span>}</div>
    </motion.div>
  );

  const CourseCard = ({ course, type }: { course: Course, type: "enrolled" | "available" }) => (
      <div style={{ background: "white", borderRadius: "16px", border: `1px solid ${brand.border}`, overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" }} onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 20px -5px rgba(0,0,0,0.1)"; }} onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
          <div style={{ height: "160px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              {course.image_url ? (<img src={course.image_url.startsWith('http') ? course.image_url : `http://127.0.0.1:8000/${course.image_url}`} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />) : (<BookOpen size={40} color={brand.textLight} />)}
              {type === "enrolled" && <div style={{ position: "absolute", top: 10, right: 10, background: brand.green, color: "white", padding: "4px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: "800" }}>ACTIVE</div>}
          </div>
          <div style={{ padding: "20px" }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "700", color: brand.textMain }}>{course.title}</h4>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
                  <span style={{ fontSize: "18px", fontWeight: "800", color: brand.blue }}>₹{course.price}</span>
                  {type === "available" ? (<button onClick={() => openEnrollModal(course)} style={{ background: brand.blue, color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", display: "flex", gap: "6px", alignItems: "center" }}><ShoppingBag size={14} /> Enroll</button>) : (<button onClick={() => navigate(`/course/${course.id}/player`)} style={{ background: brand.textMain, color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", display: "flex", gap: "6px", alignItems: "center" }}><PlayCircle size={14} /> Resume</button>)}
              </div>
          </div>
      </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: brand.bg, fontFamily: "'Inter', sans-serif" }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: collapsed ? "80px" : "260px", background: "white", borderRight: `1px solid ${brand.border}`, padding: "24px 12px", display: "flex", flexDirection: "column", position: "fixed", height: "100vh", zIndex: 50, transition: "width 0.3s ease" }}>
        <div style={{ marginBottom: "40px", paddingLeft: "10px", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between" }}>
            {!collapsed && <span style={{ fontSize: "22px", fontWeight: "900", color: brand.blue }}>iQmath<span style={{ color: brand.green }}>Pro</span></span>}
            <button onClick={() => setCollapsed(!collapsed)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><Menu size={24} color={brand.textMain} /></button>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Home" active={activeTab === "home"} onClick={() => setActiveTab("home")} />
          <SidebarItem icon={<BookOpen size={20} />} label="My Learning" active={activeTab === "learning"} onClick={() => setActiveTab("learning")} />
          <SidebarItem icon={<Code size={20} />} label="Code Test" active={activeTab === "test"} onClick={() => setActiveTab("test")} />
          <SidebarItem icon={<Compass size={20} />} label="Explore Courses" active={activeTab === "explore"} onClick={() => setActiveTab("explore")} />
          <SidebarItem icon={<Award size={20} />} label="My Certificates" active={activeTab === "certificates"} onClick={() => setActiveTab("certificates")} />
        </nav>
        <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: "12px", padding: "12px 16px", borderRadius: "10px", background: "#fef2f2", color: "#ef4444", border: "none", fontWeight: "600", cursor: "pointer", width: "100%", marginTop: "5px" }}><LogOut size={20} /> {!collapsed && "Sign Out"}</button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ marginLeft: collapsed ? "80px" : "260px", width: `calc(100% - ${collapsed ? "80px" : "260px"})`, minHeight: "100vh", padding: "40px", transition: "margin-left 0.3s ease, width 0.3s ease" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: brand.textMain }}>{activeTab === "test" ? "Active Challenges" : "Dashboard Overview"}</h2>
          
          {/* USER PROFILE DROPDOWN */}
          <div className="relative">
            <button onClick={() => setShowProfileMenu(!showProfileMenu)} style={{ width: "40px", height: "40px", borderRadius: "50%", background: brand.blue, color: "white", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
                <User size={20} />
            </button>
            {showProfileMenu && (
                <div style={{ position: "absolute", right: 0, top: "50px", width: "220px", background: "white", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)", padding: "16px", zIndex: 100, border: `1px solid ${brand.border}` }}>
                    <div style={{ marginBottom: "12px", borderBottom: `1px solid ${brand.border}`, paddingBottom: "12px" }}>
                        <p style={{ fontWeight: "700", color: brand.textMain, margin: 0 }}>{userData.name}</p>
                        <p style={{ fontSize: "12px", color: brand.textLight, margin: "4px 0 0 0", overflow: "hidden", textOverflow: "ellipsis" }}>{userData.email}</p>
                    </div>
                    <button onClick={() => { setActiveTab("settings"); setShowProfileMenu(false); }} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "8px", borderRadius: "6px", border: "none", background: "transparent", color: brand.textMain, cursor: "pointer", fontWeight: "500", textAlign: "left", marginBottom: "4px" }} onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                        <Settings size={16} /> Settings
                    </button>
                    <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "8px", borderRadius: "6px", border: "none", background: "transparent", color: "#ef4444", cursor: "pointer", fontWeight: "500", textAlign: "left" }} onMouseOver={(e) => e.currentTarget.style.background = "#fef2f2"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            )}
          </div>
        </header>

        {activeTab === "home" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col gap-8">
                <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Welcome back, Student! 👋</h1>
                        <p className="text-slate-500 font-medium flex items-center gap-2"><Sparkles size={16} className="text-yellow-500" /> You're on a <span className="text-slate-800 font-bold">5-day learning streak</span>. Keep it up!</p>
                    </div>
                </motion.div>
                {enrolledCourses.length > 0 ? (
                    <motion.div whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-gradient-to-r from-[#005EB8] to-[#004080] rounded-2xl p-8 text-white shadow-xl flex items-center justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <div className="relative z-10 w-full max-w-lg">
                            <div className="flex items-center gap-3 mb-4 text-blue-200 text-sm font-bold uppercase tracking-wider"><Zap size={16} /> Current Focus</div>
                            <h2 className="text-2xl font-bold mb-6">{enrolledCourses[0].title}</h2>
                            <div className="w-full bg-blue-900/50 rounded-full h-3 mb-4 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: "35%" }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }} className="h-full bg-[#87C232] rounded-full"></motion.div></div>
                            <div className="flex justify-between text-sm font-medium opacity-90"><span>35% Completed</span><span>4/12 Modules</span></div>
                        </div>
                        <motion.button initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.8 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate(`/course/${enrolledCourses[0].id}/player`)} className="relative z-10 bg-white text-[#005EB8] px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg">Resume <ChevronRight size={18} /></motion.button>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-10 rounded-2xl border border-dashed border-slate-300 text-center"><p className="text-slate-400">Enroll in a course to track your progress here.</p></motion.div>
                )}
                <div className="grid grid-cols-3 gap-6">
                    <StatCard title="Courses Enrolled" value={stats.assigned} icon={<BookCheck size={24} />} color={brand.blue} delay={1} />
                    <StatCard title="Certificates Earned" value={enrolledCourses.length} icon={<Award size={24} />} color={brand.green} delay={1.2} />
                    <StatCard title="Leaderboard Rank" value={`#${stats.rank}`} icon={<Trophy size={24} />} color="#EAB308" delay={1.4} />
                </div>
            </motion.div>
        )}

        {/* ... (Learning, Explore, Test, Certs, Settings tabs - same as before) ... */}
        {activeTab === "learning" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>{enrolledCourses.map(c => <CourseCard key={c.id} course={c} type="enrolled" />)}</div>}
        {activeTab === "explore" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>{availableCourses.map(c => <CourseCard key={c.id} course={c} type="available" />)}</div>}
        {activeTab === "test" && (
            <div style={{ display: "grid", gap: "20px" }}>
                {codeTests.length === 0 ? <p>No active challenges available.</p> : codeTests.map(test => (
                    <div key={test.id} style={{ background: "white", padding: "25px", borderRadius: "12px", border: `1px solid ${brand.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div><h3 style={{ margin: 0, fontSize: "18px", color: brand.textMain }}>{test.title}</h3><p style={{ margin: "5px 0", color: brand.textLight }}>Duration: {test.time_limit} Mins</p></div>
                        <button onClick={() => setShowPassKeyModal(test.id)} style={{ background: brand.blue, color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Start Test</button>
                    </div>
                ))}
            </div>
        )}
        {activeTab === "certificates" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
                <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "24px", color: brand.textMain }}>Your Credentials</h3>
                {enrolledCourses.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "24px" }}>
                        {enrolledCourses.map(course => (
                            <div key={course.id} style={{ background: "white", borderRadius: "16px", border: `1px solid ${brand.border}`, overflow: "hidden", display: "flex", flexDirection: "column", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-4px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
                                <div style={{ height: "200px", background: "#f8fafc", position: "relative", borderBottom: `1px solid ${brand.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <div style={{ width: "80%", height: "80%", background: "white", border: "4px double #e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                                        <Award size={32} color={brand.green} style={{ marginBottom: "8px" }} />
                                        <div style={{ fontSize: "8px", fontWeight: "700", color: brand.blue, letterSpacing: "1px" }}>CERTIFICATE OF COMPLETION</div>
                                        <div style={{ fontSize: "14px", fontWeight: "800", color: brand.textMain, marginTop: "8px", textAlign: "center", padding: "0 10px" }}>{course.title}</div>
                                    </div>
                                </div>
                                <div style={{ padding: "20px" }}>
                                    <button onClick={() => handleDownloadCertificate(course.id, course.title)} disabled={downloadingId === course.id} style={{ width: "100%", padding: "12px", background: brand.blue, color: "white", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: downloadingId === course.id ? 0.7 : 1 }}>
                                        <Download size={18} /> {downloadingId === course.id ? "Generating PDF..." : "Download PDF"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: "center", padding: "60px", background: "white", borderRadius: "16px", border: `2px dashed ${brand.border}` }}>
                        <Award size={48} color="#cbd5e1" style={{ marginBottom: "20px" }} />
                        <h3 style={{ color: brand.textLight }}>No certificates earned yet</h3>
                    </div>
                )}
            </div>
        )}
        {activeTab === "settings" && (
            <div style={{ maxWidth: "600px", margin: "0 auto", background: "white", padding: "40px", borderRadius: "12px" }}>
                <h3>Security Settings</h3>
                <form onSubmit={handlePasswordChange}>
                    <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" style={{ width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "8px", border: "1px solid #ccc" }} />
                    <button type="submit" disabled={savingSettings} style={{ padding: "10px 20px", background: brand.blue, color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>Update Password</button>
                </form>
            </div>
        )}
      </main>

      {/* PASS KEY MODAL */}
      {showPassKeyModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: "white", padding: "30px", borderRadius: "16px", width: "400px" }}>
                  <h3>Enter Pass Key</h3>
                  <input type="password" value={passKeyInput} onChange={e => setPassKeyInput(e.target.value)} placeholder="Ask instructor for key..." style={{ width: "100%", padding: "12px", margin: "15px 0", borderRadius: "8px", border: "1px solid #ccc" }} />
                  <button onClick={handleStartTest} style={{ width: "100%", padding: "12px", background: brand.blue, color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>Verify & Start</button>
                  <button onClick={() => setShowPassKeyModal(null)} style={{ width: "100%", padding: "10px", marginTop: "10px", background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
              </div>
          </div>
      )}

      {/* TOAST */}
      {toast.show && (
        <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999, background: "white", padding: "16px 24px", borderRadius: "12px", boxShadow: "0 10px 30px -5px rgba(0,0,0,0.15)", borderLeft: `6px solid ${toast.type === "success" ? brand.green : "#ef4444"}`, display: "flex", alignItems: "center", gap: "12px" }}>
           {toast.type === "success" ? <CheckCircle size={24} color={brand.green} /> : <AlertCircle size={24} color="#ef4444" />}
           <div><h4 style={{ margin: "0" }}>{toast.type === "success" ? "Success" : "Error"}</h4><p style={{ margin: 0, fontSize: "13px" }}>{toast.message}</p></div>
        </div>
      )}

      {/* MODAL POPUP */}
      {showModal && selectedCourse && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(5px)" }}>
           <div style={{ background: "white", width: "450px", borderRadius: "20px", padding: "30px", position: "relative", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
              <button onClick={() => setShowModal(false)} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", cursor: "pointer" }}><X size={24} color="#94a3b8" /></button>
              <h2 style={{ margin: "0 0 5px 0", fontSize: "22px", color: brand.textMain }}>Unlock Course</h2>
              <p style={{ margin: "0 0 25px 0", color: "#64748b" }}>{selectedCourse.title}</p>
              <div style={{ border: `2px solid ${brand.green}`, borderRadius: "12px", padding: "20px", background: "#f0fdf4", position: "relative", marginBottom: "25px" }}>
                 <div style={{ position: "absolute", top: "-12px", right: "20px", background: brand.green, color: "white", fontSize: "11px", fontWeight: "800", padding: "4px 12px", borderRadius: "20px", textTransform: "uppercase" }}>Recommended</div>
                 <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <Clock size={24} color={brand.green} />
                    <h3 style={{ margin: 0, fontSize: "18px", color: "#166534" }}>Start 7-Day Free Trial</h3>
                 </div>
                 <p style={{ fontSize: "13px", color: "#15803d", margin: "0 0 15px 0", lineHeight: "1.5" }}>Get full access to all modules and assignments for 7 days. No credit card required. No commitment.</p>
                 <button onClick={handleTrialParams} disabled={processing} style={{ width: "100%", padding: "12px", background: brand.green, color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "15px", boxShadow: "0 4px 6px -1px rgba(135, 194, 50, 0.4)" }}>
                   {processing ? "Activating..." : "Start Free Trial"}
                 </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "15px", margin: "0 0 25px 0" }}>
                 <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }}></div><span style={{ fontSize: "12px", fontWeight: "700", color: "#94a3b8" }}>OR</span><div style={{ flex: 1, height: "1px", background: "#e2e8f0" }}></div>
              </div>
             <button 
    onClick={() => handlePayment(selectedCourse.id, 599)} // 👈 Connect it here!
    className="w-full py-3 rounded-xl border border-slate-200 font-bold text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
>
    <CreditCard size={20} />
    Buy Lifetime Access for ₹599
</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;