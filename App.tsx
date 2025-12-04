import React, { useState, useEffect } from 'react';
import { User, ViewState, ToolDef } from './types';
import { BGRemover, CameraCapture, ThreeGenerator, Assistant, CodeBuilder, ToolWrapper } from './components/Tools';
import { Layout, Grid, Activity, Box, MessageSquare, Code, Image as ImageIcon, Home, ScanFace } from 'lucide-react';

// Define tools
const TOOLS: ToolDef[] = [
  { id: 'bgremover', icon: 'image', label: 'BG Remover', desc: 'Remove image backgrounds', color: 'bg-purple-100 text-purple-600' },
  { id: 'camera', icon: 'camera', label: 'HD Camera', desc: 'Capture & save photos', color: 'bg-rose-100 text-rose-600' },
  { id: 'three', icon: 'box', label: '3D Studio', desc: 'Basic 3D shapes', color: 'bg-blue-100 text-blue-600' },
  { id: 'assistant', icon: 'message', label: 'AI Assistant', desc: 'Chat with Gemini', color: 'bg-emerald-100 text-emerald-600' },
  { id: 'builder', icon: 'code', label: 'Code Builder', desc: 'Generate HTML/CSS', color: 'bg-orange-100 text-orange-600' },
];

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ahmar_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [view, setView] = useState<ViewState>(user ? 'dashboard' : 'home');

  useEffect(() => {
    if (user) {
      localStorage.setItem('ahmar_user', JSON.stringify(user));
      if (view === 'home') setView('dashboard');
    } else {
      localStorage.removeItem('ahmar_user');
      setView('home');
    }
  }, [user]);

  const handleLogin = (name: string, email: string) => {
    setUser({ name, email, created: Date.now() });
  };

  const handleLogout = () => {
    setUser(null);
  };

  // -- Views --

  const AuthView = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const submit = (e: React.FormEvent) => {
      e.preventDefault();
      if (name) handleLogin(name, email || 'guest@ahmar.tech');
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 animate-fade-in-up">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Ahmar Tech</h1>
            <p className="text-slate-500 mt-2">Sign in to access creative tools</p>
          </div>
          
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
              <input 
                value={name} onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="John Doe"
                required
              />
            </div>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input 
                  type="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="john@example.com"
                />
              </div>
            )}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors">
              {isLogin ? 'Enter Dashboard' : 'Create Account'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-blue-600 hover:underline">
              {isLogin ? "Need an account? Sign up" : "Have an account? Login"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Dashboard = () => (
    <div className="max-w-6xl mx-auto p-6">
       <div className="mb-8">
         <h2 className="text-2xl font-bold text-slate-800">Welcome, {user?.name}</h2>
         <p className="text-slate-500">Select a tool to get started</p>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {TOOLS.map((tool) => {
           // Dynamic icon mapping
           const Icon = 
             tool.icon === 'image' ? ImageIcon :
             tool.icon === 'camera' ? ScanFace :
             tool.icon === 'box' ? Box :
             tool.icon === 'code' ? Code :
             MessageSquare;

           return (
             <button 
               key={tool.id}
               onClick={() => setView(tool.id)}
               className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left flex flex-col h-full"
             >
               <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tool.color} group-hover:scale-110 transition-transform`}>
                 <Icon size={24} />
               </div>
               <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{tool.label}</h3>
               <p className="text-sm text-slate-500 mt-2">{tool.desc}</p>
             </button>
           );
         })}
       </div>
    </div>
  );

  // Main Render Layout
  if (!user) return <AuthView />;

  const renderContent = () => {
    switch (view) {
      case 'bgremover': return <BGRemover onBack={() => setView('dashboard')} />;
      case 'camera': return <CameraCapture onBack={() => setView('dashboard')} />;
      case 'three': return <ThreeGenerator onBack={() => setView('dashboard')} />;
      case 'assistant': return <Assistant user={user} onBack={() => setView('dashboard')} />;
      case 'builder': return <CodeBuilder onBack={() => setView('dashboard')} />;
      case 'dashboard':
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-full z-10">
        <div className="p-6 border-b border-slate-100">
           <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">A</div>
             Ahmar Tech
           </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
           <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'dashboard' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
             <Layout size={20} /> Dashboard
           </button>
           <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tools</div>
           {TOOLS.map(t => (
             <button 
               key={t.id} 
               onClick={() => setView(t.id)}
               className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm ${view === t.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
             >
               <span className="opacity-70">●</span> {t.label}
             </button>
           ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-4 px-2">
             <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
               {user.name[0]}
             </div>
             <div className="flex-1 min-w-0">
               <div className="text-sm font-medium text-slate-900 truncate">{user.name}</div>
               <div className="text-xs text-slate-500 truncate">{user.email}</div>
             </div>
          </div>
          <button onClick={handleLogout} className="w-full py-2 px-4 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-20">
         <span className="font-bold text-lg">Ahmar Tech</span>
         <button onClick={handleLogout} className="text-sm text-red-500">Logout</button>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen transition-all">
        <div className="h-full">
           {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;