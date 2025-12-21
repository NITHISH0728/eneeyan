import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  BookOpen, 
  UserPlus, 
  PlusCircle, 
  LogOut, 
  Bell,
  ChevronRight,
  Code
} from "lucide-react"; 

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    { 
      label: "Overview", 
      path: "/dashboard", 
      icon: <LayoutDashboard size={20} /> 
    },
    { 
      label: "My Courses", 
      path: "/dashboard/courses", 
      icon: <BookOpen size={20} />,
    },
    { 
      label: "Code Arena", 
      path: "/dashboard/code-arena", 
      icon: <Code size={20} />, 
    },
    { 
      label: "Add Admits", 
      path: "/dashboard/add-admits", 
      icon: <UserPlus size={20} />, 
    },
    { 
      label: "Create Course", 
      path: "/dashboard/create-course", 
      icon: <PlusCircle size={20} /> 
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* 🔵 SIDEBAR NAVIGATION */}
      <aside className="w-[280px] bg-white border-r border-slate-200 flex flex-col relative z-20 shadow-2xl shadow-slate-200/50">
        
        {/* Brand Logo Area */}
        <div className="p-8 border-b border-slate-100">
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            <span className="text-iqBlue">iQ</span>math
          </h2>
          <span className="text-[10px] text-iqGreen font-bold uppercase tracking-[0.2em] mt-1 block">
            Instructor Portal
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname === item.path + "/";
            return (
              <div 
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                  group flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-300 ease-out
                  ${isActive 
                    ? "bg-iqBlue text-white shadow-lg shadow-iqBlue/25 translate-x-1" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-iqBlue"
                  }
                `}
              >
                <div className="flex items-center gap-3.5">
                  <span className={`${isActive ? "text-white" : "text-slate-400 group-hover:text-iqBlue"} transition-colors`}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-semibold tracking-wide">{item.label}</span>
                </div>
                {isActive && <ChevronRight size={16} className="text-white/80" strokeWidth={3} />}
              </div>
            );
          })}
        </nav>

        {/* User Profile / Logout Section */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 font-semibold text-sm group"
          >
            <div className="p-1.5 bg-red-100 text-red-500 rounded-md group-hover:bg-red-200 transition-colors">
              <LogOut size={16} />
            </div>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ⚪ MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50">
        
        {/* Top Header Bar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          {/* Page Title */}
          <div className="animate-fade-in">
            <h1 className="text-xl font-bold text-slate-800">
              {menuItems.find(i => i.path === location.pathname)?.label || "Dashboard"}
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Welcome back, Instructor</p>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-400 hover:text-iqBlue hover:bg-blue-50 rounded-full transition-all">
              <Bell size={22} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-iqGreen rounded-full border border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-700">Instructor Account</p>
                <p className="text-[10px] text-iqBlue font-bold uppercase">Pro Plan</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-iqBlue to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-500/30 border-2 border-white">
                IN
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content Loads Here */}
        <div className="flex-1 p-8 overflow-y-auto scroll-smooth">
          <Outlet />
        </div>

      </main>
    </div>
  );
};

export default DashboardLayout;