import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Users, TrendingUp, IndianRupee, BookOpen, 
  UserPlus, FileText, MessageSquare
} from "lucide-react"; // ✅ Imported IndianRupee
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Dashboard = () => {
  // ✅ Initialize with 0 so it animates to the real number
  const [stats, setStats] = useState({ 
    revenue: 0, 
    students: 0, 
    courses: 0, 
    newEnrollments: 0, 
    pendingReviews: 2, 
    messages: 8 
  });

  // Mock Data for Charts (Keep as visual placeholder)
  const activityData = [ { name: 'Mon', students: 12 }, { name: 'Tue', students: 19 }, { name: 'Wed', students: 35 }, { name: 'Thu', students: 28 }, { name: 'Fri', students: 45 }, { name: 'Sat', students: 60 }, { name: 'Sun', students: 55 } ];
  const sparkData = [ { val: 10 }, { val: 20 }, { val: 15 }, { val: 30 }, { val: 45 }, { val: 60 } ];

  // 🎨 PROFESSIONAL THEME COLORS
  const theme = {
    cardBg: "#F8FAFC",      // Off-White / Very Light Gray
    border: "#cbd5e1",      // Subtle Border
    textMain: "#1e293b",    // Dark Slate
    textLight: "#64748b",   // Muted Slate
    iconColor: "#64748b",   // Neutral Icon Color
    chartLine: "#334155"    // Professional Chart Line Color
  };

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("token");
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // 1. Fetch Real Courses Count
        const coursesRes = await axios.get("http://127.0.0.1:8000/api/v1/courses", config);
        
        // 2. Fetch Real Students Count
        const studentsRes = await axios.get("http://127.0.0.1:8000/api/v1/admin/students", config);

        // 3. Calculate Real Stats
        const studentCount = studentsRes.data.length;
        const courseCount = coursesRes.data.length;
        const revenue = studentCount * 599; // Assuming ₹599 per student

        setStats(prev => ({
            ...prev,
            revenue: revenue,
            students: studentCount,
            courses: courseCount,
            newEnrollments: studentCount // Showing total students as new enrollments for now
        }));

      } catch (err) { console.error("Failed to load dashboard stats", err); }
    };
    fetchStats();
  }, []);

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
      
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Dashboard Overview</h1>
        <p className="text-slate-500">Track your course performance and student activity.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-5">
          {[
            { title: "New Enrollments", val: stats.newEnrollments, icon: UserPlus },
            { title: "Pending Reviews", val: stats.pendingReviews, icon: FileText },
            { title: "Unread Messages", val: stats.messages, icon: MessageSquare }
          ].map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ delay: i * 0.1 }} 
                style={{ background: theme.cardBg, borderColor: theme.border }} 
                className="p-5 rounded-2xl border shadow-sm flex items-center gap-5"
              >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                    <item.icon size={24} strokeWidth={1.5} color={theme.iconColor} />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-800">
                        <AnimatedCounter value={item.val} />
                    </div>
                    <div className="text-sm text-slate-500 font-medium">{item.title}</div>
                  </div>
              </motion.div>
          ))}
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-3 gap-6">
          
          {/* TOTAL STUDENTS */}
          <div style={{ background: theme.cardBg, borderColor: theme.border }} className="p-6 rounded-2xl border">
              <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Total Students</p>
                    <h2 className="text-3xl font-bold text-slate-800 mt-1"><AnimatedCounter value={stats.students} /></h2>
                </div>
                <div className="p-2 bg-slate-100 rounded-lg">
                    <Users size={24} strokeWidth={1.5} color={theme.iconColor} />
                </div>
              </div>
              <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
                <TrendingUp size={16} strokeWidth={2} /> +12% this month
              </div>
          </div>

          {/* REVENUE (Changed to Rupee) */}
          <div style={{ background: theme.cardBg, borderColor: theme.border }} className="p-6 rounded-2xl border">
              <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Revenue</p>
                    {/* ✅ Changed Prefix to Rupee Symbol */}
                    <h2 className="text-3xl font-bold text-slate-800 mt-1"><AnimatedCounter value={stats.revenue} prefix="₹" /></h2>
                </div>
                <div className="p-2 bg-slate-100 rounded-lg">
                    {/* ✅ Changed Icon to IndianRupee */}
                    <IndianRupee size={24} strokeWidth={1.5} color={theme.iconColor} />
                </div>
              </div>
              <div className="h-10 w-full">
                <ResponsiveContainer>
                    <AreaChart data={sparkData}>
                        <Area type="monotone" dataKey="val" stroke="#94a3b8" fill="#e2e8f0" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
              </div>
          </div>

          {/* ACTIVE COURSES */}
          <div style={{ background: theme.cardBg, borderColor: theme.border }} className="p-6 rounded-2xl border">
              <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Active Courses</p>
                    <h2 className="text-3xl font-bold text-slate-800 mt-1"><AnimatedCounter value={stats.courses} /></h2>
                </div>
                <div className="p-2 bg-slate-100 rounded-lg">
                    <BookOpen size={24} strokeWidth={1.5} color={theme.iconColor} />
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                <div className="w-[70%] bg-slate-400 h-full rounded-full"></div>
              </div>
          </div>
      </div>

      {/* Main Chart */}
      <div style={{ background: theme.cardBg, borderColor: theme.border }} className="p-6 rounded-2xl border h-[350px]">
          <h3 className="text-base font-bold text-slate-800 mb-5">Student Activity</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: "#64748b", fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: "#64748b", fontSize: 12}} />
              <Tooltip 
                contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    background: '#FFFFFF',
                    color: '#1e293b'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="students" 
                stroke={theme.chartLine} 
                strokeWidth={3} 
                dot={{ r: 4, fill: theme.chartLine }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default Dashboard;