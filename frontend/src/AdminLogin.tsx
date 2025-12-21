import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Lock, Mail, ArrowRight, CheckCircle, 
  GraduationCap, AlertCircle, X, ShieldCheck
} from "lucide-react";

// Define the shape of our Toast state
interface ToastState {
  show: boolean;
  message: string;
  type: "success" | "error";
}

const AdminLogin = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  // No isSignUp state needed anymore
  const role = "instructor"; 
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: "", type: "success" });

  // Form Data
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  // --- THEME: Mixed Gradient Blue-Green ---
  const gradientText = "bg-clip-text text-transparent bg-gradient-to-r from-[#005EB8] to-[#87C232]";
  const gradientBg = "bg-gradient-to-r from-[#005EB8] to-[#87C232]";
  const borderFocus = "focus-within:ring-2 focus-within:ring-[#005EB8] focus-within:border-transparent";

  // --- HELPERS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  // --- AUTH LOGIC ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        // LOGIN LOGIC ONLY
        const loginParams = new URLSearchParams();
        loginParams.append("username", formData.email);
        loginParams.append("password", formData.password);
        
        const res = await axios.post("http://127.0.0.1:8000/api/v1/login", loginParams);
        
        // Verify role matches this portal
        if (res.data.role !== "instructor") {
            triggerToast("Access Denied. This portal is for Instructors only.", "error");
            setLoading(false);
            return;
        }

        localStorage.setItem("token", res.data.access_token);
        localStorage.setItem("role", res.data.role);
        
        triggerToast("Welcome back, Instructor!", "success");
        
        setTimeout(() => {
            navigate("/dashboard");
        }, 1000);

    } catch (err: any) {
        if (err.response && err.response.status === 401) {
            triggerToast("Invalid Email or Password.", "error");
        } else {
            triggerToast("Authentication failed. Check connection.", "error");
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 font-sans p-4 overflow-hidden relative">
      
      {/* 🚀 BACK TO LEARNER BUTTON (Top Right) */}
      <button 
        onClick={() => navigate("/")}
        className="absolute top-6 right-6 flex items-center gap-2 px-5 py-2.5 bg-white rounded-full shadow-md text-slate-600 hover:text-[#005EB8] hover:shadow-lg transition-all z-50 font-bold text-sm border border-slate-100"
      >
        <GraduationCap size={18} /> Learner Portal
      </button>

      {/* BACKGROUND DECORATION */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#005EB8]/10 blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#87C232]/10 blur-[100px]"></div>

      {/* MAIN LOGIN CARD */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[450px] p-10 border border-slate-100 z-10">
        
        <div className="flex flex-col items-center text-center">
            
            {/* Header / Logo Area */}
            <div className="mb-2 flex items-center justify-center p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                <ShieldCheck size={32} className="text-[#005EB8]" />
            </div>
            
            <h1 className="text-3xl font-extrabold text-slate-800 mt-4 mb-2">Instructor Access</h1>
            <p className="text-slate-500 text-sm mb-8 px-4">
               Secure login for faculty and administration. <br/> Manage your courses and students efficiently.
            </p>

            <form onSubmit={handleAuth} className="w-full space-y-5">
                
                {/* Inputs */}
                <div className={`flex items-center bg-slate-50 rounded-xl px-4 py-3.5 border border-slate-200 transition-all ${borderFocus}`}>
                    <Mail className="text-slate-400 mr-3" size={20} />
                    <input 
                        type="email" name="email" placeholder="Instructor Email" required
                        className="bg-transparent outline-none w-full text-sm font-medium text-slate-700 placeholder-slate-400"
                        onChange={handleInputChange}
                    />
                </div>

                <div className={`flex items-center bg-slate-50 rounded-xl px-4 py-3.5 border border-slate-200 transition-all ${borderFocus}`}>
                    <Lock className="text-slate-400 mr-3" size={20} />
                    <input 
                        type="password" name="password" placeholder="Password" required
                        className="bg-transparent outline-none w-full text-sm font-medium text-slate-700 placeholder-slate-400"
                        onChange={handleInputChange}
                    />
                </div>

                {/* Submit Button with Gradient */}
                <button 
                    type="submit" 
                    disabled={loading} 
                    className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-4 ${gradientBg} hover:opacity-90`}
                >
                    {loading ? "Verifying..." : "Access Dashboard"} <ArrowRight size={18} />
                </button>

            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 w-full">
                <p className="text-xs text-slate-400 font-medium">
                    Need an account? Contact the <span className={`font-bold cursor-pointer hover:underline ${gradientText}`}>University IT Admin</span>.
                </p>
            </div>

        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed top-5 right-5 z-50 bg-white px-6 py-4 rounded-xl shadow-2xl border-l-4 border-l-current flex items-center gap-3 animate-fade-in" style={{ borderColor: toast.type === "success" ? "#87C232" : "#ef4444" }}>
           {toast.type === "success" ? <CheckCircle className="text-[#87C232]" size={24} /> : <AlertCircle className="text-red-500" size={24} />}
           <div>
             <h4 className="font-bold text-slate-800 text-sm">{toast.type === "success" ? "Success" : "Error"}</h4>
             <p className="text-slate-500 text-xs">{toast.message}</p>
           </div>
           <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;