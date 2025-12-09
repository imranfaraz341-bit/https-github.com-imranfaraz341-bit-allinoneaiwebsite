import React, { useState, useEffect } from 'react';
import { User, ViewState, ToolDef, GeneratedAsset } from './types';
import { BGRemover, CameraCapture, Assistant, CodeBuilder, ToolWrapper, AICharacterMaker, HouseMaker, BabyAging, AILogoMaker, AIWallpaperMaker, AIVideoMaker, ProjectGallery, ImageEditor } from './components/Tools';
import { Layout, Box, MessageSquare, Image as ImageIcon, Home, ScanFace, PenTool, User as UserIcon, Smile, Shield, MonitorPlay, Palette, Globe, Layers, Crop } from 'lucide-react';

// Define tools with Neon colors
const TOOLS: ToolDef[] = [
  { id: 'ai-logo', icon: 'shield', label: 'AI Logo Studio', desc: 'GenAI Powered', color: 'bg-purple-900/20 text-purple-400' },
  { id: 'ai-wall', icon: 'palette', label: 'AI Wallpaper', desc: '4K Art Generator', color: 'bg-cyan-900/20 text-cyan-400' },
  { id: 'ai-video', icon: 'video', label: 'AI Video', desc: 'Veo Text-to-Video', color: 'bg-rose-900/20 text-rose-400' },
  { id: 'ai-char', icon: 'user', label: '3D Characters', desc: 'AI Character Design', color: 'bg-orange-900/20 text-orange-400' },
  { id: 'image-editor', icon: 'crop', label: 'Visual Manipulator', desc: 'Crop & Filters', color: 'bg-yellow-900/20 text-yellow-400' },
  { id: 'builder', icon: 'code', label: 'Website Builder', desc: 'Functional Sites', color: 'bg-pink-900/20 text-pink-400' },
  { id: 'assistant', icon: 'message', label: 'AI Assistant', desc: 'Live Multilingual Call', color: 'bg-emerald-900/20 text-emerald-400' },
  { id: 'bgremover', icon: 'image', label: 'BG Remover', desc: 'Magic Eraser', color: 'bg-indigo-900/20 text-indigo-400' },
  { id: 'house', icon: 'home', label: 'House Maker', desc: 'AI Blueprints', color: 'bg-amber-900/20 text-amber-400' },
  { id: 'camera', icon: 'camera', label: 'HD Camera', desc: 'Capture & save', color: 'bg-teal-900/20 text-teal-400' },
  { id: 'baby', icon: 'smile', label: 'Baby Filter', desc: 'Fun effect', color: 'bg-blue-900/20 text-blue-400' },
];

const IntroAnimation = ({ onComplete, username }: { onComplete: () => void, username: string }) => {
  const [text, setText] = useState('');
  const fullText = `WELCOME TO AHMAR TECH... ACCESS GRANTED... HELLO ${username.toUpperCase()}`;
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) {
        clearInterval(interval);
        setTimeout(onComplete, 1500);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [fullText, onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center font-mono text-center p-4">
      <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/U3qYN8S0j3bpK/giphy.gif')] opacity-10 bg-cover pointer-events-none"></div>
      <div className="glitch-text text-2xl md:text-5xl font-bold text-green-500 mb-4 animate-pulse neon-text">
        {text}
        <span className="animate-blink">_</span>
      </div>
      <div className="w-64 h-1 bg-gray-800 rounded mt-8 overflow-hidden">
        <div className="h-full bg-green-500 animate-progress origin-left"></div>
      </div>
      <p className="text-green-800 mt-2 text-xs uppercase tracking-widest">Initializing Neural Networks...</p>
    </div>
  );
};

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ahmar_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [view, setView] = useState<ViewState>(user ? 'dashboard' : 'home');
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('ahmar_user', JSON.stringify(user));
      // Only show intro if we are just logging in, not on refresh if already logged in
      // But for this prototype, let's strictly control it via the handleLogin
    } else {
      localStorage.removeItem('ahmar_user');
      setView('home');
    }
  }, [user]);

  const handleLogin = (name: string, email: string) => {
    setShowIntro(true);
    // Delay setting user state until intro finishes? 
    // Actually we set user now, but overlay intro
    setUser({ name, email, created: Date.now() });
    setView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
  };

  const saveProject = (asset: GeneratedAsset) => {
    const existing = localStorage.getItem('ahmar_projects');
    const projects: GeneratedAsset[] = existing ? JSON.parse(existing) : [];
    projects.unshift(asset);
    localStorage.setItem('ahmar_projects', JSON.stringify(projects));
  };

  // -- Views --

  const AuthView = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setTimeout(() => {
        if (name) handleLogin(name, email || 'guest@ahmar.tech');
      }, 1000);
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden font-mono">
        {/* Hacker Background */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black"></div>
        
        <div className="w-full max-w-md bg-black/80 backdrop-blur-md rounded-xl border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.15)] p-8 relative z-10 animate-fade-in-up">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-green-500 mb-2 tracking-tighter" style={{textShadow: '0 0 10px rgba(34,197,94,0.8)'}}>AHMAR TECH</h1>
            <p className="text-green-700 font-bold tracking-widest text-xs uppercase typing-effect border-r-2 border-green-500 pr-1 inline-block animate-blink">System Access Portal</p>
          </div>
          
          <div className="flex p-1 bg-green-900/20 rounded-lg mb-6 border border-green-500/20">
            <button onClick={()=>setIsLogin(true)} className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${isLogin ? 'bg-green-600 text-black shadow-lg' : 'text-green-600 hover:bg-green-900/30'}`}>Login</button>
            <button onClick={()=>setIsLogin(false)} className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${!isLogin ? 'bg-green-600 text-black shadow-lg' : 'text-green-600 hover:bg-green-900/30'}`}>Sign Up</button>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-green-500 uppercase tracking-wider mb-1.5 ml-1">Identity Name</label>
              <input 
                value={name} onChange={e => setName(e.target.value)}
                className="w-full px-5 py-3 bg-black border border-green-800 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none transition-all font-mono text-green-400 placeholder-green-900/50"
                placeholder="ENTER USERNAME"
                required
              />
            </div>
            {!isLogin && (
              <div className="animate-fade-in">
                <label className="block text-xs font-bold text-green-500 uppercase tracking-wider mb-1.5 ml-1">Email Protocol</label>
                <input 
                  type="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-5 py-3 bg-black border border-green-800 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none transition-all font-mono text-green-400 placeholder-green-900/50"
                  placeholder="USER@AHMAR.TECH"
                />
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-black font-bold py-3.5 rounded-lg transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(34,197,94,0.4)] flex items-center justify-center uppercase tracking-widest border border-green-400">
              {loading ? (
                <span className="animate-pulse">Authenticating...</span>
              ) : (isLogin ? 'Initialize' : 'Register Unit')}
            </button>
          </form>
          
          <div className="mt-6 flex justify-between text-[10px] text-green-800 font-mono uppercase">
            <span>Ver: 2.5.0</span>
            <span>Secured by Gemini</span>
          </div>
        </div>
      </div>
    );
  };

  const Dashboard = () => (
    <div className="max-w-7xl mx-auto p-6 lg:p-10 relative z-10">
       <div className="flex justify-between items-end mb-10 border-b border-green-500/30 pb-4">
         <div>
            <h2 className="text-3xl font-bold text-white tracking-tight font-mono">COMMAND CENTER // <span className="text-green-500">{user?.name}</span></h2>
            <p className="text-green-800 mt-1 font-mono text-xs uppercase tracking-widest">Select Tool Module to Execute</p>
         </div>
         <button onClick={() => setView('projects')} className="bg-black/50 border border-green-500/50 text-green-400 px-5 py-2.5 rounded hover:bg-green-500/10 hover:text-green-300 transition-colors flex items-center gap-2 uppercase text-xs tracking-wider">
            <Layers size={18} /> Data Vault
         </button>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {TOOLS.map((tool) => {
           const Icon = 
             tool.icon === 'image' ? ImageIcon :
             tool.icon === 'camera' ? ScanFace :
             tool.icon === 'box' ? Box :
             tool.icon === 'user' ? UserIcon :
             tool.icon === 'home' ? Home :
             tool.icon === 'pen' ? PenTool :
             tool.icon === 'smile' ? Smile :
             tool.icon === 'code' ? Globe :
             tool.icon === 'shield' ? Shield :
             tool.icon === 'video' ? MonitorPlay :
             tool.icon === 'palette' ? Palette :
             tool.icon === 'crop' ? Crop :
             MessageSquare;

           return (
             <button 
               key={tool.id}
               onClick={() => setView(tool.id)}
               className="group bg-black/60 backdrop-blur-md p-6 rounded-xl border border-green-900/50 shadow-lg hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:border-green-500 transition-all duration-300 text-left flex flex-col h-full relative overflow-hidden"
             >
               <div className={`w-12 h-12 rounded bg-black border border-green-500/30 flex items-center justify-center mb-4 text-green-500 group-hover:bg-green-500 group-hover:text-black transition-colors`}>
                 <Icon size={24} />
               </div>
               <h3 className="text-lg font-bold text-gray-200 group-hover:text-green-400 transition-colors font-mono">{tool.label}</h3>
               <p className="text-xs text-gray-500 mt-2 leading-relaxed font-mono uppercase">{tool.desc}</p>
               
               {/* Tech decorative corners */}
               <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-green-500/50"></div>
               <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-green-500/50"></div>
               <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-green-500/50"></div>
               <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-green-500/50"></div>
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
      case 'ai-logo': return <AILogoMaker onBack={() => setView('dashboard')} onSave={saveProject} />;
      case 'ai-wall': return <AIWallpaperMaker onBack={() => setView('dashboard')} onSave={saveProject} />;
      case 'ai-video': return <AIVideoMaker onBack={() => setView('dashboard')} onSave={saveProject} />;
      case 'bgremover': return <BGRemover onBack={() => setView('dashboard')} onSave={saveProject} />;
      case 'camera': return <CameraCapture onBack={() => setView('dashboard')} />;
      case 'ai-char': return <AICharacterMaker onBack={() => setView('dashboard')} onSave={saveProject} />;
      case 'house': return <HouseMaker onBack={() => setView('dashboard')} onSave={saveProject} />;
      case 'baby': return <BabyAging onBack={() => setView('dashboard')} />;
      case 'assistant': return <Assistant user={user} onBack={() => setView('dashboard')} />;
      case 'builder': return <CodeBuilder onBack={() => setView('dashboard')} onSave={saveProject} />;
      case 'projects': return <ProjectGallery onBack={() => setView('dashboard')} />;
      case 'image-editor': return <ImageEditor onBack={() => setView('dashboard')} onSave={saveProject} />;
      case 'dashboard':
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen font-sans text-slate-100 bg-black relative overflow-hidden">
      
      {/* Hacker Grid Background for the App */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]"></div>

      {showIntro && user && <IntroAnimation onComplete={() => setShowIntro(false)} username={user.name} />}

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-72 bg-black/80 backdrop-blur-xl border-r border-green-900/30 fixed h-full z-20">
        <div className="p-8 border-b border-green-900/30">
           <div className="font-extrabold text-2xl text-green-500 neon-text tracking-tighter font-mono">
             AHMAR_TECH
           </div>
           <div className="text-[10px] text-green-800 uppercase tracking-widest mt-1">v2.5 // Connected</div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
           <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded transition-all font-medium font-mono text-sm uppercase tracking-wide ${view === 'dashboard' ? 'bg-green-900/20 text-green-400 border border-green-500/20' : 'text-gray-500 hover:bg-gray-900 hover:text-green-300'}`}>
             <Layout size={18} /> Dashboard
           </button>
           <button onClick={() => setView('projects')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded transition-all font-medium font-mono text-sm uppercase tracking-wide ${view === 'projects' ? 'bg-green-900/20 text-green-400 border border-green-500/20' : 'text-gray-500 hover:bg-gray-900 hover:text-green-300'}`}>
             <Layers size={18} /> Data Vault
           </button>
           
           <div className="mt-6 mb-2 px-4 text-[10px] font-bold text-green-800 uppercase tracking-widest">Modules</div>
           {TOOLS.map(t => (
             <button 
               key={t.id} 
               onClick={() => setView(t.id)}
               className={`w-full flex items-center gap-3 px-4 py-2.5 rounded transition-all text-xs font-bold font-mono uppercase ${view === t.id ? 'bg-green-900/30 text-white border-l-2 border-green-500' : 'text-gray-500 hover:bg-gray-900 hover:text-green-400'}`}
             >
               {t.label}
             </button>
           ))}
        </nav>
        <div className="p-4 border-t border-green-900/30">
          <div className="flex items-center gap-3 mb-4 px-2 p-2 bg-black rounded border border-green-900/30">
             <div className="w-8 h-8 rounded-sm bg-green-900/50 flex items-center justify-center text-green-400 font-bold border border-green-500/30">
               {user.name[0]}
             </div>
             <div className="flex-1 min-w-0">
               <div className="text-xs font-bold text-green-400 truncate font-mono">{user.name}</div>
               <div className="text-[10px] text-green-800 truncate uppercase">Admin Access</div>
             </div>
          </div>
          <button onClick={handleLogout} className="w-full py-2 px-4 bg-black border border-red-900/30 rounded text-xs font-bold font-mono text-red-500 hover:bg-red-900/20 hover:border-red-500/50 transition-colors uppercase">
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-md border-b border-green-900/30 flex items-center justify-between px-4 z-30 shadow-lg">
         <span className="font-bold text-lg text-green-500 font-mono">AHMAR_TECH</span>
         <button onClick={handleLogout} className="text-[10px] font-bold bg-green-900/20 px-3 py-1.5 rounded border border-green-500/30 text-green-400 uppercase">Exit</button>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 pt-20 md:pt-0 min-h-screen transition-all relative z-10">
        <div className="h-full">
           {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;