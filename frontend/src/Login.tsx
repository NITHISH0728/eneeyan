import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  User, Lock, Mail, ArrowRight, CheckCircle, 
  GraduationCap, AlertCircle, X, ShieldCheck, 
  Eye, EyeOff, Facebook, Github, Linkedin // ✅ Imported Social Icons
} from "lucide-react";

// Google Icon Component (Since it's not in Lucide)
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

interface ToastState {
  show: boolean;
  message: string;
  type: "success" | "error";
}

const Login = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false); 
  const role = "student"; 
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: "", type: "success" });
  
  // Password Visibility
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({ email: "", password: "", name: "" });

  const activeBg = isSignUp ? "bg-[#87C232]" : "bg-[#005EB8]";
  const activeText = isSignUp ? "text-[#87C232]" : "text-[#005EB8]";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        if (!isSignUp) {
            const loginParams = new URLSearchParams();
            loginParams.append("username", formData.email);
            loginParams.append("password", formData.password);
            
            const res = await axios.post("http://127.0.0.1:8000/api/v1/login", loginParams);
            
            if (res.data.role !== "student") {
                triggerToast("Please use the Admin Portal for Instructor access.", "error");
                setLoading(false); return;
            }
            localStorage.setItem("token", res.data.access_token);
            localStorage.setItem("role", res.data.role);
            triggerToast("Login Successful! Redirecting...", "success");
            setTimeout(() => navigate("/student-dashboard"), 1000);
        } else {
            await axios.post("http://127.0.0.1:8000/api/v1/users", {
                email: formData.email, password: formData.password, name: formData.name, role: role,
            });
            triggerToast("Account created! Please Sign In.", "success");
            setIsSignUp(false);
        }
    } catch (err: any) {
        triggerToast("Authentication failed. Check credentials.", "error");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 font-sans p-4 overflow-hidden relative">
      <button onClick={() => navigate("/admin-login")} className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md text-slate-600 hover:text-[#005EB8] hover:shadow-lg transition-all z-50 font-bold text-sm">
        <ShieldCheck size={18} /> Admin Access
      </button>

      <div className="relative bg-white rounded-[20px] shadow-2xl overflow-hidden w-full max-w-[1000px] min-h-[600px] flex">
        
        {/* SIGN IN FORM */}
        <div className={`absolute top-0 h-full transition-all duration-700 ease-in-out left-0 w-1/2 z-20 ${isSignUp ? 'translate-x-full opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <form onSubmit={handleAuth} className="bg-white flex flex-col items-center justify-center h-full px-12 text-center">
            <div className="mb-4"><h1 className={`text-3xl font-extrabold ${activeText} tracking-tight`}>iQmath</h1></div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Learner Login</h1>
            <p className="text-slate-400 text-sm mb-6">Enter your details to access your courses</p>

            {/* ✅ SOCIAL LOGIN BUTTONS */}
            <div className="flex gap-4 mb-6 w-full justify-center">
                <button type="button" className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"><GoogleIcon /></button>
                <button type="button" className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm text-[#1877F2]"><Facebook size={20} fill="currentColor" strokeWidth={0} /></button>
                <button type="button" className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm text-slate-800"><Github size={20} /></button>
                <button type="button" className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm text-[#0A66C2]"><Linkedin size={20} fill="currentColor" strokeWidth={0} /></button>
            </div>

            <div className="flex items-center w-full mb-6">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="px-3 text-xs text-slate-400 font-medium">OR USE EMAIL</span>
                <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            {/* INPUTS */}
            <div className="w-full max-w-[350px] space-y-4">
                <div className="flex items-center bg-slate-50 rounded-lg px-4 py-3 border border-slate-200 focus-within:ring-2 focus-within:ring-[#005EB8] focus-within:ring-opacity-50 transition-all">
                    <Mail className="text-slate-400 mr-3 shrink-0" size={20} />
                    <input type="email" name="email" placeholder="Email Address" required className="bg-transparent outline-none flex-1 text-sm font-medium text-slate-700 placeholder-slate-400" onChange={handleInputChange} />
                </div>
                
                <div className="flex items-center bg-slate-50 rounded-lg px-4 py-3 border border-slate-200 focus-within:ring-2 focus-within:ring-[#005EB8] focus-within:ring-opacity-50 transition-all">
                    <Lock className="text-slate-400 mr-3 shrink-0" size={20} />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        name="password" 
                        placeholder="Password" 
                        required 
                        className="bg-transparent outline-none flex-1 text-sm font-medium text-slate-700 placeholder-slate-400" 
                        onChange={handleInputChange} 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 focus:outline-none ml-2 shrink-0">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>

            <p className="mt-4 text-xs text-slate-400 font-medium cursor-pointer hover:underline self-end mr-8">Forgot Password?</p>
            <button type="submit" disabled={loading} className={`mt-6 w-full max-w-[350px] py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${activeBg} hover:opacity-90`}>{loading ? "Signing In..." : "Sign In"} <ArrowRight size={18} /></button>
          </form>
        </div>

        {/* SIGN UP FORM */}
        <div className={`absolute top-0 h-full transition-all duration-700 ease-in-out left-0 w-1/2 z-10 ${isSignUp ? 'translate-x-full opacity-100 z-30' : 'opacity-0 pointer-events-none'}`}>
          <form onSubmit={handleAuth} className="bg-white flex flex-col items-center justify-center h-full px-12 text-center">
            <h1 className={`text-3xl font-bold mb-2 ${activeText}`}>Create Account</h1>
            <p className="text-slate-400 text-sm mb-6">Join iQmath as a new student</p>

            {/* ✅ SOCIAL LOGIN BUTTONS (For Sign Up too) */}
            <div className="flex gap-4 mb-6 w-full justify-center">
                <button type="button" className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"><GoogleIcon /></button>
                <button type="button" className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm text-[#1877F2]"><Facebook size={20} fill="currentColor" strokeWidth={0} /></button>
                <button type="button" className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm text-slate-800"><Github size={20} /></button>
                <button type="button" className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm text-[#0A66C2]"><Linkedin size={20} fill="currentColor" strokeWidth={0} /></button>
            </div>

            <div className="flex items-center w-full mb-6">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="px-3 text-xs text-slate-400 font-medium">OR USE EMAIL</span>
                <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            <div className="w-full max-w-[350px] space-y-4">
                <div className="flex items-center bg-slate-50 rounded-lg px-4 py-3 border border-slate-200 focus-within:ring-2 focus-within:ring-[#87C232]">
                    <User className="text-slate-400 mr-3 shrink-0" size={20} />
                    <input type="text" name="name" placeholder="Full Name" required className="bg-transparent outline-none flex-1 text-sm font-medium text-slate-700 placeholder-slate-400" onChange={handleInputChange} />
                </div>
                <div className="flex items-center bg-slate-50 rounded-lg px-4 py-3 border border-slate-200 focus-within:ring-2 focus-within:ring-[#87C232]">
                    <Mail className="text-slate-400 mr-3 shrink-0" size={20} />
                    <input type="email" name="email" placeholder="Email Address" required className="bg-transparent outline-none flex-1 text-sm font-medium text-slate-700 placeholder-slate-400" onChange={handleInputChange} />
                </div>
                <div className="flex items-center bg-slate-50 rounded-lg px-4 py-3 border border-slate-200 focus-within:ring-2 focus-within:ring-[#87C232]">
                    <Lock className="text-slate-400 mr-3 shrink-0" size={20} />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        name="password" 
                        placeholder="Create Password" 
                        required 
                        className="bg-transparent outline-none flex-1 text-sm font-medium text-slate-700 placeholder-slate-400" 
                        onChange={handleInputChange} 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 focus:outline-none ml-2 shrink-0">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>

            <button type="submit" className={`mt-8 w-full max-w-[350px] py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${activeBg} hover:opacity-90`}><CheckCircle size={18} /> Sign Up</button>
          </form>
        </div>

        {/* SLIDING OVERLAY */}
        <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-40 ${isSignUp ? '-translate-x-full rounded-r-[20px] rounded-l-[100px]' : 'rounded-l-[20px] rounded-r-[100px]'}`}>
          <div className={`relative -left-full h-full w-[200%] transition-transform duration-700 ease-in-out ${activeBg} text-white ${isSignUp ? 'translate-x-1/2' : 'translate-x-0'}`}>
            <div className={`absolute top-0 right-0 w-1/2 h-full flex flex-col items-center justify-center px-12 text-center transition-transform duration-700 ease-in-out ${isSignUp ? 'translate-x-[20%]' : 'translate-x-0'}`}>
              <h1 className="text-4xl font-extrabold mb-4 leading-tight">Learn Without <br/>Limits.</h1>
              <p className="text-sm font-medium mb-8 italic opacity-90 max-w-[320px]">“Education is the passport to the future...”</p>
              <button onClick={() => setIsSignUp(true)} className="px-8 py-3 bg-transparent border-2 border-white rounded-xl font-bold text-sm tracking-wide hover:bg-white hover:text-slate-900 transition-all active:scale-95">Create Account</button>
            </div>
            <div className={`absolute top-0 left-0 w-1/2 h-full flex flex-col items-center justify-center px-12 text-center transition-transform duration-700 ease-in-out ${isSignUp ? 'translate-x-0' : '-translate-x-[20%]'}`}>
              <h1 className="text-4xl font-extrabold mb-4">Already a <br/>Member?</h1>
              <p className="text-sm font-medium mb-8 opacity-90 max-w-[320px]">Sign in to your dashboard...</p>
              <button onClick={() => setIsSignUp(false)} className="px-8 py-3 bg-transparent border-2 border-white rounded-xl font-bold text-sm tracking-wide hover:bg-white hover:text-slate-900 transition-all active:scale-95">Sign In</button>
            </div>
          </div>
        </div>

      </div>
      {toast.show && (<div className="fixed top-5 right-5 z-50 bg-white px-6 py-4 rounded-xl shadow-2xl border-l-4 border-l-current flex items-center gap-3 animate-fade-in" style={{ borderColor: toast.type === "success" ? "#87C232" : "#ef4444" }}>{toast.type === "success" ? <CheckCircle className="text-[#87C232]" size={24} /> : <AlertCircle className="text-red-500" size={24} />}<div><h4 className="font-bold text-slate-800 text-sm">{toast.type === "success" ? "Success" : "Error"}</h4><p className="text-slate-500 text-xs">{toast.message}</p></div><button onClick={() => setToast({ ...toast, show: false })} className="ml-2 text-slate-400 hover:text-slate-600"><X size={16} /></button></div>)}
    </div>
  );
};

export default Login;