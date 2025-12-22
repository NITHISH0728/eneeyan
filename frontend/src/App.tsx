import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { FileText, Edit, PlusCircle, BookOpen, Trash2 } from "lucide-react"; // ✅ Added Trash2

import AdminLogin from "./AdminLogin";
import Login from "./Login";
import LandingPage from "./LandingPage"; 
import DashboardLayout from "./DashboardLayout";
import CreateCourse from "./CreateCourse";
import CourseBuilder from "./CourseBuilder";
import AssignmentManager from "./AssignmentManager";
import StudentDashboard from "./StudentDashboard"; 
import CoursePlayer from "./CoursePlayer"; 
import AddAdmits from "./AddAdmits"; 
import CoursePreview from "./CoursePreview";
import CodeArena from "./CodeArena"; 
import Dashboard from "./Dashboard"; 
import InstructorSettings from "./InstructorSettings"; 
import StudentManagement from "./StudentManagement";

// --- Modified CourseList Component ---
const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      const token = localStorage.getItem("token");
      if (!token) { setLoading(false); return; }
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/v1/courses", { headers: { Authorization: `Bearer ${token}` } });
        setCourses(res.data);
      } catch (err: any) {
        if (err.response?.status === 401) { localStorage.removeItem("token"); window.location.href = "/"; }
      } finally { setLoading(false); }
    };
    fetchCourses();
  }, []);

  // ✅ NEW: Handle Delete Course
  const handleDeleteCourse = async (e: React.MouseEvent, courseId: number) => {
    e.stopPropagation(); // Prevents opening the course when clicking delete
    if (!confirm("Are you sure you want to delete this course? This cannot be undone.")) return;

    try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://127.0.0.1:8000/api/v1/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Remove from UI immediately
        setCourses(courses.filter((c: any) => c.id !== courseId));
    } catch (err) {
        alert("Failed to delete course. Ensure no students are enrolled or backend endpoint is active.");
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>;
  
  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", margin: 0 }}>My Courses</h2>
            <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Manage your curriculum.</p>
        </div>
        <button onClick={() => navigate("/dashboard/create-course")} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#005EB8", color: "white", padding: "12px 20px", borderRadius: "10px", border: "none", fontWeight: "600", cursor: "pointer" }}><PlusCircle size={18} /> Create New Course</button>
      </div>
      
      {courses.length === 0 ? ( 
        <div style={{ textAlign: "center", padding: "80px", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <BookOpen size={48} color="#cbd5e1" style={{ marginBottom: "16px" }} />
            <h3 style={{ color: "#1e293b", margin: "0 0 8px 0" }}>No courses found</h3>
        </div> 
      ) : ( 
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
            {courses.map((course: any) => (
                <div key={course.id} style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", cursor: "pointer", transition: "transform 0.2s", position: "relative" }} onClick={() => navigate(`/dashboard/course/${course.id}/builder`)}>
                    <div style={{ height: "160px", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {course.image_url ? <img src={course.image_url} alt={course.title} style={{width:"100%", height:"100%", objectFit:"cover"}} /> : <FileText size={48} color="#cbd5e1" />}
                    </div>
                    
                    {/* ✅ UPDATED: Flex container for Title + Delete Button */}
                    <div style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h4 style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>{course.title}</h4>
                        
                        {/* ✅ Delete Button */}
                        <button 
                            onClick={(e) => handleDeleteCourse(e, course.id)}
                            style={{ 
                                background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", 
                                padding: "8px", cursor: "pointer", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center"
                            }}
                            title="Delete Course"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div> 
      )}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        <Route path="/dashboard" element={<ProtectedRoute requiredRole="instructor"><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} /> 
          <Route path="courses" element={<CourseList />} />
          <Route path="create-course" element={<CreateCourse />} />
          <Route path="course/:courseId/builder" element={<CourseBuilder />} />
          <Route path="assignments" element={<AssignmentManager />} />
          <Route path="add-admits" element={<AddAdmits />} />
          <Route path="course/:courseId/preview" element={<CoursePreview />} />
          <Route path="code-arena" element={<CodeArena />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="settings" element={<InstructorSettings />} />
        </Route>
        
        <Route path="/student-dashboard" element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/course/:courseId/player" element={<ProtectedRoute requiredRole="student"><CoursePlayer /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

const ProtectedRoute = ({ children, requiredRole }: { children: any, requiredRole?: string }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (!token) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole) { return role === "instructor" ? <Navigate to="/dashboard" /> : <Navigate to="/student-dashboard" />; }
  return children;
};

export default App;