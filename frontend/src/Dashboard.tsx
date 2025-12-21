import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Users, TrendingUp, DollarSign, BookOpen, 
  UserPlus, FileText, MessageSquare
} from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({ revenue: 1250, students: 45, courses: 3, newEnrollments: 5, pendingReviews: 2, messages: 8 });

  // Mock Data
  const activityData = [ { name: 'Mon', students: 12 }, { name: 'Tue', students: 19 }, { name: 'Wed', students: 35 }, { name: 'Thu', students: 28 }, { name: 'Fri', students: 45 }, { name: 'Sat', students: 60 }, { name: 'Sun', students: 55 } ];
  const sparkData = [ { val: 10 }, { val: 20 }, { val: 15 }, { val: 30 }, { val: 45 }, { val: 60 } ];

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/v1/courses", { headers: { Authorization: `Bearer ${token}` } });
        setStats(prev => ({ ...prev, courses: res.data.length }));
      } catch (err) { console.error(err); }
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
      {/* Welcome */}
      <div><h1 className="text-3xl font-extrabold text-slate-800 mb-2">Dashboard Overview</h1><p className="text-slate-500">Track your course performance and student activity.</p></div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-5">
          {[
            { title: "New Enrollments", val: stats.newEnrollments, icon: <UserPlus size={24} /> },
            { title: "Pending Reviews", val: stats.pendingReviews, icon: <FileText size={24} /> },
            { title: "Unread Messages", val: stats.messages, icon: <MessageSquare size={24} /> }
          ].map((item, i) => (
              <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">{item.icon}</div>
                  <div><div className="text-2xl font-extrabold text-slate-800"><AnimatedCounter value={item.val} /></div><div className="text-sm text-slate-500 font-medium">{item.title}</div></div>
              </motion.div>
          ))}
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div><p className="text-xs font-bold text-slate-500 uppercase">Total Students</p><h2 className="text-3xl font-bold text-slate-800 mt-1"><AnimatedCounter value={stats.students} /></h2></div>
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Users size={24} /></div>
              </div>
              <div className="flex items-center gap-1 text-green-600 text-xs font-bold"><TrendingUp size={16} /> +12% this month</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div><p className="text-xs font-bold text-slate-500 uppercase">Revenue</p><h2 className="text-3xl font-bold text-slate-800 mt-1"><AnimatedCounter value={stats.revenue} prefix="$" /></h2></div>
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><DollarSign size={24} /></div>
              </div>
              <div className="h-10 w-full"><ResponsiveContainer><AreaChart data={sparkData}><Area type="monotone" dataKey="val" stroke="#94a3b8" fill="#e2e8f0" strokeWidth={2} /></AreaChart></ResponsiveContainer></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div><p className="text-xs font-bold text-slate-500 uppercase">Active Courses</p><h2 className="text-3xl font-bold text-slate-800 mt-1"><AnimatedCounter value={stats.courses} /></h2></div>
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><BookOpen size={24} /></div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2"><div className="w-[70%] bg-slate-400 h-full rounded-full"></div></div>
          </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 h-[350px]">
          <h3 className="text-base font-bold text-slate-800 mb-5">Student Activity</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: "#64748b", fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: "#64748b", fontSize: 12}} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="students" stroke="#334155" strokeWidth={3} dot={{ r: 4, fill: "#334155" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default Dashboard;