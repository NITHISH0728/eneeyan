import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  Lock, Save, Settings, Code, Download, 
  LayoutDashboard, BookOpen, Users, LogOut, Plus, UserPlus, 
  Search, CheckCircle, Clock, Trophy, PlusCircle
} from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview"); 
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({ revenue: 1250, students: 45, courses: 3 });
  
  // Modal States
  const [showModal, setShowModal] = useState(false); // Course Modal
  const [newCourse, setNewCourse] = useState({ title: "", description: "", price: 0 });
  
  // Settings State
  const [newPassword, setNewPassword] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // ✅ CODE ARENA STATE
  const [codeTests, setCodeTests] = useState<any[]>([]);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testForm, setTestForm] = useState({ 
    title: "", 
    pass_key: "", 
    time_limit: 60, 
    problems: [] as any[] 
  });
  const [currentProblem, setCurrentProblem] = useState({ 
    title: "", 
    description: "", 
    difficulty: "Easy", 
    test_cases: JSON.stringify([{input: "", output: ""}]) 
  });
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  const navigate = useNavigate();

  useEffect(() => { 
    fetchCourses(); 
    fetchTests(); 
  }, []);

  const fetchCourses = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/v1/courses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(res.data);
      setStats(prev => ({ ...prev, courses: res.data.length }));
    } catch (err: any) { 
        if(err.response && err.response.status === 401) {
            localStorage.clear();
            navigate("/");
        }
        console.error("Failed to load courses"); 
    }
  };

  const fetchTests = async () => {
    const token = localStorage.getItem("token");
    try {
        const res = await axios.get("http://127.0.0.1:8000/api/v1/code-tests", {
            headers: { Authorization: `Bearer ${token}` }
        });
        setCodeTests(res.data);
    } catch(err) { console.error("Failed to load tests"); }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      await axios.post("http://127.0.0.1:8000/api/v1/courses", newCourse, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      fetchCourses();
      setNewCourse({ title: "", description: "", price: 0 });
      setActiveTab("courses");
    } catch (err) { alert("Error creating course"); }
  };

  // --- CODE ARENA HANDLERS ---
  const handleCreateTest = async () => {
      const token = localStorage.getItem("token");
      try {
          await axios.post("http://127.0.0.1:8000/api/v1/code-tests", testForm, {
              headers: { Authorization: `Bearer ${token}` }
          });
          alert("✅ Test Created & Students Notified!");
          setShowTestModal(false);
          setTestForm({ title: "", pass_key: "", time_limit: 60, problems: [] });
          fetchTests();
      } catch(err) { alert("Failed to create test"); }
  };

  const addProblemToTest = () => {
      if(!currentProblem.title) return alert("Problem title required");
      setTestForm({...testForm, problems: [...testForm.problems, currentProblem]});
      setCurrentProblem({ 
        title: "", description: "", difficulty: "Easy", 
        test_cases: JSON.stringify([{input: "", output: ""}]) 
      });
      alert("Problem Added! You can add more or click 'Save Test'");
  };

  const fetchResults = async (testId: number) => {
      setSelectedTestId(testId);
      const token = localStorage.getItem("token");
      try {
          const res = await axios.get(`http://127.0.0.1:8000/api/v1/code-tests/${testId}/results`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setTestResults(res.data);
      } catch(err) { alert("Failed to fetch results"); }
  };

  const downloadResults = () => {
      if(testResults.length === 0) return alert("No results to export");
      const csvContent = "data:text/csv;charset=utf-8,Name,Email,Score,Problems Solved,Time Taken,Date\n" 
          + testResults.map(r => `${r.student_name},${r.email},${r.score},${r.problems_solved},${r.time_taken},${r.submitted_at}`).join("\n");
      const link = document.createElement("a");
      link.href = encodeURI(csvContent);
      link.download = `test_results_${selectedTestId}.csv`;
      document.body.appendChild(link);
      link.click();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return alert("Password too short");
    
    setSavingSettings(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://127.0.0.1:8000/api/v1/user/change-password",
        { new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Password updated successfully!");
      setNewPassword("");
    } catch (err) {
      alert("Failed to update password.");
    } finally {
      setSavingSettings(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  // --- SUB-COMPONENTS ---
  const SidebarItem = ({ id, icon, label, onClick }: any) => (
    <div 
      onClick={onClick || (() => setActiveTab(id))}
      className={`
        px-6 py-4 cursor-pointer flex items-center gap-4 transition-all duration-300 border-l-4
        ${activeTab === id 
            ? "bg-iqBlue/5 border-iqBlue text-iqBlue font-bold" 
            : "border-transparent text-slate-500 hover:text-iqBlue hover:bg-slate-50"}
      `}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </div>
  );

  const StatCard = ({ label, value, color, icon, subtext }: any) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
             <span className="text-2xl">{icon}</span>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-bold bg-${color}-100 text-${color}-700`}>+12%</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800">{value}</h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen font-sans bg-slate-50 overflow-hidden">
      
      {/* --- LEFT SIDEBAR (Internal navigation) --- */}
      <div className="w-[260px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-20">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-iqBlue to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover rounded-xl opacity-90" />
          </div>
          <span className="text-slate-800 text-lg font-bold tracking-tight">Admin<span className="text-iqBlue">Panel</span></span>
        </div>

        <div className="flex-1 mt-6 overflow-y-auto space-y-1">
          <SidebarItem id="overview" icon={<LayoutDashboard size={20} />} label="Overview" />
          <SidebarItem id="courses" icon={<BookOpen size={20} />} label="My Courses" />
          <SidebarItem id="arena" icon={<Code size={20} />} label="Code Arena" />
          <SidebarItem id="admits" icon={<UserPlus size={20} />} label="Add Admits" onClick={() => navigate("/dashboard/add-admits")} />
          <SidebarItem id="students" icon={<Users size={20} />} label="Learners" />
        </div>

        <div className="p-4 border-t border-slate-100">
          <SidebarItem id="settings" icon={<Settings size={20} />} label="Settings" />
          <div className="mt-4">
            <button onClick={logout} className="w-full py-3 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group">
              <LogOut size={18} className="group-hover:stroke-red-600 transition-colors" /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="absolute inset-0 bg-slate-50 z-0"></div>
        
        {/* Content Header */}
        <header className="bg-white/80 backdrop-blur-sm px-8 py-5 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-iqBlue">
              {activeTab === 'overview' && "Dashboard Overview"}
              {activeTab === 'courses' && "Course Management"}
              {activeTab === 'arena' && "Coding Assessments"}
              {activeTab === 'students' && "Learner Management"}
              {activeTab === 'settings' && "Account Settings"}
            </h2>
            <p className="text-slate-400 text-sm mt-1">Manage your platform efficiently</p>
          </div>
          <div className="flex gap-4 items-center">
             <button className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-iqBlue hover:border-iqBlue transition-all shadow-sm relative">
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
                🔔
             </button>
             <div className="w-10 h-10 rounded-full bg-gradient-to-r from-iqBlue to-iqGreen text-white flex items-center justify-center font-bold shadow-md ring-2 ring-white">
                IS
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative z-0">
          
          {/* VIEW 1: OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="animate-slide-up max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard label="Total Revenue" value={`$${stats.revenue}`} color="iqGreen" icon="💰" />
                <StatCard label="Active Learners" value={stats.students} color="iqBlue" icon="👥" />
                <StatCard label="Live Courses" value={courses.length} color="orange" icon="🎓" />
              </div>
              
              <div className="glass-panel rounded-2xl p-8">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Clock size={20} className="text-iqBlue" /> Recent Activity
                </h3>
                <div className="space-y-4">
                    {[1, 2].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                            <div className="w-2 h-2 rounded-full bg-iqBlue"></div>
                            <p className="text-slate-600 text-sm">
                                {i === 0 ? 'New student enrolled in "Python Mastery" (2 mins ago)' : 'You updated "Digital Electronics" content (1 hour ago)'}
                            </p>
                        </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: COURSES TAB */}
          {activeTab === 'courses' && (
            <div className="animate-slide-up max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <div className="relative w-96">
                    <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input className="input-field pl-10" placeholder="Search courses..." />
                </div>
                <button 
                  onClick={() => setShowModal(true)}
                  className="btn-primary"
                >
                  <Plus size={18} /> Create New Course
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course: any) => (
                  <div key={course.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                    <div className="h-32 bg-gradient-to-r from-iqBlue to-blue-600 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-500">📘</div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{course.title}</h3>
                        <span className="text-iqGreen font-bold">${course.price}</span>
                      </div>
                      <p className="text-slate-500 text-sm line-clamp-2 mb-4 h-10">{course.description}</p>
                      <button className="w-full py-2.5 rounded-lg border border-iqBlue text-iqBlue font-semibold hover:bg-iqBlue hover:text-white transition-all text-sm">
                        Manage Course
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ✅ VIEW 3: CODE ARENA (INSTRUCTOR) */}
          {activeTab === 'arena' && (
              <div className="animate-slide-up max-w-7xl mx-auto">
                  <div className="flex justify-between items-end mb-8">
                      <div>
                          <h3 className="text-xl font-bold text-slate-800">Active Challenges</h3>
                          <p className="text-slate-500 text-sm mt-1">Manage your coding tests and view results</p>
                      </div>
                      <button onClick={() => setShowTestModal(true)} className="btn-primary bg-iqGreen hover:bg-green-600 shadow-green-500/20">
                          <Plus size={18} /> Create Challenge
                      </button>
                  </div>
                  
                  {/* Test List */}
                  <div className="space-y-4">
                      {codeTests.map(test => (
                          <div key={test.id} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-iqBlue/30 hover:shadow-lg transition-all flex justify-between items-center group">
                              <div className="flex items-start gap-4">
                                  <div className="p-3 bg-iqBlue/10 text-iqBlue rounded-xl group-hover:bg-iqBlue group-hover:text-white transition-colors">
                                    <Code size={24} />
                                  </div>
                                  <div>
                                      <h3 className="text-lg font-bold text-slate-800">{test.title}</h3>
                                      <div className="flex gap-6 mt-1 text-sm text-slate-500 font-medium">
                                          <span className="flex items-center gap-1.5"><Lock size={14} /> Pass Key: <span className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{test.pass_key}</span></span>
                                          <span className="flex items-center gap-1.5"><Clock size={14} /> Time: {test.time_limit} mins</span>
                                      </div>
                                  </div>
                              </div>
                              <button onClick={() => fetchResults(test.id)} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-semibold hover:bg-iqBlue hover:text-white transition-all text-sm">
                                  View Results
                              </button>
                          </div>
                      ))}
                  </div>

                  {/* Results Table */}
                  {selectedTestId && (
                      <div className="mt-10 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 animate-fade-in">
                          <div className="flex justify-between items-center mb-6">
                              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Trophy size={20} className="text-yellow-500" /> Results Log <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">ID: {selectedTestId}</span>
                              </h3>
                              <button onClick={downloadResults} className="btn-secondary text-sm flex items-center gap-2">
                                  <Download size={16} /> Export CSV
                              </button>
                          </div>
                          
                          {testResults.length === 0 ? (
                              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <p className="text-slate-400 font-medium">No submissions received yet.</p>
                              </div>
                          ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                            <th className="p-4 rounded-tl-xl">Student Name</th>
                                            <th className="p-4">Email</th>
                                            <th className="p-4 text-center">Score</th>
                                            <th className="p-4 text-center">Solved</th>
                                            <th className="p-4">Time Taken</th>
                                            <th className="p-4 rounded-tr-xl">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {testResults.map((r, i) => (
                                            <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="p-4 font-semibold text-slate-700">{r.student_name}</td>
                                                <td className="p-4 text-slate-500 text-sm">{r.email}</td>
                                                <td className="p-4 text-center">
                                                  <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-xs">{r.score}</span>
                                                </td>
                                                <td className="p-4 text-center font-medium text-slate-600">{r.problems_solved}</td>
                                                <td className="p-4 text-sm text-slate-500">{r.time_taken}</td>
                                                <td className="p-4 text-xs text-slate-400">{r.submitted_at}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                              </div>
                          )}
                      </div>
                  )}
              </div>
          )}

          {/* VIEW 4: SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="animate-slide-up max-w-2xl mx-auto mt-8">
                <div className="glass-panel rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                        <div className="p-3 bg-iqBlue/10 text-iqBlue rounded-xl">
                            <Lock size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Security Settings</h3>
                            <p className="text-sm text-slate-500">Update your instructor account password</p>
                        </div>
                    </div>
                    <form onSubmit={handlePasswordChange}>
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">New Password</label>
                            <input 
                                type="password" required minLength={6}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new strong password"
                                className="input-field"
                            />
                        </div>
                        <button 
                            type="submit" disabled={savingSettings}
                            className="btn-primary w-full"
                        >
                            <Save size={18} /> {savingSettings ? "Updating..." : "Update Password"}
                        </button>
                    </form>
                </div>
            </div>
          )}

        </div>
      </div>

      {/* CREATE COURSE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
          <div className="bg-white p-8 rounded-2xl w-[500px] shadow-2xl animate-slide-up">
            <h2 className="text-2xl font-bold text-iqBlue mb-6">Create New Course</h2>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <input 
                placeholder="Course Title" 
                value={newCourse.title} 
                onChange={(e) => setNewCourse({...newCourse, title: e.target.value})} 
                required 
                className="input-field" 
              />
              <textarea 
                placeholder="Description" 
                value={newCourse.description} 
                onChange={(e) => setNewCourse({...newCourse, description: e.target.value})} 
                className="input-field min-h-[100px]" 
              />
              <div className="relative">
                <span className="absolute left-4 top-3 text-slate-400">$</span>
                <input 
                  type="number" 
                  placeholder="Price" 
                  value={newCourse.price} 
                  onChange={(e) => setNewCourse({...newCourse, price: Number(e.target.value)})} 
                  className="input-field pl-8" 
                />
              </div>
              <div className="flex gap-4 mt-8 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CODE TEST MODAL */}
      {showTestModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
              <div className="bg-white w-[900px] h-[85vh] rounded-2xl p-8 overflow-y-auto shadow-2xl animate-slide-up scroll-smooth">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Define New Algorithm Challenge</h2>
                    <button onClick={() => setShowTestModal(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <span className="text-2xl">×</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6 mb-8">
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Challenge Title</label>
                          <input value={testForm.title} onChange={e => setTestForm({...testForm, title: e.target.value})} className="input-field" />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Pass Key</label>
                          <input value={testForm.pass_key} onChange={e => setTestForm({...testForm, pass_key: e.target.value})} placeholder="e.g. SECRET123" className="input-field" />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Time Limit (Mins)</label>
                          <input type="number" value={testForm.time_limit} onChange={e => setTestForm({...testForm, time_limit: Number(e.target.value)})} className="input-field" />
                      </div>
                  </div>
                  
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-slate-800 font-bold flex items-center gap-2">
                           <PlusCircle size={18} className="text-iqBlue" /> Add Problem
                        </h4>
                        <span className="text-xs font-bold bg-white border border-slate-200 px-3 py-1 rounded-full text-slate-500">
                           {testForm.problems.length} added
                        </span>
                      </div>
                      
                      <div className="space-y-4 mb-4">
                          <input placeholder="Problem Title (e.g. Binary Search)" value={currentProblem.title} onChange={e => setCurrentProblem({...currentProblem, title: e.target.value})} className="input-field bg-white" />
                          <textarea placeholder="Full Problem Description..." value={currentProblem.description} onChange={e => setCurrentProblem({...currentProblem, description: e.target.value})} className="input-field bg-white min-h-[100px]" />
                      </div>
                      
                      <button onClick={addProblemToTest} className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all shadow-lg shadow-slate-300">
                        + Add This Problem to Test
                      </button>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-slate-100">
                      <button onClick={() => setShowTestModal(false)} className="btn-secondary flex-1 py-4">Cancel</button>
                      <button onClick={handleCreateTest} className="btn-primary flex-[2] bg-iqGreen hover:bg-green-600 shadow-green-500/20 py-4 text-lg">
                        <CheckCircle size={20} /> Save & Notify Students
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;