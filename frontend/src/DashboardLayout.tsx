import { useState } from "react"; 
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, BookOpen, UserPlus, PlusCircle, LogOut, Bell, 
  ChevronRight, Code, Menu, User, Settings 
} from "lucide-react"; 

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  // ✅ Profile Dropdown State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const instructorData = { name: "Instructor", email: "instructor@iqmath.com" };

  const brand = {
    blue: "#005EB8", blueLight: "#E6F0F9", green: "#87C232",
    sidebarBg: "#FFFFFF", mainBg: "#F8FAFC", textMain: "#1e293b",
    textLight: "#64748b", border: "#e2e8f0", danger: "#ef4444"
  };

  const menuItems = [
    { label: "Home", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { label: "My Courses", path: "/dashboard/courses", icon: <BookOpen size={20} /> },
    { label: "Code Arena", path: "/dashboard/code-arena", icon: <Code size={20} /> },
    { label: "Add Admits", path: "/dashboard/add-admits", icon: <UserPlus size={20} /> },
    { label: "Create Course", path: "/dashboard/create-course", icon: <PlusCircle size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: brand.mainBg, fontFamily: "'Inter', sans-serif" }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: collapsed ? "80px" : "280px", background: brand.sidebarBg, borderRight: `1px solid ${brand.border}`, display: "flex", flexDirection: "column", position: "relative", zIndex: 10, boxShadow: "4px 0 24px rgba(0,0,0,0.02)", transition: "width 0.3s ease" }}>
        <div style={{ padding: collapsed ? "24px 0" : "32px 24px", borderBottom: `1px solid ${brand.border}`, display: "flex", flexDirection: collapsed ? "column" : "row", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", gap: "10px" }}>
          {!collapsed && (
            <div>
                <h2 style={{ fontSize: "24px", fontWeight: "800", color: brand.textMain, letterSpacing: "-0.5px", margin: 0 }}><span style={{ color: brand.blue }}>iQ</span>math</h2>
                <span style={{ fontSize: "11px", color: brand.green, fontWeight: "700", textTransform: "uppercase", letterSpacing: "1.5px", marginTop: "4px", display: "block" }}>Instructor</span>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: "transparent", border: "none", cursor: "pointer", color: brand.textLight, padding: "8px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}><Menu size={24} /></button>
        </div>

        <nav style={{ flex: 1, padding: "24px 12px", display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto" }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname === item.path + "/";
            return (
              <div key={item.path} onClick={() => navigate(item.path)} title={collapsed ? item.label : ""} style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", padding: "14px 16px", borderRadius: "10px", cursor: "pointer", color: isActive ? brand.blue : brand.textLight, background: isActive ? brand.blueLight : "transparent", fontWeight: isActive ? "700" : "500", transition: "all 0.2s ease-in-out" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>{item.icon} {!collapsed && <span style={{ fontSize: "15px" }}>{item.label}</span>}</div>
                {!collapsed && isActive && <ChevronRight size={16} color={brand.blue} strokeWidth={3} />}
              </div>
            );
          })}
        </nav>

        <div style={{ padding: "20px", borderTop: `1px solid ${brand.border}` }}>
          <div onClick={handleLogout} style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: "12px", padding: "12px 16px", color: brand.danger, cursor: "pointer", fontWeight: "600", borderRadius: "8px", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "#FEF2F2"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
            <LogOut size={20} /> {!collapsed && <span>Sign Out</span>}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ height: "80px", background: brand.sidebarBg, borderBottom: `1px solid ${brand.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px" }}>
          <div><h1 style={{ fontSize: "22px", fontWeight: "700", color: brand.textMain }}>{menuItems.find(i => i.path === location.pathname)?.label || "Dashboard"}</h1></div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button style={{ background: "transparent", border: "none", cursor: "pointer", padding: "8px", borderRadius: "50%" }}><Bell size={22} color={brand.textLight} /></button>
            
            {/* ✅ PROFILE DROPDOWN */}
            <div style={{ position: "relative" }}>
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} style={{ width: "40px", height: "40px", borderRadius: "50%", background: brand.blue, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "16px", boxShadow: "0 4px 10px rgba(0, 94, 184, 0.3)", border: "none", cursor: "pointer" }}>IN</button>
                
                {showProfileMenu && (
                    <div style={{ position: "absolute", right: 0, top: "50px", width: "240px", background: "white", borderRadius: "12px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)", padding: "16px", zIndex: 100, border: `1px solid ${brand.border}` }}>
                        <div style={{ marginBottom: "16px", borderBottom: `1px solid ${brand.border}`, paddingBottom: "16px" }}>
                            <p style={{ fontWeight: "700", color: brand.textMain, margin: 0 }}>{instructorData.name}</p>
                            <p style={{ fontSize: "12px", color: brand.textLight, margin: "4px 0 0 0" }}>{instructorData.email}</p>
                        </div>
                        <button onClick={() => { navigate("/dashboard/settings"); setShowProfileMenu(false); }} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px", borderRadius: "8px", border: "none", background: "transparent", color: brand.textMain, cursor: "pointer", textAlign: "left", fontSize: "14px", fontWeight: "500" }} onMouseOver={(e) => e.currentTarget.style.background = "#f1f5f9"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}><Settings size={18} /> Settings</button>
                        <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px", borderRadius: "8px", border: "none", background: "transparent", color: brand.danger, cursor: "pointer", textAlign: "left", fontSize: "14px", fontWeight: "600", marginTop: "4px" }} onMouseOver={(e) => e.currentTarget.style.background = "#fef2f2"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}><LogOut size={18} /> Logout</button>
                    </div>
                )}
            </div>
          </div>
        </header>

        <div style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;