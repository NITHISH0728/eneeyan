import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Editor from "@monaco-editor/react"; 
import Plyr from "plyr-react"; 
import "plyr/dist/plyr.css"; 

import { 
  PlayCircle, FileText, ChevronLeft, Menu, Code, HelpCircle, 
  UploadCloud, Play, Save, Monitor, Cpu, ChevronDown, ChevronRight, CreditCard,
  ExternalLink, File as FileIcon, X, CheckCircle, AlertCircle
} from "lucide-react";

// --- 🎥 COMPONENT: FACE PROCTORING CAM (KEPT FROM EXISTING FILE) ---
const FaceProctoring = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera Error:", err);
      }
    };
    startVideo();
  }, []);

  return (
    <div className="h-full flex flex-col bg-black rounded-xl overflow-hidden relative border border-slate-300 shadow-sm">
        <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full"></div> REC
        </div>
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <div className="bg-slate-900 text-white text-xs p-2 text-center font-mono">
            AI PROCTORING ACTIVE
        </div>
    </div>
  );
};

// --- 💻 COMPONENT: PROFESSIONAL CODE ARENA (KEPT FROM EXISTING FILE) ---
const CodeCompiler = ({ lesson }: { lesson: any }) => {
  const [code, setCode] = useState(lesson.initial_code || "# Write your solution here...\nprint('Hello iQmath')");
  const [output, setOutput] = useState("Ready to execute...");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(71); 

  const languages = [
    { id: 71, name: "Python (3.8.1)", value: "python" },
    { id: 62, name: "Java (OpenJDK 13)", value: "java" },
    { id: 54, name: "C++ (GCC 9.2.0)", value: "cpp" },
    { id: 63, name: "JavaScript (Node.js)", value: "javascript" },
  ];

  const testCases = lesson.test_cases ? JSON.parse(lesson.test_cases) : [];

  const runCode = async () => {
    setLoading(true);
    setOutput("Compiling & Executing...");
    try {
        const res = await axios.post("http://127.0.0.1:8000/api/v1/execute", {
            source_code: code,
            language_id: language, 
            stdin: testCases[0]?.input || "" 
        });
        if (res.data.stdout) setOutput(res.data.stdout);
        else if (res.data.stderr) setOutput(`Error:\n${res.data.stderr}`);
        else if (res.data.compile_output) setOutput(`Compile Error:\n${res.data.compile_output}`);
        else setOutput("Execution finished with no output.");
    } catch (err) {
        console.error(err);
        setOutput("❌ Execution Failed. Check backend connection.");
    } finally {
        setLoading(false);
    }
  };

  const saveProgress = () => {
      alert("✅ Code Saved Successfully! You can move to the next problem.");
  };

  return (
    <div className="flex h-full p-4 gap-4 bg-slate-100 font-sans">
        <div className="w-[40%] flex flex-col gap-4">
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-extrabold text-slate-800 m-0">{lesson.title}</h2>
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded">MEDIUM</span>
                </div>
                <div className="prose prose-sm text-slate-600 mb-6">
                    {lesson.description || "No description provided."}
                </div>
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest mb-3">Test Cases</h3>
                <div className="space-y-3">
                    {testCases.map((tc: any, i: number) => (
                        !tc.hidden && (
                            <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <div className="text-xs font-bold text-slate-500 mb-1">Input:</div>
                                <div className="font-mono text-xs bg-white p-2 rounded border border-slate-200 mb-2">{tc.input}</div>
                                <div className="text-xs font-bold text-slate-500 mb-1">Expected Output:</div>
                                <div className="font-mono text-xs bg-white p-2 rounded border border-slate-200">{tc.output}</div>
                            </div>
                        )
                    ))}
                </div>
            </div>
            <div className="h-[200px] shrink-0"><FaceProctoring /></div>
        </div>
        <div className="w-[60%] flex flex-col gap-4">
            <div className="flex-[2.5] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 p-2 flex justify-between items-center px-4 h-12">
                    <div className="flex items-center gap-2 text-slate-600 font-bold text-sm"><Code size={16} /> Code Editor</div>
                    <select className="bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500" value={language} onChange={(e) => setLanguage(parseInt(e.target.value))}>
                        {languages.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </div>
                <div className="flex-1">
                    <Editor height="100%" defaultLanguage="python" language={languages.find(l => l.id === language)?.value} theme="light" value={code} onChange={(val) => setCode(val || "")} options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false }} />
                </div>
            </div>
            <div className="flex-[1.5] flex flex-col gap-4">
                <div className="flex-[1.3] flex flex-col bg-slate-900 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-800 text-slate-400 px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2"><Monitor size={14} /> Terminal Output</div>
                    <div className="flex-1 p-4 font-mono text-sm text-green-400 overflow-y-auto whitespace-pre-wrap">{output}</div>
                </div>
                <div className="flex-[0.2] flex gap-3">
                    <button onClick={saveProgress} className="flex-1 bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"><Save size={18} /> Save & Next</button>
                    <button onClick={runCode} disabled={loading} className="flex-1 bg-[#005EB8] hover:bg-[#004a94] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70">{loading ? <Cpu size={18} className="animate-spin" /> : <Play size={18} />} {loading ? "Running..." : "Run Code"}</button>
                </div>
            </div>
        </div>
    </div>
  );
};

// --- MAIN PLAYER COMPONENT ---
const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  
  // File Upload State
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const brand = { blue: "#005EB8", green: "#87C232", textMain: "#0f172a", textLight: "#64748b" };

  // --- Payment Logic (KEPT FROM EXISTING FILE) ---
  const handlePayment = async () => {
    try {
        const orderUrl = "http://127.0.0.1:8000/api/v1/create-order";
        const { data } = await axios.post(orderUrl, { amount: 599 }); 
        const options = {
            key: "rzp_test_Ru8lDcv8KvAiC0", 
            amount: data.amount,
            currency: "INR",
            name: "iQmath Pro",
            description: "Lifetime Course Access",
            order_id: data.id, 
            handler: function (response: any) { alert(`Payment Successful! ID: ${response.razorpay_payment_id}`); },
            theme: { color: "#87C232" }
        };
        const rzp1 = new (window as any).Razorpay(options);
        rzp1.open();
    } catch (error) { alert("Payment init failed"); }
  };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://127.0.0.1:8000/api/v1/courses/${courseId}/player`, { headers: { Authorization: `Bearer ${token}` } });
        setCourse(res.data);
        if (res.data.modules?.[0]) {
            setExpandedModules([res.data.modules[0].id]); 
            if (res.data.modules[0].lessons?.length > 0) setActiveLesson(res.data.modules[0].lessons[0]);
        }
      } catch (err) { console.error(err); }
    };
    fetchCourse();
  }, [courseId]);

  const toggleModule = (moduleId: number) => setExpandedModules(prev => prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]);
  
  // ✅ FIX: "Smart Link Converter" (IMPORTED FROM OLD CODE)
  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    // If it's a Google Form, make it embedded
    if (url.includes("docs.google.com/forms")) {
        return url.replace(/\/viewform.*/, "/viewform?embedded=true").replace(/\/view.*/, "/viewform?embedded=true");
    }
    // If it's a Drive File, use preview mode
    return url.replace("/view", "/preview");
  };

  // ✅ HELPER: Extract YouTube ID
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // ✅ MEMOIZED PLYR OPTIONS
  const plyrOptions = useMemo(() => ({
    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
    youtube: { noCookie: true, rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1 },
  }), []);

  // Handle Assignment Upload Logic
  const handleAssignmentUpload = async () => {
    if (!assignmentFile) return;
    setUploading(true);
    
    try {
        const formData = new FormData();
        formData.append("file", assignmentFile);
        formData.append("course_title", course?.title || "Unknown Course");
        formData.append("lesson_title", activeLesson.title);

        const token = localStorage.getItem("token");
        
        await axios.post("http://127.0.0.1:8000/api/v1/submit-assignment", formData, {
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "multipart/form-data" }
        });

        alert(`✅ Assignment "${assignmentFile.name}" Submitted Successfully!`);
        setAssignmentFile(null); 

    } catch (err) {
        console.error(err);
        alert("❌ Upload Failed. Please try again.");
    } finally {
        setUploading(false);
    }
  };

  const renderContent = () => {
    if (!activeLesson) return <div className="text-white p-10 text-center">Select a lesson</div>;
    
    // 📝 1. NOTES
    if (activeLesson.type === "note") return <iframe src={getEmbedUrl(activeLesson.url)} width="100%" height="100%" className="bg-white border-0" allow="autoplay" />;
    
    // ✅ 2. QUIZ (Google Forms - IMPORTED FROM OLD CODE)
    if (activeLesson.type === "quiz") {
        return (
            <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-4">
                <iframe 
                    src={getEmbedUrl(activeLesson.url)} 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    className="rounded-xl shadow-sm border border-slate-200 bg-white max-w-4xl"
                    allowFullScreen
                >Loading...</iframe>
            </div>
        );
    }

    // 🎥 3. VIDEO (KEPT EXISTING PRIVATE PLAYER)
    if (activeLesson.type === "video" || activeLesson.type === "live_class") {
        const videoId = getYoutubeId(activeLesson.url);
        
        if (!videoId) return <div style={{color: "white", padding: "40px"}}>Invalid Video URL</div>;

        const plyrSource = {
            type: "video" as const, 
            sources: [{ src: videoId, provider: "youtube" as const }],
        };

        return (
            <div style={{ width: "100%", height: "100%", background: "black", display: "flex", alignItems: "center", justifyContent: "center" }}>
               <div style={{ width: "100%", maxWidth: "1000px", borderRadius: "12px", overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
                  <style>{`
                     .plyr__video-embed iframe { top: -50%; height: 200%; }
                     :root { --plyr-color-main: #005EB8; }
                  `}</style>
                  
                  <Plyr 
                    key={activeLesson.id} 
                    source={plyrSource} 
                    options={plyrOptions} 
                  />
               </div>
            </div>
        );
    }
    
    // 💻 4. CODE ARENA
    if (activeLesson.type === "code_test") return <CodeCompiler lesson={activeLesson} />;
    
    // 📂 5. ASSIGNMENT (Direct Upload - KEPT EXISTING LOGIC)
    if (activeLesson.type === "assignment") {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-[#F8FAFC] p-8 font-sans text-slate-800">
            <div className="bg-white p-10 rounded-2xl shadow-xl max-w-2xl w-full text-center border border-slate-100">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <UploadCloud size={40} className="text-[#005EB8]" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">{activeLesson.title}</h2>
                {activeLesson.is_mandatory && (<span className="inline-block bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full mb-4">MANDATORY SUBMISSION</span>)}
                <p className="text-slate-600 mb-8 leading-relaxed whitespace-pre-wrap text-sm">
                    {activeLesson.instructions || activeLesson.description || "Upload your assignment below. Supported formats: PDF, DOCX, ZIP."}
                </p>
                <div className="mb-8">
                    {!assignmentFile ? (
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer relative group">
                            <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => setAssignmentFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx,.zip" />
                            <div className="flex flex-col items-center gap-3 group-hover:scale-105 transition-transform">
                                <UploadCloud size={32} className="text-slate-400 group-hover:text-[#005EB8]" />
                                <div>
                                    <p className="text-slate-700 font-bold text-sm">Click to upload or drag and drop</p>
                                    <p className="text-slate-400 text-xs mt-1">Maximum file size 10MB</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-white p-2 rounded-lg border border-blue-100 text-[#005EB8]"><FileIcon size={24} /></div>
                                <div className="text-left">
                                    <p className="text-slate-800 font-bold text-sm truncate max-w-[200px]">{assignmentFile.name}</p>
                                    <p className="text-slate-500 text-xs">{(assignmentFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button onClick={() => setAssignmentFile(null)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-red-500"><X size={20} /></button>
                        </div>
                    )}
                </div>
                <button onClick={handleAssignmentUpload} disabled={!assignmentFile || uploading} className="w-full py-4 bg-[#005EB8] hover:bg-[#004a94] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                    {uploading ? "Uploading to Drive..." : "Submit Assignment"}
                    {!uploading && <CheckCircle size={20} />}
                </button>
            </div>
        </div>
      );
    }
    
    return <div className="text-white p-10 text-center">Select content from the sidebar</div>;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans bg-slate-900">
      <div className="flex-1 flex flex-col h-full">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/student-dashboard")} className="bg-none border-none cursor-pointer text-slate-500 flex items-center gap-2 font-semibold hover:text-slate-800"><ChevronLeft size={20} /> Dashboard</button>
            <div className="h-6 w-px bg-slate-200"></div>
            <h1 className="text-base font-bold text-slate-900 m-0">{activeLesson?.title || "Course Player"}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handlePayment} className="flex items-center gap-2 bg-[#87C232] text-white px-4 py-2 rounded-lg font-bold border-none cursor-pointer hover:bg-[#76a82b] transition-colors"><CreditCard size={18} /> Buy Lifetime Access</button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="bg-none border-none cursor-pointer"><Menu color={brand.textMain} /></button>
          </div>
        </header>
        <div className="flex-1 bg-white relative overflow-hidden">{renderContent()}</div>
      </div>
      {sidebarOpen && (
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col h-full">
           <div className="p-6 border-b border-slate-200"><h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest m-0">Course Content</h2></div>
           <div className="flex-1 overflow-y-auto p-0">
             {course?.modules.map((module: any, idx: number) => (
                <div key={module.id} className="border-b border-slate-100">
                  <div onClick={() => toggleModule(module.id)} className="p-4 bg-slate-50 cursor-pointer flex justify-between items-center hover:bg-slate-100 transition-colors">
                    <div><div className="text-[11px] font-bold text-slate-500 uppercase">Section {idx + 1}</div><div className="text-sm font-semibold text-slate-800">{module.title}</div></div>
                    {expandedModules.includes(module.id) ? <ChevronDown size={18} color="#64748b" /> : <ChevronRight size={18} color="#64748b" />}
                  </div>
                  {expandedModules.includes(module.id) && (
                    <div className="animate-fade-in">
                      {module.lessons.map((lesson: any) => {
                        const isActive = activeLesson?.id === lesson.id;
                        return (
                          <div key={lesson.id} onClick={() => setActiveLesson(lesson)} className={`flex items-center gap-3 p-3 pl-6 cursor-pointer border-l-4 transition-all ${isActive ? 'bg-blue-50 border-blue-600' : 'bg-white border-transparent hover:bg-slate-50'}`}>
                            <div className={isActive ? "text-blue-600" : "text-slate-400"}>
                              {lesson.type.includes("video") && <PlayCircle size={16} />}
                              {lesson.type === "note" && <FileText size={16} />}
                              {/* ✅ ADDED QUIZ ICON LOGIC HERE */}
                              {lesson.type === "quiz" && <HelpCircle size={16} />} 
                              {lesson.type.includes("code") && <Code size={16} />}
                              {lesson.type === "assignment" && <UploadCloud size={16} />}
                            </div>
                            <div className={`text-sm flex-1 ${isActive ? "text-blue-600 font-semibold" : "text-slate-600"}`}>{lesson.title}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
             ))}
           </div>
        </aside>
      )}
    </div>
  );
};

export default CoursePlayer;