import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

// @ts-ignore
import Plyr from "plyr"; 
import "plyr/dist/plyr.css"; 

import { 
  PlayCircle, FileText, ChevronLeft, Menu, Code, HelpCircle, 
  UploadCloud, Play, ChevronDown, ChevronRight, CreditCard // ✅ Added CreditCard Icon
} from "lucide-react";

// --- 🔥 FEATURE: CODE TEST COMPILER (Integrated) ---
const CodeCompiler = ({ lesson }: { lesson: any }) => {
  const [code, setCode] = useState(lesson.initial_code || "// Write your solution here...\nconsole.log('Hello iQmath!');");
  const [output, setOutput] = useState("Output will appear here...");
  const [loading, setLoading] = useState(false);

  const runCode = async () => {
    setLoading(true);
    setOutput("Compiling...");
    
    // Simulate execution
    setTimeout(() => {
      setOutput(`> Executing Script...\n\nHello iQmath!\n\nProcess finished with exit code 0`);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full p-5 bg-slate-100 gap-5">
      <div className="bg-white p-5 rounded-xl shadow-sm">
        <div className="flex justify-between mb-2">
             <h3 className="m-0 text-lg font-bold">{lesson.title}</h3>
             <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">MEDIUM</span>
        </div>
        <p className="text-slate-500 m-0">Write a program to solve the specific logic required for this test case.</p>
      </div>

      <div className="flex flex-1 gap-5">
        <div className="flex-1 flex flex-col">
          <div className="bg-slate-800 text-white p-3 rounded-t-xl text-xs font-bold flex justify-between">
            <span>CODE EDITOR (JS)</span>
            <span>main.js</span>
          </div>
          <textarea 
            value={code} 
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 bg-slate-900 text-sky-400 border-none p-5 font-mono resize-none outline-none rounded-b-xl text-sm leading-6"
          />
        </div>

        <div className="flex-1 flex flex-col gap-5">
           <div className="flex-1 flex flex-col">
              <div className="bg-slate-200 p-3 rounded-t-xl text-xs font-bold text-slate-600">CONSOLE OUTPUT</div>
              <div className="flex-1 bg-black text-green-400 p-5 font-mono rounded-b-xl whitespace-pre-wrap">
                {output}
              </div>
           </div>
           
           <div className="bg-white p-4 rounded-xl flex justify-end items-center">
              <button onClick={runCode} disabled={loading} className="flex items-center gap-2 px-8 py-3 bg-[#005EB8] text-white border-none rounded-lg font-bold cursor-pointer hover:opacity-90 disabled:opacity-70">
                <Play size={16} fill="white" /> {loading ? "Running..." : "Run Tests"}
              </button>
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
  
  // ✅ Keeps your existing Accordion Logic
  const [expandedModules, setExpandedModules] = useState<number[]>([]);

  // ✅ Refs for Native Player
  const videoNode = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null); // Using 'any' to bypass strict TS check for Plyr

  const brand = { blue: "#005EB8", green: "#87C232", textMain: "#0f172a", textLight: "#64748b" };

  // --- 💳 NEW FEATURE: RAZORPAY PAYMENT ---
  const handlePayment = async () => {
    try {
        // A. Create Order on Backend
        const orderUrl = "http://127.0.0.1:8000/api/v1/create-order";
        const { data } = await axios.post(orderUrl, { amount: 599 }); // Example price

        // B. Configuration for Razorpay Modal
        const options = {
            key: "rzp_test_Ru8lDcv8KvAiC0", // ⚠️ MUST MATCH BACKEND KEY
            amount: data.amount,
            currency: "INR",
            name: "iQmath Pro",
            description: "Lifetime Course Access",
            order_id: data.id, // This comes from your backend
            handler: async function (response: any) {
                alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
                // TODO: Call backend here to unlock the course for the student
            },
            prefill: {
                name: "Student Name",
                email: "student@example.com",
                contact: "9999999999"
            },
            theme: {
                color: "#87C232" // iQmath Green
            }
        };

        // C. Open Window
        const rzp1 = new (window as any).Razorpay(options);
        rzp1.open();

    } catch (error) {
        console.error("Payment Error:", error);
        alert("Payment initialization failed. Check console.");
    }
  };
  // ----------------------------------------

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://127.0.0.1:8000/api/v1/courses/${courseId}/player`, { headers: { Authorization: `Bearer ${token}` } });
        setCourse(res.data);
        
        // Auto-open first module logic
        if (res.data.modules?.[0]) {
            setExpandedModules([res.data.modules[0].id]); 
            if (res.data.modules[0].lessons?.length > 0) {
                setActiveLesson(res.data.modules[0].lessons[0]);
            }
        }
      } catch (err) { console.error(err); }
    };
    fetchCourse();
  }, [courseId]);

  // ✅ NATIVE PLYR INITIALIZATION (Fixed Null Errors)
  useEffect(() => {
    if (activeLesson && (activeLesson.type === 'video' || activeLesson.type === 'live_class') && videoNode.current) {
        
        // 1. Destroy old instance if it exists (using ?. to fix null error)
        if (playerRef.current) {
            playerRef.current.destroy();
        }

        // 2. Extract ID
        const getYoutubeId = (url: string) => {
            if (!url) return null;
            const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
            return (match && match[2].length === 11) ? match[2] : null;
        };
        const videoId = getYoutubeId(activeLesson.url);

        if (videoId) {
            // 3. Create new instance
            // @ts-ignore
            playerRef.current = new Plyr(videoNode.current, {
                controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
            });

            // 4. Set source (using ?. to fix null error)
            if (playerRef.current) {
                playerRef.current.source = {
                    type: 'video',
                    sources: [{ src: videoId, provider: 'youtube' }],
                };
            }
        }
    }
  }, [activeLesson]);

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]);
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("drive.google.com") && url.includes("/view")) return url.replace("/view", "/preview");
    return url;
  };

  const renderContent = () => {
    if (!activeLesson) return <div className="text-white p-10 text-center">Select a lesson</div>;

    // 1. NOTES
    if (activeLesson.type === "note") {
      return <iframe src={getEmbedUrl(activeLesson.url)} width="100%" height="100%" className="bg-white border-0" allow="autoplay" />;
    }

    // 2. VIDEO (Native Plyr)
    if (activeLesson.type === "video" || activeLesson.type === "live_class") {
      return (
        <div className="w-full h-full bg-black flex items-center justify-center">
           <div className="w-full max-w-[1000px] rounded-xl overflow-hidden shadow-2xl">
             <video ref={videoNode} className="plyr-react plyr" playsInline controls crossOrigin="anonymous" />
           </div>
        </div>
      );
    }

    // 3. QUIZ
    if (activeLesson.type === "quiz") {
      return (
        <div className="w-full h-full bg-slate-100 flex justify-center overflow-y-auto">
           <iframe src={activeLesson.url} width="800px" height="100%" className="bg-white shadow-lg border-0"></iframe>
        </div>
      );
    }

    // 4. CODE TEST
    if (activeLesson.type === "code_test" || activeLesson.type === "live_test") {
      return <CodeCompiler lesson={activeLesson} />;
    }

    // 5. ASSIGNMENT
    if (activeLesson.type === "assignment") {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-slate-50">
           <div className="bg-white p-12 rounded-2xl text-center shadow-lg max-w-lg border border-slate-200">
              <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
                <UploadCloud size={40} color={brand.blue} />
              </div>
              <h2 className="mb-2 text-slate-900">Submit Assignment</h2>
              <p className="text-slate-500 mb-8">Upload your work to Google Drive and paste the shareable link below.</p>
              <input type="text" placeholder="https://drive.google.com/file/..." className="w-full p-3.5 rounded-lg border border-slate-200 mb-5 outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => alert("✅ Assignment Submitted!")} className="w-full p-3.5 bg-[#005EB8] text-white rounded-lg font-bold hover:bg-blue-700 transition-all">Submit Work</button>
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
            {/* 💳 ADDED: Buy Access Button */}
            <button onClick={handlePayment} className="flex items-center gap-2 bg-[#87C232] text-white px-4 py-2 rounded-lg font-bold border-none cursor-pointer hover:bg-[#76a82b] transition-colors">
                <CreditCard size={18} /> Buy Lifetime Access
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="bg-none border-none cursor-pointer"><Menu color={brand.textMain} /></button>
          </div>
        </header>

        <div className="flex-1 bg-white relative overflow-hidden">
          {renderContent()}
        </div>
      </div>

      {sidebarOpen && (
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col h-full">
           <div className="p-6 border-b border-slate-200">
             <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest m-0">Course Content</h2>
           </div>
           <div className="flex-1 overflow-y-auto p-0">
             {course?.modules.map((module: any, idx: number) => (
                <div key={module.id} className="border-b border-slate-100">
                  <div 
                    onClick={() => toggleModule(module.id)}
                    className="p-4 bg-slate-50 cursor-pointer flex justify-between items-center hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase">Section {idx + 1}</div>
                      <div className="text-sm font-semibold text-slate-800">{module.title}</div>
                    </div>
                    {expandedModules.includes(module.id) ? <ChevronDown size={18} color="#64748b" /> : <ChevronRight size={18} color="#64748b" />}
                  </div>

                  {expandedModules.includes(module.id) && (
                    <div className="animate-fade-in">
                      {module.lessons.map((lesson: any) => {
                        const isActive = activeLesson?.id === lesson.id;
                        return (
                          <div 
                            key={lesson.id} 
                            onClick={() => setActiveLesson(lesson)}
                            className={`flex items-center gap-3 p-3 pl-6 cursor-pointer border-l-4 transition-all ${isActive ? 'bg-blue-50 border-blue-600' : 'bg-white border-transparent hover:bg-slate-50'}`}
                          >
                            <div className={isActive ? "text-blue-600" : "text-slate-400"}>
                              {(lesson.type.includes("video") || lesson.type.includes("class")) && <PlayCircle size={16} />}
                              {lesson.type === "note" && <FileText size={16} />}
                              {lesson.type === "quiz" && <HelpCircle size={16} />}
                              {lesson.type.includes("code") && <Code size={16} />}
                              {lesson.type === "assignment" && <UploadCloud size={16} />}
                            </div>
                            <div className={`text-sm flex-1 ${isActive ? "text-blue-600 font-semibold" : "text-slate-600"}`}>
                              {lesson.title}
                            </div>
                          </div>
                        );
                      })}
                      {module.lessons.length === 0 && <div className="p-4 text-xs text-slate-400 italic">No lessons in this module</div>}
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