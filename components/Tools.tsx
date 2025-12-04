import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { generateChatResponse, generateCodeFromPrompt } from '../services/geminiService';
import { ChatMessage, User } from '../types';
import { ArrowLeft, Send, Download, Camera, Trash2, RefreshCw, Layers, Code, Play } from 'lucide-react';

// --- Shared Wrapper ---
export const ToolWrapper: React.FC<{ 
  title: string; 
  subtitle: string; 
  onBack: () => void; 
  children: React.ReactNode 
}> = ({ title, subtitle, onBack, children }) => (
  <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
    <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
      <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
        <ArrowLeft size={20} className="text-slate-600" />
      </button>
      <div>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
    <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50">
      {children}
    </div>
  </div>
);

// --- BG Remover ---
export const BGRemover: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setImgSrc(URL.createObjectURL(f));
  };

  const removeBg = () => {
    if (!imgSrc || !canvasRef.current) return;
    setProcessing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgSrc;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Naive algorithm: Sample corners
      const getPixel = (x: number, y: number) => {
        const i = (y * canvas.width + x) * 4;
        return [data[i], data[i+1], data[i+2]];
      };
      
      const corners = [
        getPixel(0, 0),
        getPixel(canvas.width - 1, 0),
        getPixel(0, canvas.height - 1),
        getPixel(canvas.width - 1, canvas.height - 1)
      ];
      
      // Average bg color
      const bg = corners.reduce((acc, curr) => [acc[0]+curr[0], acc[1]+curr[1], acc[2]+curr[2]], [0,0,0])
                     .map(v => v / 4);

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        const diff = Math.abs(r - bg[0]) + Math.abs(g - bg[1]) + Math.abs(b - bg[2]);
        if (diff < 100) data[i+3] = 0; // Transparent
      }
      
      ctx.putImageData(imageData, 0, 0);
      setProcessing(false);
    };
  };

  return (
    <ToolWrapper title="Background Remover" subtitle="Client-side naive removal (Beta)" onBack={onBack}>
      <div className="grid md:grid-cols-2 gap-6 h-full">
        <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
           {!imgSrc ? (
             <label className="cursor-pointer group">
               <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                 <Layers size={32} />
               </div>
               <span className="text-sm font-medium text-slate-700">Click to upload image</span>
               <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
             </label>
           ) : (
             <div className="relative w-full h-full flex flex-col">
               <img src={imgSrc} alt="Original" className="max-h-[300px] object-contain mx-auto rounded-lg shadow-sm" />
               <button onClick={() => setImgSrc(null)} className="absolute top-2 right-2 bg-white/90 p-2 rounded-full text-red-500 hover:bg-red-50">
                 <Trash2 size={16} />
               </button>
             </div>
           )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
          <canvas ref={canvasRef} className="max-w-full max-h-[300px] object-contain mb-4" />
          <div className="flex gap-3">
             <button 
               onClick={removeBg} 
               disabled={!imgSrc || processing}
               className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
             >
               <RefreshCw size={16} className={processing ? "animate-spin" : ""} />
               {processing ? 'Processing...' : 'Remove Background'}
             </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
};

// --- Camera ---
export const CameraCapture: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);
  const [capture, setCapture] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setActive(true);
      }
    } catch (e) {
      alert("Unable to access camera.");
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    setCapture(c.toDataURL('image/png'));
  };

  useEffect(() => {
    return () => {
      // Cleanup stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <ToolWrapper title="HD Camera" subtitle="Capture and save" onBack={onBack}>
      <div className="flex flex-col items-center gap-4">
        {!active && !capture && (
           <button onClick={startCamera} className="w-full py-12 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition-all">
             <Camera size={48} className="mb-2" />
             <span className="font-semibold">Start Camera Stream</span>
           </button>
        )}
        
        <div className={`relative rounded-xl overflow-hidden shadow-lg ${!active && 'hidden'}`}>
           <video ref={videoRef} className="max-w-full md:max-w-2xl bg-black" playsInline muted />
           {active && (
             <button onClick={takePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 bg-white rounded-full border-4 border-slate-200 hover:border-blue-500 transition-all flex items-center justify-center">
               <div className="w-10 h-10 bg-red-500 rounded-full"></div>
             </button>
           )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {capture && (
          <div className="mt-6 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold mb-2 text-slate-700">Last Capture</h3>
            <img src={capture} alt="Captured" className="max-w-full rounded-lg mb-3" />
            <a href={capture} download="ahmar-capture.png" className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Download size={16} /> Save Image
            </a>
          </div>
        )}
      </div>
    </ToolWrapper>
  );
};

// --- Three.js Generator ---
export const ThreeGenerator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [shape, setShape] = useState<'cube'|'sphere'|'torus'>('cube');
  const [color, setColor] = useState('#4f46e5');

  useEffect(() => {
    if (!mountRef.current) return;
    const w = mountRef.current.clientWidth;
    const h = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);

    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    mountRef.current.appendChild(renderer.domElement);

    const geometry = 
      shape === 'sphere' ? new THREE.SphereGeometry(1, 32, 32) :
      shape === 'torus' ? new THREE.TorusGeometry(0.8, 0.3, 16, 100) :
      new THREE.BoxGeometry(1.5, 1.5, 1.5);
    
    const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.2 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    camera.position.z = 4;

    let id: number;
    const animate = () => {
      id = requestAnimationFrame(animate);
      mesh.rotation.x += 0.01;
      mesh.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const nw = mountRef.current.clientWidth;
      const nh = mountRef.current.clientHeight;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(id);
      mountRef.current?.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
    };
  }, [shape, color]);

  return (
    <ToolWrapper title="3D Generator" subtitle="Real-time WebGL rendering" onBack={onBack}>
      <div className="flex flex-col md:flex-row h-full gap-4">
        <div className="w-full md:w-64 bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">Shape</label>
            <div className="flex gap-2 mt-2">
              {['cube', 'sphere', 'torus'].map((s) => (
                <button 
                  key={s} 
                  onClick={() => setShape(s as any)}
                  className={`flex-1 py-2 text-xs font-medium rounded capitalize border ${shape === s ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Color</label>
            <input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 mt-2 cursor-pointer rounded border border-slate-200" 
            />
          </div>
        </div>
        <div ref={mountRef} className="flex-1 min-h-[300px] bg-slate-200 rounded-xl overflow-hidden shadow-inner relative">
          <div className="absolute top-2 left-2 text-xs text-slate-500 bg-white/50 px-2 py-1 rounded">WebGL Canvas</div>
        </div>
      </div>
    </ToolWrapper>
  );
};

// --- Assistant ---
export const Assistant: React.FC<{ onBack: () => void; user: User }> = ({ onBack, user }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: `Hello ${user.name}! I am your AI assistant powered by Gemini. How can I help you today?`, timestamp: Date.now() }
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Prepare history for Gemini
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));
      
      const responseText = await generateChatResponse(history, userMsg.text);
      
      const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: Date.now() };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Sorry, I had trouble connecting.", timestamp: Date.now(), isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolWrapper title="AI Assistant" subtitle="Powered by Google Gemini" onBack={onBack}>
      <div className="flex flex-col h-[calc(100vh-200px)] max-h-[600px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                m.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
              } ${m.isError ? 'bg-red-50 border-red-200 text-red-600' : ''}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-200"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </ToolWrapper>
  );
};

// --- Code Builder ---
export const CodeBuilder: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [code, setCode] = useState(`<!DOCTYPE html>
<html>
<style>
  body { font-family: sans-serif; display: grid; place-items: center; height: 100vh; background: #f0f9ff; }
  .card { padding: 2rem; background: white; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
  h1 { color: #0284c7; }
</style>
<body>
  <div class="card">
    <h1>Hello World</h1>
    <p>Edit the code to change this preview.</p>
  </div>
</body>
</html>`);
  
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    updatePreview();
  }, [code]); // Auto-update when code changes

  const updatePreview = () => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(code);
        doc.close();
      }
    }
  };

  const handleGenerate = async () => {
    if(!prompt.trim()) return;
    setGenerating(true);
    try {
      const newCode = await generateCodeFromPrompt(prompt);
      setCode(newCode);
    } catch (e) {
      alert("Failed to generate code.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ToolWrapper title="Code Builder" subtitle="AI-Assisted HTML/CSS/JS Prototype" onBack={onBack}>
      <div className="grid lg:grid-cols-2 gap-4 h-[calc(100vh-180px)]">
        <div className="flex flex-col gap-4">
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
             <div className="flex gap-2">
               <input 
                 value={prompt}
                 onChange={e => setPrompt(e.target.value)}
                 placeholder="Describe what you want to build (e.g., 'A calculator with dark mode')"
                 className="flex-1 px-3 py-2 rounded-lg border border-indigo-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
               />
               <button 
                 onClick={handleGenerate}
                 disabled={generating}
                 className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
               >
                 {generating ? <RefreshCw className="animate-spin" size={14} /> : <Code size={14} />}
                 Generate
               </button>
             </div>
          </div>
          <textarea 
            value={code} 
            onChange={e => setCode(e.target.value)}
            className="flex-1 font-mono text-sm p-4 bg-slate-900 text-slate-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            spellCheck={false}
          />
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
          <div className="bg-slate-100 p-2 text-xs font-semibold text-slate-500 flex justify-between items-center border-b border-slate-200">
            <span>LIVE PREVIEW</span>
            <button onClick={updatePreview} className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <Play size={12} /> Refresh
            </button>
          </div>
          <iframe ref={iframeRef} title="preview" className="flex-1 w-full bg-white" />
        </div>
      </div>
    </ToolWrapper>
  );
};
