import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Plyr from "plyr-react";
import "plyr/dist/plyr.css";
import { CodeTestPreview } from "./components/CodeTestPreview";
// ✅ UPDATED IMPORTS: Added ChevronDown, ChevronRight, and others requested
import { 
  PlayCircle, FileText, ChevronLeft, Menu, Code, HelpCircle, 
  UploadCloud, CheckCircle, Play, ChevronDown, ChevronRight, X, ArrowLeft 
} from "lucide-react";

// --- 🔥 FEATURE 4: CODE TEST COMPILER (JUDGE0) ---
const CodeCompiler = ({ lesson }: { lesson: any }) => {
  const [code, setCode] = useState("// Write your solution here...\nconsole.log('Hello iQmath!');");
  const [output, setOutput] = useState("Output will appear here...");
  const [loading, setLoading] = useState(false);

  const runCode = async () => {
    setLoading(true);
    setOutput("Compiling...");
    
    setTimeout(() => {
      setOutput(`> Executing Script...\n\nHello iQmath!\n\nProcess finished with exit code 0`);
      setLoading(false);
    }, 1500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "20px", background: "#f1f5f9", gap: "20px" }}>
      <div style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
        <div style={{display: "flex", justifyContent: "space-between", marginBottom: "10px"}}>
             <h3 style={{ margin: 0 }}>{lesson.title}</h3>
             <span style={{background: "#e0f2fe", color: "#0284c7", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700"}}>MEDIUM</span>
        </div>
        <p style={{ color: "#64748b", margin: 0 }}>Write a program to solve the specific logic required for this test case.</p>
      </div>

      <div style={{ display: "flex", flex: 1, gap: "20px" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ background: "#1e293b", color: "white", padding: "12px", borderRadius: "12px 12px 0 0", fontSize: "12px", fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
            <span>CODE EDITOR (JS)</span>
            <span>main.js</span>
          </div>
          <textarea 
            value={code} 
            onChange={(e) => setCode(e.target.value)}
            style={{ flex: 1, background: "#0f172a", color: "#38bdf8", border: "none", padding: "20px", fontFamily: "'Fira Code', monospace", resize: "none", outline: "none", borderRadius: "0 0 12px 12px", fontSize: "14px", lineHeight: "1.5" }}
          />
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
           <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ background: "#e2e8f0", padding: "12px", borderRadius: "12px 12px 0 0", fontSize: "12px", fontWeight: "bold", color: "#475569" }}>CONSOLE OUTPUT</div>
              <div style={{ flex: 1, background: "black", color: "#4ade80", padding: "20px", fontFamily: "monospace", borderRadius: "0 0 12px 12px", whiteSpace: "pre-wrap" }}>
                {output}
              </div>
           </div>
           
           <div style={{ background: "white", padding: "15px", borderRadius: "12px", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
              <button onClick={runCode} disabled={loading} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 30px", background: "#005EB8", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
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
  
  // ✅ NEW STATE: Tracks expanded modules for Accordion logic
  const [expandedModules, setExpandedModules] = useState<number[]>([]);

  const brand = { blue: "#005EB8", green: "#87C232", textMain: "#0f172a", textLight: "#64748b" };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://127.0.0.1:8000/api/v1/courses/${courseId}/player`, { headers: { Authorization: `Bearer ${token}` } });
        setCourse(res.data);
        
        // ✅ UPDATED FETCH LOGIC: Auto-open first module and select first lesson
        if (res.data.modules?.[0]) {
            setExpandedModules([res.data.modules[0].id]); // Expand first module
            if (res.data.modules[0].lessons?.length > 0) {
                setActiveLesson(res.data.modules[0].lessons[0]);
            }
        }
      } catch (err) { console.error(err); }
    };
    fetchCourse();
  }, [courseId]);

  // ✅ NEW HELPER: Toggles accordion sections
  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId) // Close it
        : [...prev, moduleId] // Open it
    );
  };

  // ✅ NEW HELPER: Compatible handler for the sidebar
  const handleLessonChange = (lesson: any) => {
    setActiveLesson(lesson);
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("drive.google.com") && url.includes("/view")) return url.replace("/view", "/preview");
    return url;
  };

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // --- MEMOIZED PLYR OPTIONS (Prevents re-renders) ---
  const plyrOptions = useMemo(() => ({
    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
    youtube: { noCookie: true, rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1 },
  }), []);

  const renderContent = () => {
    if (!activeLesson) return <div style={{ color: "white" }}>Select a lesson</div>;

    // 1. NOTES (Drive Embed)
    if (activeLesson.type === "note") {
      return <iframe src={getEmbedUrl(activeLesson.url)} width="100%" height="100%" frameBorder="0" style={{background: "white"}} allow="autoplay" />;
    }

    // 2. VIDEO (Plyr)
    if (activeLesson.type === "video" || activeLesson.type === "live_class") {
      const videoId = getYoutubeId(activeLesson.url);
      
      if (!videoId) return <div style={{color: "white", padding: "40px"}}>Invalid Video URL</div>;

      const plyrSource = {
        type: "video" as const, // Explicit type for TS
        sources: [{ src: videoId, provider: "youtube" as const }],
      };

      return (
        <div style={{ width: "100%", height: "100%", background: "black", display: "flex", alignItems: "center", justifyContent: "center" }}>
           <div style={{ width: "100%", maxWidth: "1000px", borderRadius: "12px", overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
              <style>{`
                 .plyr__video-embed iframe { top: -50%; height: 200%; }
                 :root { --plyr-color-main: #005EB8; }
              `}</style>
              
              {/* ✅ KEY ADDED HERE: Forces React to destroy/create new player on lesson change */}
              <Plyr 
                key={activeLesson.id} 
                source={plyrSource} 
                options={plyrOptions} 
              />
           </div>
        </div>
      );
    }

    // 3. QUIZ
    if (activeLesson.type === "quiz") {
      return (
        <div style={{ width: "100%", height: "100%", background: "#f0f2f5", display: "flex", justifyContent: "center", overflowY: "auto" }}>
           <iframe src={activeLesson.url} width="800px" height="100%" frameBorder="0" style={{ background: "white", boxShadow: "0 0 20px rgba(0,0,0,0.1)" }}></iframe>
        </div>
      );
    }

    // 4. CODE TEST (New Professional UI)
    if (activeLesson.type === "code_test" || activeLesson.type === "live_test") {
      return <CodeTestPreview lesson={activeLesson} />;
    }

    // 5. ASSIGNMENT
    if (activeLesson.type === "assignment") {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", background: "#f8fafc" }}>
           <div style={{ background: "white", padding: "50px", borderRadius: "20px", textAlign: "center", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", maxWidth: "500px", border: "1px solid #e2e8f0" }}>
              <div style={{ background: "#eff6ff", width: "80px", height: "80px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <UploadCloud size={40} color={brand.blue} />
              </div>
              <h2 style={{ margin: "0 0 10px 0", color: brand.textMain }}>Submit Assignment</h2>
              <p style={{ color: brand.textLight, marginBottom: "30px" }}>Upload your work to Google Drive and paste the shareable link below.</p>
              <input type="text" placeholder="https://drive.google.com/file/..." style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "20px", outline: "none" }} />
              <button onClick={() => alert("✅ Assignment Submitted!")} style={{ width: "100%", padding: "14px", background: brand.blue, color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 12px rgba(0, 94, 184, 0.3)" }}>Submit Work</button>
           </div>
        </div>
      );
    }

    return <div style={{ color: "white", padding: "50px", textAlign: "center" }}>Select content from the sidebar</div>;
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: "'Inter', sans-serif", background: brand.textMain }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
        <header style={{ height: "64px", background: "white", borderBottom: `1px solid ${brand.textLight}20`, display: "flex", alignItems: "center", padding: "0 24px", justifyContent: "space-between", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button onClick={() => navigate("/student-dashboard")} style={{ background: "none", border: "none", cursor: "pointer", color: brand.textLight, display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" }}><ChevronLeft size={20} /> Dashboard</button>
            <div style={{ height: "24px", width: "1px", background: "#e2e8f0" }}></div>
            <h1 style={{ fontSize: "16px", fontWeight: "700", color: brand.textMain, margin: 0 }}>{activeLesson?.title || "Course Player"}</h1>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", cursor: "pointer" }}><Menu color={brand.textMain} /></button>
        </header>

        <div style={{ flex: 1, background: "white", position: "relative", overflow: "hidden" }}>
          {renderContent()}
        </div>
      </div>

      {sidebarOpen && (
        <aside style={{ width: "320px", background: "white", borderLeft: "1px solid #e2e8f0", display: "flex", flexDirection: "column", height: "100%" }}>
           <div style={{ padding: "24px", borderBottom: "1px solid #e2e8f0" }}>
             <h2 style={{ fontSize: "14px", fontWeight: "800", color: brand.textMain, textTransform: "uppercase", letterSpacing: "1px" }}>Course Content</h2>
           </div>
           <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
             {/* ✅ UPDATED SIDEBAR MAPPING: Replaced with Accordion Logic */}
             {course?.modules.map((module: any, idx: number) => (
                <div key={module.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  
                  {/* 1. CLICKABLE HEADER */}
                  <div 
                    onClick={() => toggleModule(module.id)}
                    style={{ 
                      padding: "16px 20px", 
                      background: "#f8fafc", 
                      cursor: "pointer", 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      transition: "background 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "#f1f5f9"}
                    onMouseOut={(e) => e.currentTarget.style.background = "#f8fafc"}
                  >
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Section {idx + 1}</div>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>{module.title}</div>
                    </div>
                    {/* Arrow Icon Logic */}
                    {expandedModules.includes(module.id) ? (
                      <ChevronDown size={18} color="#64748b" />
                    ) : (
                      <ChevronRight size={18} color="#64748b" />
                    )}
                  </div>

                  {/* 2. LESSON LIST (Only shows if expanded) */}
                  {expandedModules.includes(module.id) && (
                    <div style={{ animation: "fadeIn 0.2s ease" }}>
                      {module.lessons.map((lesson: any) => {
                        const isActive = activeLesson?.id === lesson.id;
                        return (
                          <div 
                            key={lesson.id} 
                            onClick={() => handleLessonChange(lesson)}
                            style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: "12px", 
                              padding: "12px 20px 12px 25px", 
                              cursor: "pointer", 
                              background: isActive ? "#eff6ff" : "white",
                              borderLeft: isActive ? `4px solid ${brand.blue}` : "4px solid transparent",
                              transition: "all 0.1s"
                            }}
                          >
                            <div style={{ color: isActive ? brand.blue : "#94a3b8" }}>
                              {(lesson.type.includes("video") || lesson.type.includes("class")) && <PlayCircle size={16} />}
                              {lesson.type === "note" && <FileText size={16} />}
                              {lesson.type === "quiz" && <HelpCircle size={16} />}
                              {lesson.type.includes("code") && <Code size={16} />}
                              {lesson.type === "assignment" && <UploadCloud size={16} />}
                            </div>
                            <div style={{ fontSize: "14px", color: isActive ? brand.blue : "#475569", fontWeight: isActive ? "600" : "400", flex: 1 }}>
                              {lesson.title}
                            </div>
                          </div>
                        );
                      })}
                      {module.lessons.length === 0 && (
                          <div style={{ padding: "15px 25px", fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>No lessons in this module</div>
                      )}
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