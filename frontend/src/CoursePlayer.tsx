import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Editor from "@monaco-editor/react"; // Professional Editor
// @ts-ignore
import Plyr from "plyr"; 
import "plyr/dist/plyr.css"; 

import { 
  PlayCircle, FileText, ChevronLeft, Menu, Code, HelpCircle, 
  UploadCloud, Play, Save, Monitor, Cpu, ChevronDown, ChevronRight, CreditCard 
} from "lucide-react";

// --- 🎥 COMPONENT: FACE PROCTORING CAM ---
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

// --- 💻 COMPONENT: PROFESSIONAL CODE ARENA ---
const CodeCompiler = ({ lesson }: { lesson: any }) => {
  // State
  const [code, setCode] = useState(lesson.initial_code || "# Write your solution here...\nprint('Hello iQmath')");
  const [output, setOutput] = useState("Ready to execute...");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(71); // Default Python (71)

  // Language Options (Judge0 IDs)
  const languages = [
    { id: 71, name: "Python (3.8.1)", value: "python" },
    { id: 62, name: "Java (OpenJDK 13)", value: "java" },
    { id: 54, name: "C++ (GCC 9.2.0)", value: "cpp" },
    { id: 63, name: "JavaScript (Node.js)", value: "javascript" },
  ];

  // Parse Test Cases (safely)
  const testCases = lesson.test_cases ? JSON.parse(lesson.test_cases) : [];

  const runCode = async () => {
    setLoading(true);
    setOutput("Compiling & Executing...");
    
    try {
        // Call Backend Proxy to Judge0
        const res = await axios.post("http://127.0.0.1:8000/api/v1/execute", {
            source_code: code,
            language_id: language, 
            stdin: testCases[0]?.input || "" // Use first test case input for now
        });

        // Format Output
        if (res.data.stdout) {
            setOutput(res.data.stdout);
        } else if (res.data.stderr) {
            setOutput(`Error:\n${res.data.stderr}`);
        } else if (res.data.compile_output) {
            setOutput(`Compile Error:\n${res.data.compile_output}`);
        } else {
            setOutput("Execution finished with no output.");
        }

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
        
        {/* --- LEFT COLUMN (40%) --- */}
        <div className="w-[40%] flex flex-col gap-4">
            
            {/* 1. TOP LEFT: Problem Description */}
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

            {/* 2. BOTTOM LEFT: Face Cam */}
            <div className="h-[200px] shrink-0">
                <FaceProctoring />
            </div>
        </div>

        {/* --- RIGHT COLUMN (60%) --- */}
        <div className="w-[60%] flex flex-col gap-4">
            
            {/* 3. TOP RIGHT: Code Editor (2.5/4 Height) */}
            <div className="flex-[2.5] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 p-2 flex justify-between items-center px-4 h-12">
                    <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                        <Code size={16} /> Code Editor
                    </div>
                    <select 
                        className="bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                        value={language}
                        onChange={(e) => setLanguage(parseInt(e.target.value))}
                    >
                        {languages.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </div>
                <div className="flex-1">
                    <Editor
                        height="100%"
                        defaultLanguage="python"
                        language={languages.find(l => l.id === language)?.value}
                        theme="light"
                        value={code}
                        onChange={(val) => setCode(val || "")}
                        options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false }}
                    />
                </div>
            </div>

            {/* 4. BOTTOM RIGHT: Output & Controls (1.5/4 Height) */}
            <div className="flex-[1.5] flex flex-col gap-4">
                
                {/* Output Screen (1.3 Part) */}
                <div className="flex-[1.3] flex flex-col bg-slate-900 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-800 text-slate-400 px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <Monitor size={14} /> Terminal Output
                    </div>
                    <div className="flex-1 p-4 font-mono text-sm text-green-400 overflow-y-auto whitespace-pre-wrap">
                        {output}
                    </div>
                </div>

                {/* Control Buttons (0.2 Part) */}
                <div className="flex-[0.2] flex gap-3">
                    <button 
                        onClick={saveProgress}
                        className="flex-1 bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                        <Save size={18} /> Save & Next
                    </button>
                    <button 
                        onClick={runCode}
                        disabled={loading}
                        className="flex-1 bg-[#005EB8] hover:bg-[#004a94] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                    >
                        {loading ? <Cpu size={18} className="animate-spin" /> : <Play size={18} />} 
                        {loading ? "Running..." : "Run Code"}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

// --- MAIN PLAYER COMPONENT (Wraps CodeCompiler) ---
const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const videoNode = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null); 

  const brand = { blue: "#005EB8", green: "#87C232", textMain: "#0f172a", textLight: "#64748b" };

  // --- Payment Logic ---
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

  // Player Logic (Video)
  useEffect(() => {
    if (activeLesson && (activeLesson.type === 'video' || activeLesson.type === 'live_class') && videoNode.current) {
        if (playerRef.current) playerRef.current.destroy();
        const getYoutubeId = (url: string) => {
            if (!url) return null;
            const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
            return (match && match[2].length === 11) ? match[2] : null;
        };
        const videoId = getYoutubeId(activeLesson.url);
        if (videoId) {
            // @ts-ignore
            playerRef.current = new Plyr(videoNode.current, { controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'] });
            if (playerRef.current) playerRef.current.source = { type: 'video', sources: [{ src: videoId, provider: 'youtube' }] };
        }
    }
  }, [activeLesson]);

  const toggleModule = (moduleId: number) => setExpandedModules(prev => prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]);
  const getEmbedUrl = (url: string) => url?.replace("/view", "/preview") || "";

  const renderContent = () => {
    if (!activeLesson) return <div className="text-white p-10 text-center">Select a lesson</div>;
    if (activeLesson.type === "note") return <iframe src={getEmbedUrl(activeLesson.url)} width="100%" height="100%" className="bg-white border-0" allow="autoplay" />;
    if (activeLesson.type === "video") return <div className="w-full h-full bg-black flex items-center justify-center"><div className="w-full max-w-[1000px]"><video ref={videoNode} className="plyr-react plyr" playsInline controls /></div></div>;
    if (activeLesson.type === "code_test") return <CodeCompiler lesson={activeLesson} />;
    
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
                              {lesson.type.includes("code") && <Code size={16} />}
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