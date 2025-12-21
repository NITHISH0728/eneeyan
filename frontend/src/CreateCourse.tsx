import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Save, Image as ImageIcon, IndianRupee, ArrowLeft } from "lucide-react";

const CreateCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    image_url: ""
  });

  // 🎨 Brand Colors (Consistent with iQmath Dashboard)
  const brand = {
    blue: "#005EB8",
    border: "#e2e8f0",
    textLabel: "#475569",
    inputBg: "#ffffff",
    textMain: "#1e293b"
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      
      // ✅ FIX: Defining 'response' during the await call to avoid ReferenceError
      const response = await axios.post(
        "http://127.0.0.1:8000/api/v1/courses", 
        {
          title: formData.title,
          description: formData.description,
          price: parseInt(formData.price),
          image_url: formData.image_url
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // ✅ Redirecting straight to the Builder using the safe ID from response
      alert("Course Created Successfully! 🎉 Let's add some content.");
      const newCourseId = response.data.id;
      navigate(`/dashboard/course/${newCourseId}/builder`);
      
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 403) {
        alert("Access Denied: You must be logged in as an Instructor to create courses.");
      } else if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
      } else {
        alert("Failed to create course. Please ensure your backend is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", animation: "fadeIn 0.5s ease" }}>
      
      {/* 📄 Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h2 style={{ fontSize: "26px", fontWeight: "700", color: brand.textMain, marginBottom: "8px" }}>Create New Course</h2>
          <p style={{ color: "#64748b", margin: 0 }}>Set up your course details to begin building your curriculum.</p>
        </div>
        <button 
          onClick={() => navigate("/dashboard/courses")}
          style={{ background: "none", border: "none", color: brand.blue, fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
        >
          <ArrowLeft size={18} /> Back to Courses
        </button>
      </div>

      {/* 📝 The Form Card */}
      <div style={{ 
        background: "white", 
        padding: "40px", 
        borderRadius: "16px", 
        border: `1px solid ${brand.border}`, 
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" 
      }}>
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          
          {/* Title Input */}
          <div>
            <label style={labelStyle}>Course Title</label>
            <input 
              type="text" 
              placeholder="e.g. Advanced Java Masterclass"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              style={inputStyle}
            />
          </div>

          {/* Description Input */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea 
              rows={4}
              placeholder="Describe what your students will achieve..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Price & Image Row */}
          <div style={{ display: "flex", gap: "24px" }}>
            
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Price (INR)</label>
              <div style={{ position: "relative" }}>
                <IndianRupee size={16} style={iconOverlayStyle} />
                <input 
                  type="number" 
                  placeholder="999"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                  style={{ ...inputStyle, paddingLeft: "40px" }}
                />
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Thumbnail URL (Optional)</label>
              <div style={{ position: "relative" }}>
                <ImageIcon size={16} style={iconOverlayStyle} />
                <input 
                  type="text" 
                  placeholder="https://image-link.com/photo.jpg"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  style={{ ...inputStyle, paddingLeft: "40px" }}
                />
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", marginTop: "10px" }}>
            <button 
              type="button" 
              onClick={() => navigate("/dashboard/courses")}
              style={{ 
                padding: "12px 24px", borderRadius: "8px", border: "1px solid #e2e8f0", 
                background: "white", color: "#64748b", fontWeight: "600", cursor: "pointer" 
              }}
            >
              Cancel
            </button>
            
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                display: "flex", alignItems: "center", gap: "8px",
                padding: "12px 32px", borderRadius: "8px", border: "none", 
                background: brand.blue, color: "white", fontWeight: "600", 
                cursor: loading ? "wait" : "pointer",
                boxShadow: "0 4px 12px rgba(0, 94, 184, 0.2)"
              }}
            >
              {loading ? "Creating..." : "Create & Build Curriculum"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

// --- Styles ---
const labelStyle = {
  display: "block",
  marginBottom: "10px",
  fontWeight: "600",
  color: "#475569",
  fontSize: "14px"
};

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  fontSize: "15px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  outline: "none",
  color: "#1e293b",
  boxSizing: "border-box" as const,
  transition: "all 0.2s"
};

const iconOverlayStyle = {
  position: "absolute" as const,
  left: "14px",
  top: "16px",
  color: "#94a3b8"
};

export default CreateCourse;