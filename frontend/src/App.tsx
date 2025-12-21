import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { FileText, Edit, PlusCircle, BookOpen } from "lucide-react";

// --- ⚙️ IMPORT COMPONENTS ---
import AdminLogin from "./AdminLogin";
import Login from "./Login";
import DashboardLayout from "./DashboardLayout";
import CreateCourse from "./CreateCourse";
import CourseBuilder from "./CourseBuilder";
import AssignmentManager from "./AssignmentManager";
import StudentDashboard from "./StudentDashboard"; 
import CoursePlayer from "./CoursePlayer"; 
import AddAdmits from "./AddAdmits"; 
import CoursePreview from "./CoursePreview";
import CodeArena from "./CodeArena"; // 👈 ✅ IMPORTED CODE ARENA

// --- 📚 COMPONENT: Instructor Course List (With Safety Catch) ---
const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setLoading(false);
        return; 
      }

      try {
        const res = await axios.get("http://127.0.0.1:8000/api/v1/courses", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourses(res.data);
      } catch (err: any) {
        console.error("Failed to fetch courses", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          window.location.href = "/"; 
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Checking authorization...</div>;

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", margin: 0 }}>My Courses</h2>
          <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Manage your curriculum and track publishing status.</p>
        </div>
        <button 
          onClick={() => navigate("/dashboard/create-course")}
          style={{ 
            display: "flex", alignItems: "center", gap: "8px", background: "#005EB8", 
            color: "white", padding: "12px 20px", borderRadius: "10px", border: "none", 
            fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 12px rgba(0, 94, 184, 0.2)" 
          }}
        >
          <PlusCircle size={18} /> Create New Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <BookOpen size={48} color="#cbd5e1" style={{ marginBottom: "16px" }} />
          <h3 style={{ color: "#1e293b", margin: "0 0 8px 0" }}>No courses found</h3>
          <p style={{ color: "#64748b", marginBottom: "24px" }}>Only courses created by you will appear here.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
          {courses.map((course: any) => (
            <div key={course.id} style={{ 
              background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", 
              overflow: "hidden", transition: "transform 0.2s, boxShadow 0.2s" 
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 20px -5px rgba(0,0,0,0.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
            >
              <div style={{ height: "160px", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                {course.image_url ? (
                  <img src={course.image_url} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <FileText size={48} color="#cbd5e1" />
                )}
                {course.is_published && (
                  <div style={{ position: "absolute", top: "12px", right: "12px", background: "#87C232", color: "white", fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px" }}>
                    PUBLISHED
                  </div>
                )}
              </div>
              <div style={{ padding: "20px" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "17px", fontWeight: "700", color: "#1e293b" }}>{course.title}</h4>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#005EB8", fontWeight: "700", fontSize: "18px" }}>₹{course.price}</span>
                  <button 
                    onClick={() => navigate(`/dashboard/course/${course.id}/builder`)}
                    style={{ 
                      display: "flex", alignItems: "center", gap: "6px", background: "#f1f5f9", 
                      color: "#475569", border: "none", padding: "8px 14px", borderRadius: "8px", 
                      fontWeight: "600", cursor: "pointer", transition: "background 0.2s" 
                    }}
                  >
                    <Edit size={14} /> Edit Curriculum
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- 🚦 MAIN APP STRUCTURE ---
function App() {
  return (
    <Router>
      <Routes>
        {/* ROOT: Traffic Cop */}
        <Route path="/" element={<AuthRedirect />} />
        <Route path="/" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* INSTRUCTOR AREA */}
        <Route path="/dashboard" element={<ProtectedRoute requiredRole="instructor"><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard/courses" />} />
          <Route path="courses" element={<CourseList />} />
          <Route path="create-course" element={<CreateCourse />} />
          <Route path="course/:courseId/builder" element={<CourseBuilder />} />
          <Route path="assignments" element={<AssignmentManager />} />
          <Route path="add-admits" element={<AddAdmits />} />
          <Route path="course/:courseId/preview" element={<CoursePreview />} />
          
          {/* ✅ ADDED THIS ROUTE FOR CODE ARENA */}
          <Route path="code-arena" element={<CodeArena />} />
        </Route>
        
        {/* STUDENT AREA */}
        <Route path="/student-dashboard" element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>} />

        {/* COURSE PLAYER */}
        <Route path="/course/:courseId/player" element={<ProtectedRoute requiredRole="student"><CoursePlayer /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

// --- 🚦 HELPER: AUTH REDIRECT ---
const AuthRedirect = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (token) {
    if (role === "student") return <Navigate to="/student-dashboard" replace />;
    if (role === "instructor") return <Navigate to="/dashboard" replace />;
  }
  return <Login />;
};

// --- 🛡️ HELPER: PROTECTED ROUTE ---
const ProtectedRoute = ({ children, requiredRole }: { children: any, requiredRole?: string }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/" replace />;
  
  if (requiredRole && role !== requiredRole) {
    return role === "instructor" ? <Navigate to="/dashboard" /> : <Navigate to="/student-dashboard" />;
  }
  
  return children;
};

export default App;