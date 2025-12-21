import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Users, TrendingUp, DollarSign, BookOpen, 
  UserPlus, FileText, MessageSquare 
} from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Theme Palette (Professional Gray tones added)
const theme = {
  blue: "#005EB8",
  green: "#87C232", // Kept for positive trends if needed later, but generally unused now
  darkBlue: "#004080",
  lightBg: "#f8fafc",
  white: "#ffffff",
  border: "#e2e8f0",
  // New Grays
  grayIcon: "#64748b", // Slate 500 for icons
  grayBgIcon: "#f1f5f9", // Slate 100 for icon backgrounds
  grayDark: "#334155", // Slate 700 for dark text
  grayMedium: "#94a3b8", // Slate 400 for secondary elements/charts
  grayLight: "#cbd5e1" // Slate 300 for subtle borders
};

// Mock Data
const activityData = [ { name: 'Mon', students: 12 }, { name: 'Tue', students: 19 }, { name: 'Wed', students: 35 }, { name: 'Thu', students: 28 }, { name: 'Fri', students: 45 }, { name: 'Sat', students: 60 }, { name: 'Sun', students: 55 } ];
const sparkData = [ { val: 10 }, { val: 20 }, { val: 15 }, { val: 30 }, { val: 45 }, { val: 60 } ];

const Dashboard = () => {
  const [stats, setStats] = useState({ revenue: 1250, students: 45, courses: 3, newEnrollments: 5, pendingReviews: 2, messages: 8 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/v1/courses", { headers: { Authorization: `Bearer ${token}` } });
      setStats(prev => ({ ...prev, courses: res.data.length }));
    } catch (err) { console.error(err); }
  };

  const AnimatedCounter = ({ value, prefix = "" }: { value: number, prefix?: string }) => {
      const [count, setCount] = useState(0);
      useEffect(() => {
          let start = 0; const end = value; if (start === end) return;
          const increment = end / 50;
          const timer = setInterval(() => { start += increment; if (start >= end) { setCount(end); clearInterval(timer); } else setCount(Math.ceil(start)); }, 20);
          return () => clearInterval(timer);
      }, [value]);
      return <span>{prefix}{count}</span>;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="flex flex-col gap-8">
      {/* 1. WELCOME */}
      <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex justify-between items-end mb-4">
          <div><h1 className="text-3xl font-extrabold text-slate-800 mb-2">Welcome back, Instructor 👋</h1><p className="text-slate-500">Here's what's happening with your courses today.</p></div>
      </motion.div>

      {/* 2. SUMMARY CARDS (Top Row - Now Gray) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
          {[
            { title: "New Enrollments", val: stats.newEnrollments, icon: <UserPlus size={24} /> },
            { title: "Pending Reviews", val: stats.pendingReviews, icon: <FileText size={24} /> },
            { title: "Unread Messages", val: stats.messages, icon: <MessageSquare size={24} /> }
          ].map((item, i) => (
              <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} style={{ background: "white", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", display: "flex", alignItems: "center", gap: "20px", border: `1px solid ${theme.border}` }}>
                  {/* Gray Icon Container */}
                  <div style={{ width: "50px", height: "50px", borderRadius: "12px", backgroundColor: theme.grayBgIcon, display: "flex", alignItems: "center", justifyContent: "center", color: theme.grayIcon }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: "28px", fontWeight: "800", color: theme.grayDark }}>
                      <AnimatedCounter value={item.val} />
                    </div>
                    <div style={{ fontSize: "14px", color: theme.grayIcon, fontWeight: "500" }}>{item.title}</div>
                  </div>
              </motion.div>
          ))}
      </div>

      {/* 3. PERFORMANCE STATS (Middle Row - Now Gray) */}
      <h3 style={{ margin: "10px 0", fontSize: "18px", color: theme.grayDark, fontWeight: "700" }}>Performance Overview</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "25px" }}>
          {/* Total Students */}
          <motion.div whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} style={{ background: "white", padding: "25px", borderRadius: "16px", border: `1px solid ${theme.border}`, position: "relative", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px" }}>
                <div><p style={{ margin: 0, color: theme.grayIcon, fontSize: "13px", fontWeight: "bold", textTransform: "uppercase" }}>Total Students</p><h2 style={{ margin: "5px 0 0 0", fontSize: "32px", color: theme.grayDark }}><AnimatedCounter value={stats.students} /></h2></div>
                <div style={{ padding: "10px", background: theme.grayBgIcon, borderRadius: "10px", color: theme.grayIcon }}><Users size={24} /></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", color: theme.grayIcon, fontSize: "13px", fontWeight: "bold" }}><TrendingUp size={16} /> +12% this month</div>
          </motion.div>

          {/* Monthly Revenue & Sparkline Chart */}
          <motion.div whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} style={{ background: "white", padding: "25px", borderRadius: "16px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px" }}>
                <div><p style={{ margin: 0, color: theme.grayIcon, fontSize: "13px", fontWeight: "bold", textTransform: "uppercase" }}>Monthly Revenue</p><h2 style={{ margin: "5px 0 0 0", fontSize: "32px", color: theme.grayDark }}><AnimatedCounter value={stats.revenue} prefix="$" /></h2></div>
                <div style={{ padding: "10px", background: theme.grayBgIcon, borderRadius: "10px", color: theme.grayIcon }}><DollarSign size={24} /></div>
              </div>
              <div style={{ height: "40px", width: "100%" }}>
                {/* Chart updated to gray */}
                <ResponsiveContainer width="100%" height="100%"><AreaChart data={sparkData}><Area type="monotone" dataKey="val" stroke={theme.grayMedium} fill={theme.border} strokeWidth={2} /></AreaChart></ResponsiveContainer>
              </div>
          </motion.div>

          {/* Active Courses & Progress Bar */}
          <motion.div whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} style={{ background: "white", padding: "25px", borderRadius: "16px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px" }}>
                <div><p style={{ margin: 0, color: theme.grayIcon, fontSize: "13px", fontWeight: "bold", textTransform: "uppercase" }}>Active Courses</p><h2 style={{ margin: "5px 0 0 0", fontSize: "32px", color: theme.grayDark }}><AnimatedCounter value={stats.courses} /></h2></div>
                <div style={{ padding: "10px", background: theme.grayBgIcon, borderRadius: "10px", color: theme.grayIcon }}><BookOpen size={24} /></div>
              </div>
              {/* Progress bar updated to gray */}
              <div style={{ width: "100%", background: theme.grayBgIcon, borderRadius: "4px", height: "6px", marginTop: "10px" }}><div style={{ width: "70%", background: theme.grayMedium, height: "100%", borderRadius: "4px" }}></div></div>
          </motion.div>
      </div>

      {/* 4. ACTIVITY & ALERTS */}
      <div style={{ display: "flex", gap: "25px", height: "350px" }}>
          {/* Main Chart (Updated to gray/dark blue) */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} style={{ flex: 2, background: "white", padding: "25px", borderRadius: "16px", border: `1px solid ${theme.border}`, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}><h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: theme.grayDark }}>Student Activity (Last 7 Days)</h3></div>
              <div style={{ flex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: theme.grayIcon, fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: theme.grayIcon, fontSize: 12}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                    {/* Line color changed to dark gray/blue */}
                    <Line type="monotone" dataKey="students" stroke={theme.grayDark} strokeWidth={3} dot={{ r: 4, fill: theme.grayDark, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} animationDuration={2000} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
          </motion.div>

          {/* Alerts Section (Updated to gray borders and icons) */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} style={{ flex: 1, background: "white", padding: "25px", borderRadius: "16px", border: `1px solid ${theme.border}`, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}><h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: theme.grayDark }}>Payment Alerts</h3><div style={{ padding: "4px 8px", background: "#fee2e2", color: "#ef4444", borderRadius: "12px", fontSize: "11px", fontWeight: "bold", animation: "pulse 2s infinite" }}>NEW</div></div>
              <div style={{ display: "flex", flexDirection: "column", gap: "15px", flex: 1, overflowY: "auto" }}>
                {[1, 2, 3].map((_, i) => (
                  // Changed borderLeft color to gray
                  <motion.div key={i} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 + (i * 0.1) }} style={{ display: "flex", alignItems: "center", gap: "15px", padding: "12px", background: theme.lightBg, borderRadius: "10px", borderLeft: `4px solid ${theme.grayLight}` }}>
                    {/* Changed icon color to gray */}
                    <div style={{ padding: "8px", background: "white", borderRadius: "50%", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}><DollarSign size={16} color={theme.grayIcon} /></div>
                    <div><div style={{ fontSize: "13px", fontWeight: "bold", color: theme.grayDark }}>New Sale: Python Course</div><div style={{ fontSize: "11px", color: theme.grayIcon }}>Just now • $49.00</div></div>
                  </motion.div>
                ))}
              </div>
              <button style={{ width: "100%", padding: "12px", marginTop: "10px", background: "none", border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.blue, fontWeight: "600", cursor: "pointer", fontSize: "13px" }}>View All Transactions</button>
          </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;