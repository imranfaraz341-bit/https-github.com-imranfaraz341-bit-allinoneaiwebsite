import React, { useState, useRef, useEffect } from 'react';
import { generateChatResponse, generateCodeFromPrompt, generateImage, generateVeoVideo, LiveSession } from '../services/geminiService';
import { ChatMessage, GeneratedAsset, User } from '../types';
import { ArrowLeft, Send, Download, Camera, Trash2, RefreshCw, Layers, Code, Play, User as UserIcon, Home, Mic, MicOff, Video, Palette, Shield, Loader2, Upload, Save, Sparkles, Smile, Settings, Key, Wand2, MousePointer2, Crop, Sliders, Check, X, Maximize, RotateCcw } from 'lucide-react';

// --- Shared Wrapper (Hacker Theme) ---
export const ToolWrapper: React.FC<{ 
  title: string; 
  subtitle: string; 
  onBack: () => void; 
  children: React.ReactNode 
}> = ({ title, subtitle, onBack, children }) => (
  <div className="flex flex-col h-full bg-black/80 backdrop-blur-xl rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.1)] border border-green-900/50 overflow-hidden animate-fade-in text-slate-100">
    <div className="p-4 border-b border-green-900/50 flex items-center gap-3 bg-black/50">
      <button onClick={onBack} className="p-2 hover:bg-green-900/20 rounded transition-colors text-green-400">
        <ArrowLeft size={20} />
      </button>
      <div>
        <h2 className="text-lg font-bold text-green-400 tracking-wide font-mono uppercase">{title}</h2>
        <p className="text-[10px] text-green-700 uppercase tracking-widest font-semibold">{subtitle}</p>
      </div>
    </div>
    <div className="flex-1 overflow-auto p-4 md:p-6 bg-black/20 custom-scrollbar relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  </div>
);

// --- Projects Gallery ---
export const ProjectGallery: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [projects, setProjects] = useState<GeneratedAsset[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('ahmar_projects');
    if (saved) setProjects(JSON.parse(saved));
  }, []);

  const deleteProject = (id: string) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    localStorage.setItem('ahmar_projects', JSON.stringify(updated));
  };

  return (
    <ToolWrapper title="Data Vault" subtitle="Saved Projects" onBack={onBack}>
      {projects.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-green-800 font-mono">
          <Layers size={64} className="mb-4 opacity-50" />
          <p>VAULT EMPTY. EXECUTE COMMANDS TO POPULATE.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(p => (
            <div key={p.id} className="bg-black rounded border border-green-900 overflow-hidden group hover:border-green-500 transition-colors">
              <div className="aspect-video bg-gray-900 relative overflow-hidden">
                {p.type === 'image' && <img src={p.url} alt={p.title} className="w-full h-full object-cover" />}
                {p.type === 'video' && <video src={p.url} className="w-full h-full object-cover" />}
                {p.type === 'code' && (
                  <div className="w-full h-full flex items-center justify-center bg-black text-green-500 font-mono text-[10px] p-2 overflow-hidden">
                    {p.content?.slice(0, 100)}...
                  </div>
                )}
                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                   {p.url && <a href={p.url} download className="p-2 bg-green-600 rounded text-black hover:bg-green-500"><Download size={16}/></a>}
                   <button onClick={() => deleteProject(p.id)} className="p-2 bg-red-900/80 rounded text-red-200 hover:bg-red-600"><Trash2 size={16}/></button>
                </div>
              </div>
              <div className="p-3 border-t border-green-900/30">
                <h3 className="font-bold text-green-400 truncate font-mono text-sm">{p.title}</h3>
                <p className="text-[10px] text-green-800 truncate uppercase">{new Date(p.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ToolWrapper>
  );
};

// --- Image Editor (Crop & Filters) ---
export const ImageEditor: React.FC<{ onBack: () => void; onSave: (asset: GeneratedAsset) => void }> = ({ onBack, onSave }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
    sepia: 0,
    blur: 0,
    hue: 0
  });
  const [cropMode, setCropMode] = useState(false);
  const [selection, setSelection] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setImgSrc(URL.createObjectURL(f));
  };

  const draw = () => {
    if (!imgSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgSrc;
    img.onload = () => {
      // If canvas size needs update (first load), set it
      if (canvas.width !== img.width || canvas.height !== img.height) {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      
      // Apply filters
      ctx.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) grayscale(${adjustments.grayscale}%) sepia(${adjustments.sepia}%) blur(${adjustments.blur}px) hue-rotate(${adjustments.hue}deg)`;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Draw Crop Overlay
      if (cropMode && selection) {
        ctx.filter = 'none';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        
        // Outer dark area
        ctx.fillRect(0, 0, canvas.width, selection.y); // top
        ctx.fillRect(0, selection.y + selection.h, canvas.width, canvas.height - (selection.y + selection.h)); // bottom
        ctx.fillRect(0, selection.y, selection.x, selection.h); // left
        ctx.fillRect(selection.x + selection.w, selection.y, canvas.width - (selection.x + selection.w), selection.h); // right
        
        // Selection border
        ctx.strokeStyle = '#22c55e'; // Green 500
        ctx.lineWidth = 2;
        ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);
      }
    };
  };

  useEffect(() => {
    draw();
  }, [imgSrc, adjustments, selection, cropMode]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!cropMode || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setDragStart({ x, y });
    setSelection({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cropMode || !dragStart || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    const w = currentX - dragStart.x;
    const h = currentY - dragStart.y;

    setSelection({
      x: w > 0 ? dragStart.x : currentX,
      y: h > 0 ? dragStart.y : currentY,
      w: Math.abs(w),
      h: Math.abs(h)
    });
  };

  const handleMouseUp = () => {
    setDragStart(null);
  };

  const confirmCrop = () => {
    if (!selection || !canvasRef.current || selection.w < 10 || selection.h < 10) return;
    const canvas = canvasRef.current;
    
    // Create temp canvas to extract the cropped region containing current filters
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = selection.w;
    tempCanvas.height = selection.h;
    const tCtx = tempCanvas.getContext('2d');
    
    // Draw the full processed image onto temp canvas with negative offset
    tCtx?.drawImage(canvas, -selection.x, -selection.y);
    
    const newUrl = tempCanvas.toDataURL();
    setImgSrc(newUrl);
    setCropMode(false);
    setSelection(null);
    // Reset adjustments since they are baked in
    setAdjustments({ brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, blur: 0, hue: 0 });
  };

  const applyPreset = (type: string) => {
    const def = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, blur: 0, hue: 0 };
    switch(type) {
      case 'bw': setAdjustments({...def, grayscale: 100}); break;
      case 'sepia': setAdjustments({...def, sepia: 100}); break;
      case 'cyber': setAdjustments({...def, contrast: 130, saturation: 150, hue: 180}); break;
      case 'vintage': setAdjustments({...def, sepia: 50, contrast: 120, brightness: 90}); break;
      case 'invert': setAdjustments({...def}); break; // Invert is tricky with filter string without hue-rotate 180 trick or custom invert filter
      default: setAdjustments(def);
    }
  };

  const save = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    onSave({
        id: Date.now().toString(),
        type: 'image',
        url,
        prompt: 'Edited Image',
        title: 'Edited ' + Date.now(),
        createdAt: Date.now()
    });
    alert('Image Saved to Vault');
  };

  return (
    <ToolWrapper title="Visual Manipulator" subtitle="Enhance & Crop" onBack={onBack}>
      <div className="flex flex-col h-full gap-4 max-w-6xl mx-auto">
        {!imgSrc ? (
           <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-green-900 border-dashed rounded bg-black/50 hover:bg-green-900/10 hover:border-green-500 transition-all cursor-pointer">
              <Upload className="w-12 h-12 mb-4 text-green-600" />
              <p className="text-green-500 font-mono uppercase tracking-widest">Upload Image Data</p>
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
           </label>
        ) : (
           <div className="flex flex-col lg:flex-row h-full gap-4 min-h-0">
              {/* Canvas Area */}
              <div className="flex-1 bg-black border border-green-900 rounded relative overflow-hidden flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')]">
                 <canvas 
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    className="max-w-full max-h-full object-contain"
                    style={{ cursor: cropMode ? 'crosshair' : 'default' }}
                 />
                 {cropMode && (
                   <div className="absolute top-4 left-4 bg-black/80 px-4 py-2 rounded border border-green-500 text-green-400 text-xs font-mono animate-pulse">
                      DRAG TO SELECT REGION
                   </div>
                 )}
              </div>

              {/* Controls Panel */}
              <div className="w-full lg:w-80 bg-black/80 border border-green-900/50 rounded p-4 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                 
                 {/* Actions */}
                 <div className="flex gap-2">
                    {!cropMode ? (
                      <button onClick={() => setCropMode(true)} className="flex-1 bg-green-900/20 border border-green-500/30 text-green-400 py-2 rounded font-mono text-xs uppercase hover:bg-green-500 hover:text-black transition-colors flex items-center justify-center gap-2">
                         <Crop size={14} /> Crop
                      </button>
                    ) : (
                      <div className="flex flex-1 gap-2">
                         <button onClick={confirmCrop} className="flex-1 bg-green-600 text-black py-2 rounded font-mono text-xs uppercase font-bold flex items-center justify-center gap-1">
                            <Check size={14} /> Apply
                         </button>
                         <button onClick={() => { setCropMode(false); setSelection(null); }} className="px-3 bg-red-900/20 border border-red-500/30 text-red-500 rounded hover:bg-red-900/50">
                            <X size={14} />
                         </button>
                      </div>
                    )}
                    <button onClick={() => setImgSrc(null)} className="px-3 bg-gray-800 text-gray-400 rounded hover:bg-gray-700">
                       <Trash2 size={16} />
                    </button>
                 </div>

                 {/* Filters */}
                 <div>
                    <h3 className="text-xs text-green-700 font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><Palette size={12}/> Presets</h3>
                    <div className="grid grid-cols-3 gap-2">
                       <button onClick={() => applyPreset('default')} className="p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 hover:border-green-500">Normal</button>
                       <button onClick={() => applyPreset('bw')} className="p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 hover:border-green-500">B&W</button>
                       <button onClick={() => applyPreset('sepia')} className="p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 hover:border-green-500">Sepia</button>
                       <button onClick={() => applyPreset('cyber')} className="p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-green-400 hover:border-green-500 border-green-900/30">Cyber</button>
                       <button onClick={() => applyPreset('vintage')} className="p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 hover:border-green-500">Vintage</button>
                    </div>
                 </div>

                 {/* Sliders */}
                 <div className="space-y-4">
                    <h3 className="text-xs text-green-700 font-bold uppercase tracking-widest flex items-center gap-2"><Sliders size={12}/> Adjustments</h3>
                    
                    {[
                      { label: 'Brightness', key: 'brightness', min: 0, max: 200 },
                      { label: 'Contrast', key: 'contrast', min: 0, max: 200 },
                      { label: 'Saturation', key: 'saturation', min: 0, max: 200 },
                      { label: 'Blur', key: 'blur', min: 0, max: 20 },
                      { label: 'Hue Rotate', key: 'hue', min: 0, max: 360 },
                    ].map((adj: any) => (
                       <div key={adj.key} className="space-y-1">
                          <div className="flex justify-between text-[10px] text-gray-500 font-mono uppercase">
                             <span>{adj.label}</span>
                             <span className="text-green-500">{(adjustments as any)[adj.key]}</span>
                          </div>
                          <input 
                             type="range" 
                             min={adj.min} 
                             max={adj.max} 
                             value={(adjustments as any)[adj.key]} 
                             onChange={(e) => setAdjustments({...adjustments, [adj.key]: Number(e.target.value)})}
                             className="w-full h-1 bg-gray-800 rounded appearance-none accent-green-500"
                          />
                       </div>
                    ))}
                    
                    <button onClick={() => applyPreset('default')} className="w-full py-2 flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-white border border-transparent hover:border-gray-700 rounded transition-all">
                       <RotateCcw size={12} /> Reset Adjustments
                    </button>
                 </div>

                 <button onClick={save} className="mt-auto w-full py-3 bg-blue-600 rounded text-white font-bold uppercase tracking-wider text-xs hover:bg-blue-500 shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
                    <Save size={16} /> Save to Vault
                 </button>
              </div>
           </div>
        )}
      </div>
    </ToolWrapper>
  );
};

// --- BG Remover (Updated with Magic Wand) ---
export const BGRemover: React.FC<{ onBack: () => void; onSave: (asset: GeneratedAsset) => void }> = ({ onBack, onSave }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [processing, setProcessing] = useState(false);
  const [tolerance, setTolerance] = useState(50);
  const [mode, setMode] = useState<'auto' | 'click'>('auto');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setImgSrc(URL.createObjectURL(f));
  };

  const drawImage = () => {
    if (!imgSrc || !canvasRef.current) return;
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
    }
  }

  useEffect(() => {
    drawImage();
  }, [imgSrc]);

  // Euclidean Distance for better color matching
  const colorDistance = (c1: number[], c2: number[]) => {
      return Math.sqrt(
          Math.pow(c1[0] - c2[0], 2) +
          Math.pow(c1[1] - c2[1], 2) +
          Math.pow(c1[2] - c2[2], 2)
      );
  }

  const performRemoval = (targetColor?: number[]) => {
    if (!imgSrc || !canvasRef.current) return;
    setProcessing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let bg = targetColor;

    if (!bg) {
        // Auto mode: sample corners
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
        // Average corner color
        bg = corners.reduce((acc, curr) => [acc[0]+curr[0], acc[1]+curr[1], acc[2]+curr[2]], [0,0,0]).map(v => v / 4);
    }

    for (let i = 0; i < data.length; i += 4) {
      if (data[i+3] === 0) continue; // Already transparent
      
      const r = data[i], g = data[i+1], b = data[i+2];
      const dist = colorDistance([r,g,b], bg!);
      
      if (dist < tolerance) {
          data[i+3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    setProcessing(false);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
      if (mode !== 'click' || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
          const p = ctx.getImageData(x, y, 1, 1).data;
          performRemoval([p[0], p[1], p[2]]);
      }
  };

  const save = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    onSave({
        id: Date.now().toString(),
        type: 'image',
        url,
        prompt: 'Background Removal',
        title: 'Removed BG ' + Date.now(),
        createdAt: Date.now()
    });
    alert('Saved to Projects');
  };

  const reset = () => {
      drawImage();
  }

  return (
    <ToolWrapper title="Magic Eraser" subtitle="Remove Backgrounds" onBack={onBack}>
      <div className="space-y-4 max-w-4xl mx-auto">
        <label className="flex flex-col items-center justify-center w-full h-24 border border-green-900 border-dashed rounded bg-black/50 hover:bg-green-900/10 hover:border-green-500 transition-all cursor-pointer">
            <div className="flex flex-col items-center justify-center text-green-600">
                <Upload className="w-6 h-6 mb-2" />
                <p className="text-xs font-mono uppercase">Upload Source Image</p>
            </div>
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>
        
        {imgSrc && (
          <>
            <div className="flex flex-wrap items-center gap-4 bg-black p-4 rounded border border-green-900">
              <div className="flex items-center gap-2">
                 <button onClick={() => setMode('auto')} className={`px-3 py-1.5 rounded text-xs font-mono uppercase border ${mode === 'auto' ? 'bg-green-600 text-black border-green-600' : 'text-green-600 border-green-900'}`}>
                    Auto Detect
                 </button>
                 <button onClick={() => setMode('click')} className={`px-3 py-1.5 rounded text-xs font-mono uppercase border flex items-center gap-2 ${mode === 'click' ? 'bg-green-600 text-black border-green-600' : 'text-green-600 border-green-900'}`}>
                    <MousePointer2 size={12} /> Click to Remove
                 </button>
              </div>

              <div className="flex-1 flex items-center gap-2">
                 <span className="text-xs text-green-700 font-mono uppercase whitespace-nowrap">Tolerance</span>
                 <input 
                    type="range" 
                    min="1" 
                    max="150" 
                    value={tolerance} 
                    onChange={(e) => setTolerance(Number(e.target.value))} 
                    className="w-full accent-green-500 h-1 bg-gray-800 rounded appearance-none"
                 />
                 <span className="text-xs text-green-500 font-mono w-8">{tolerance}</span>
              </div>
            </div>

            <div className="relative border border-green-900 bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] rounded overflow-hidden">
                <p className="absolute top-2 left-2 bg-black/70 text-green-500 text-[10px] px-2 py-1 rounded font-mono z-20 pointer-events-none">
                    {mode === 'click' ? 'CLICK ON COLOR TO REMOVE' : 'PREVIEW'}
                </p>
                <canvas 
                    ref={canvasRef} 
                    onClick={handleCanvasClick}
                    className={`w-full max-h-[60vh] object-contain ${mode === 'click' ? 'cursor-crosshair' : ''}`} 
                />
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => performRemoval()} disabled={processing} className="flex-1 py-3 bg-green-700 rounded text-black font-bold font-mono hover:bg-green-500 transition-all flex items-center justify-center gap-2">
                {processing ? <Loader2 className="animate-spin" /> : <><Wand2 size={16}/> AUTO REMOVE</>}
              </button>
              <button onClick={reset} className="px-4 bg-gray-800 text-gray-400 rounded hover:bg-gray-700"><RefreshCw size={18}/></button>
              <button onClick={save} className="px-5 bg-blue-600 rounded text-white hover:bg-blue-500 transition-colors"><Save size={20} /></button>
            </div>
          </>
        )}
      </div>
    </ToolWrapper>
  );
};

// --- Camera Capture ---
export const CameraCapture: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setActive(true);
      }
    } catch (e) {
      alert("Camera access denied");
    }
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `capture-${Date.now()}.png`;
      a.click();
    }
  };

  return (
    <ToolWrapper title="Optical Sensor" subtitle="HD Capture" onBack={onBack}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full max-w-2xl bg-black rounded overflow-hidden aspect-video border border-green-900 shadow-lg">
           {/* HUD Overlay */}
           <div className="absolute inset-0 border-2 border-green-500/20 m-4 pointer-events-none z-10">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-green-500/50 rounded-full flex items-center justify-center">
                 <div className="w-1 h-1 bg-green-500 rounded-full"></div>
              </div>
           </div>

           <video ref={videoRef} className="w-full h-full object-cover opacity-80" muted playsInline />
           {!active && (
             <div className="absolute inset-0 flex items-center justify-center z-20">
               <button onClick={startCamera} className="px-6 py-3 bg-green-600 rounded text-black font-bold hover:bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)] font-mono uppercase">
                 Initialize Camera
               </button>
             </div>
           )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        {active && (
          <button onClick={capture} className="w-16 h-16 rounded-full border-2 border-green-500 flex items-center justify-center bg-red-600 hover:bg-red-500 transition-all shadow-[0_0_15px_rgba(255,0,0,0.5)] active:scale-95">
             <Camera size={24} className="text-white" />
          </button>
        )}
      </div>
    </ToolWrapper>
  );
};

// --- Assistant (Live Call) ---
export const Assistant: React.FC<{ user: User; onBack: () => void }> = ({ user, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: '0', role: 'model', text: `Greetings ${user.name}. Voice Interface Ready.`, timestamp: Date.now()
  }]);
  const [input, setInput] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<LiveSession | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      stopLive();
    };
  }, []);

  const startLive = async () => {
    try {
      setIsLive(true);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioContext;
      nextStartTimeRef.current = audioContext.currentTime;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
         sampleRate: 16000,
         channelCount: 1,
         echoCancellation: true
      }});

      const session = new LiveSession();
      liveSessionRef.current = session;

      await session.connect(
        (base64Audio) => {
          const binaryString = atob(base64Audio);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
          const float32Data = new Float32Array(bytes.buffer);
          const audioBuffer = audioContext.createBuffer(1, float32Data.length, 24000);
          audioBuffer.getChannelData(0).set(float32Data);
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          const start = Math.max(audioContext.currentTime, nextStartTimeRef.current);
          source.start(start);
          nextStartTimeRef.current = start + audioBuffer.duration;
        },
        (text, isUser) => {
           console.log("Transcript:", text);
        }
      );

      const inputContext = new AudioContext({ sampleRate: 16000 });
      const source = inputContext.createMediaStreamSource(stream);
      const processor = inputContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        let binary = '';
        const bytes = new Uint8Array(pcmData.buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
        const base64 = btoa(binary);
        session.sendAudio(base64);
      };

      source.connect(processor);
      processor.connect(inputContext.destination);
      inputSourceRef.current = source as any;
      processorRef.current = processor;

    } catch (e) {
      console.error(e);
      alert("Could not start Live Call. Check permissions or API limit.");
      stopLive();
    }
  };

  const stopLive = () => {
    setIsLive(false);
    if (liveSessionRef.current) liveSessionRef.current.disconnect();
    if (processorRef.current) processorRef.current.disconnect();
    if (inputSourceRef.current) inputSourceRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
  };

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const history = messages.filter(m => m.text).map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    const responseText = await generateChatResponse(history, userMsg.text);
    
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: responseText, timestamp: Date.now() }]);
    setLoading(false);
  };

  return (
    <ToolWrapper title="Voice Assistant" subtitle="Live Uplink" onBack={onBack}>
      <div className="flex flex-col h-full gap-4 relative">
        {/* Live Overlay */}
        {isLive && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl z-20 flex flex-col items-center justify-center animate-fade-in">
             <div className="relative">
                 <div className="w-32 h-32 rounded-full border border-green-500 flex items-center justify-center animate-pulse shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                    <Mic size={48} className="text-green-500" />
                 </div>
                 {/* Waveform animation rings */}
                 <div className="absolute inset-0 rounded-full border border-green-500/50 animate-ping"></div>
             </div>
             
             <h3 className="mt-8 text-xl font-bold text-green-500 tracking-tight font-mono">CHANNEL OPEN</h3>
             <p className="text-green-800 mt-2 font-mono text-xs uppercase">Receiving Audio Input...</p>
             <button onClick={stopLive} className="mt-8 px-8 py-3 bg-red-900/20 border border-red-600 text-red-500 rounded font-bold hover:bg-red-900/40 uppercase tracking-widest font-mono">
                Terminate Link
             </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[85%] p-4 rounded border ${
                 m.role === 'user' 
                   ? 'bg-green-900/20 border-green-500 text-green-100' 
                   : 'bg-black border-green-900 text-gray-300'
               }`}>
                 <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono">{m.text}</p>
                 <span className="text-[10px] opacity-40 mt-1 block uppercase">{new Date(m.timestamp).toLocaleTimeString()}</span>
               </div>
            </div>
          ))}
          {loading && (
             <div className="flex justify-start">
               <div className="bg-black border border-green-900 p-3 rounded">
                 <Loader2 className="animate-spin text-green-500" size={16} />
               </div>
             </div>
          )}
          <div ref={scrollRef} />
        </div>
        
        <div className="flex gap-2 bg-black p-2 rounded border border-green-900">
           <button onClick={isLive ? stopLive : startLive} className={`p-3 rounded transition-colors ${isLive ? 'bg-red-600 text-white' : 'bg-green-900/20 text-green-500 hover:bg-green-900/40 border border-green-500/30'}`}>
              <Mic size={20} />
           </button>
           <input 
             value={input} 
             onChange={e => setInput(e.target.value)} 
             onKeyDown={e => e.key === 'Enter' && send()}
             placeholder="ENTER COMMAND..." 
             className="flex-1 bg-transparent px-4 py-2 text-green-400 outline-none placeholder-green-900 font-mono text-sm"
             disabled={isLive}
           />
           <button onClick={send} disabled={loading || isLive} className="p-2 bg-green-900/20 border border-green-500/30 hover:bg-green-500 hover:text-black text-green-500 rounded transition-colors">
             <Send size={20} />
           </button>
        </div>
      </div>
    </ToolWrapper>
  );
};

// --- Code Builder ---
export const CodeBuilder: React.FC<{ onBack: () => void; onSave: (asset: GeneratedAsset) => void }> = ({ onBack, onSave }) => {
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const generate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const generated = await generateCodeFromPrompt(prompt);
      setCode(generated);
      updatePreview(generated);
      onSave({
        id: Date.now().toString(),
        type: 'code',
        prompt,
        content: generated,
        title: 'Website Project ' + Date.now(),
        createdAt: Date.now()
      });
    } catch (e) {
      alert("Error generating code");
    } finally {
      setLoading(false);
    }
  };

  const updatePreview = (html: string) => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  };

  return (
    <ToolWrapper title="Code Foundry" subtitle="Text to Structure" onBack={onBack}>
      <div className="flex flex-col h-full gap-4">
         <div className="flex gap-2">
           <input 
             value={prompt} 
             onChange={e => setPrompt(e.target.value)}
             placeholder="DESCRIBE INTERFACE PARAMETERS..." 
             className="flex-1 bg-black border border-green-900 rounded px-4 py-3 text-green-400 outline-none focus:border-green-500 transition-colors font-mono text-sm placeholder-green-900"
           />
           <button onClick={generate} disabled={loading} className="px-6 bg-green-600 hover:bg-green-500 text-black font-bold rounded flex items-center gap-2 font-mono uppercase text-sm">
             {loading ? <Loader2 className="animate-spin" /> : <Code size={16} />} Compile
           </button>
         </div>
         <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
           <div className="relative bg-black rounded border border-green-900/50 overflow-hidden">
              <textarea 
                value={code} 
                onChange={e => { setCode(e.target.value); updatePreview(e.target.value); }}
                className="w-full h-full p-4 bg-transparent text-green-600 font-mono text-xs resize-none outline-none"
                placeholder="// OUTPUT STREAM..."
              />
              <div className="absolute top-2 right-2 bg-green-900/20 px-2 py-1 rounded text-[10px] text-green-400 font-mono border border-green-500/20">HTML5</div>
           </div>
           <div className="bg-white rounded overflow-hidden border border-gray-800">
             <iframe ref={iframeRef} title="Preview" className="w-full h-full" />
           </div>
         </div>
      </div>
    </ToolWrapper>
  );
};

// --- Generic Image Tool with Upload ---
const ImageGenTool: React.FC<{
  title: string;
  subtitle: string;
  defaultPrompt: string;
  placeholder: string;
  onBack: () => void;
  onSave: (asset: GeneratedAsset) => void;
  promptSuffix?: string;
  enableUpload?: boolean;
}> = ({ title, subtitle, defaultPrompt, placeholder, onBack, onSave, promptSuffix, enableUpload }) => {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const check = async () => {
      if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
         setHasKey(await (window as any).aistudio.hasSelectedApiKey());
      } else {
         setHasKey(true); 
      }
    };
    check();
  }, []);

  const selectKey = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const handleRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setRefImage(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  const generate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const fullPrompt = `${prompt} ${promptSuffix || ''}`;
      const url = await generateImage(fullPrompt, refImage || undefined);
      setImage(url);
    } catch (e: any) {
      if (JSON.stringify(e).includes("403") || JSON.stringify(e).includes("PERMISSION_DENIED")) {
           alert("Permission Denied: You need a valid paid API Key for this model.");
           setHasKey(false);
           await selectKey();
       } else {
           alert("Generation failed. " + e.message);
       }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (image) {
      onSave({
        id: Date.now().toString(),
        type: 'image',
        url: image,
        prompt,
        title: `${title} ${Date.now()}`,
        createdAt: Date.now()
      });
      alert("Saved to Vault");
    }
  };

  return (
    <ToolWrapper title={title} subtitle={subtitle} onBack={onBack}>
       <div className="max-w-3xl mx-auto space-y-6">
          
          <div className="flex items-center justify-between bg-black p-3 rounded border border-green-900">
             <div className="flex items-center gap-2 text-xs text-green-700 font-mono">
                <Key size={14} className={hasKey ? "text-green-500" : "text-amber-500"} />
                {hasKey ? "API TOKEN VERIFIED" : "TOKEN REQUIRED"}
             </div>
             {!hasKey && (
               <button onClick={selectKey} className="text-[10px] px-3 py-1.5 bg-amber-900/20 text-amber-500 border border-amber-500/20 rounded hover:bg-amber-900/40 uppercase">
                 Insert Key
               </button>
             )}
          </div>

          {enableUpload && (
            <div className="flex gap-4 items-center bg-black p-3 rounded border border-green-900">
               <label className="flex items-center gap-2 cursor-pointer bg-green-900/20 hover:bg-green-900/40 border border-green-500/30 px-4 py-2 rounded text-xs text-green-400 font-bold uppercase transition-colors">
                 <Upload size={14} /> {refImage ? "Replace Input" : "Upload Reference"}
                 <input type="file" accept="image/*" onChange={handleRefUpload} className="hidden" />
               </label>
               {refImage && <div className="text-[10px] text-green-600 font-mono">IMAGE DATA LOADED</div>}
            </div>
          )}

          <div className="flex gap-3">
             <input 
               value={prompt} 
               onChange={e => setPrompt(e.target.value)}
               placeholder={placeholder}
               className="flex-1 bg-black border border-green-900 rounded px-5 py-4 text-green-400 focus:border-green-500 outline-none transition-all font-mono text-sm placeholder-green-900"
             />
             <button 
               onClick={generate} 
               disabled={loading || !prompt}
               className="px-8 bg-green-600 text-black font-bold rounded hover:bg-green-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 uppercase tracking-wide text-sm"
             >
               {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />} Run
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {refImage && (
               <div className="aspect-square bg-black rounded border border-green-900 relative group overflow-hidden">
                 <img src={refImage} alt="Ref" className="w-full h-full object-cover opacity-50 grayscale" />
                 <div className="absolute top-2 left-2 bg-black/80 text-green-500 px-2 py-1 rounded text-[10px] font-mono border border-green-500/30">INPUT SOURCE</div>
               </div>
             )}
             <div className={`aspect-square w-full bg-black rounded-lg border-2 border-dashed border-green-900/50 flex items-center justify-center relative overflow-hidden group ${!refImage ? 'md:col-span-2 md:max-w-lg md:mx-auto' : ''}`}>
                {image ? (
                  <>
                    <img src={image} alt="Generated" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <a href={image} download className="p-4 bg-green-900/50 border border-green-500 text-green-400 rounded-full hover:bg-green-500 hover:text-black transition-colors"><Download /></a>
                      <button onClick={handleSave} className="p-4 bg-green-900/50 border border-green-500 text-green-400 rounded-full hover:bg-green-500 hover:text-black transition-colors"><Save /></button>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-green-900/50">
                      {loading ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="animate-spin mb-4 text-green-500" size={48} />
                          <p className="animate-pulse font-mono text-sm text-green-500">PROCESSING DATA STREAM...</p>
                        </div>
                      ) : (
                        <>
                          <Palette size={48} className="mx-auto mb-4 opacity-20" />
                          <p className="font-mono text-xs uppercase">Waiting for input...</p>
                        </>
                      )}
                  </div>
                )}
             </div>
          </div>
       </div>
    </ToolWrapper>
  );
};

export const AICharacterMaker = (props: any) => (
  <ImageGenTool 
    {...props} 
    title="Character Forge" 
    subtitle="3D Entity Fabrication" 
    placeholder="DESCRIBE ENTITY (E.G. CYBERPUNK SAMURAI)"
    promptSuffix=", 3d model render, blender style, unreal engine 5, detailed character design, 8k, centered, masterpiece"
    enableUpload={true}
  />
);

export const HouseMaker = (props: any) => (
  <ImageGenTool 
    {...props} 
    title="Architect AI" 
    subtitle="Structural Blueprints" 
    placeholder="DESCRIBE STRUCTURE (E.G. 3-BEDROOM APARTMENT)"
    promptSuffix=", architectural blueprint, 2d floor plan, technical drawing, high contrast, black and white lines, top down view"
    enableUpload={true}
  />
);

export const AILogoMaker = (props: any) => (
  <ImageGenTool 
    {...props} 
    title="Identity Generator" 
    subtitle="Vector Graphics" 
    placeholder="DESCRIBE BRAND (E.G. EAGLE SHIELD, SECURITY)"
    promptSuffix=", vector logo, minimalist, white background, high quality, sharp lines"
    enableUpload={true}
  />
);

export const AIWallpaperMaker = (props: any) => (
  <ImageGenTool 
    {...props} 
    title="Environment Art" 
    subtitle="4K Display" 
    placeholder="DESCRIBE SCENE (E.G. NEON CITY RAIN)"
    promptSuffix=", 4k wallpaper, detailed, aesthetic, high quality"
    enableUpload={true}
  />
);

export const BabyAging = (props: any) => (
  <ImageGenTool 
    {...props} 
    title="Regression Filter" 
    subtitle="Age Modification" 
    placeholder="DESCRIBE SUBJECT..."
    promptSuffix=", as a cute baby, pixar style, high quality"
    enableUpload={true}
  />
);

// --- Video Maker with Image Upload ---
export const AIVideoMaker: React.FC<{ onBack: () => void; onSave: (asset: GeneratedAsset) => void }> = ({ onBack, onSave }) => {
  const [prompt, setPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const check = async () => {
      if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
         setHasKey(await (window as any).aistudio.hasSelectedApiKey());
      } else {
         setHasKey(true);
      }
    };
    check();
  }, []);

  const selectKey = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const handleRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setRefImage(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  const generate = async () => {
    if (!prompt) return;
    
    if (!hasKey) {
      await selectKey();
    }

    setLoading(true);
    try {
      const url = await generateVeoVideo(prompt, refImage || undefined);
      setVideoUrl(url);
    } catch (e: any) {
      if (JSON.stringify(e).includes("Requested entity was not found") || e.message?.includes("404")) {
         alert("Permission Error: Please select a valid paid API Key for Veo.");
         setHasKey(false);
         await selectKey();
      } else {
         alert("Video generation failed. " + e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (videoUrl) {
      onSave({
        id: Date.now().toString(),
        type: 'video',
        url: videoUrl,
        prompt,
        title: `Video ${Date.now()}`,
        createdAt: Date.now()
      });
      alert("Saved to Vault");
    }
  };

  return (
    <ToolWrapper title="Video Synthesis" subtitle="Veo Engine" onBack={onBack}>
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between bg-black p-3 rounded border border-green-900">
           <div className="flex items-center gap-2 text-xs text-green-700 font-mono">
              <Key size={14} className={hasKey ? "text-green-500" : "text-amber-500"} />
              {hasKey ? "VEO ENGINE ONLINE" : "KEY REQUIRED"}
           </div>
           {!hasKey && (
             <button onClick={selectKey} className="text-[10px] px-3 py-1.5 bg-amber-900/20 text-amber-500 border border-amber-500/20 rounded hover:bg-amber-900/40 uppercase">
               Insert Key
             </button>
           )}
        </div>

        <div className="flex gap-4 items-center bg-black p-3 rounded border border-green-900">
           <label className="flex items-center gap-2 cursor-pointer bg-green-900/20 hover:bg-green-900/40 border border-green-500/30 px-4 py-2 rounded text-xs text-green-400 font-bold uppercase transition-colors">
             <Upload size={14} /> {refImage ? "Replace Input" : "Upload Frame"}
             <input type="file" accept="image/*" onChange={handleRefUpload} className="hidden" />
           </label>
           {refImage && <div className="text-[10px] text-green-600 font-mono">FRAME DATA BUFFERED</div>}
        </div>

        <div className="flex gap-3">
           <input 
             value={prompt} 
             onChange={e => setPrompt(e.target.value)}
             placeholder="DEFINE MOTION VECTORS..."
             className="flex-1 bg-black border border-green-900 rounded px-5 py-4 text-green-400 focus:border-red-500 outline-none transition-all font-mono text-sm placeholder-green-900"
           />
           <button 
             onClick={generate} 
             disabled={loading || !prompt}
             className="px-8 bg-red-900/50 border border-red-600 text-red-500 font-bold rounded hover:bg-red-900 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 uppercase tracking-widest text-sm"
           >
             {loading ? <Loader2 className="animate-spin" /> : <Video size={18} />} Render
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {refImage && (
               <div className="aspect-video bg-black rounded border border-green-900 relative">
                 <img src={refImage} alt="Ref" className="w-full h-full object-cover opacity-60 grayscale" />
                 <div className="absolute top-2 left-2 bg-black/80 text-green-500 px-2 py-1 rounded text-[10px] font-mono border border-green-500/30">INITIAL FRAME</div>
               </div>
             )}

             <div className={`aspect-video w-full bg-black rounded border-2 border-dashed border-red-900/30 flex items-center justify-center relative overflow-hidden group ${!refImage ? 'md:col-span-2' : ''}`}>
                {videoUrl ? (
                  <>
                    <video src={videoUrl} controls className="w-full h-full object-cover" />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button onClick={handleSave} className="p-3 bg-black/80 backdrop-blur rounded-full text-green-500 hover:bg-green-900/50"><Save size={20}/></button>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-red-900/30">
                      {loading ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="animate-spin mb-4 text-red-500" size={48} />
                          <p className="animate-pulse font-mono text-sm text-red-500">RENDERING FRAMES...</p>
                        </div>
                      ) : (
                        <>
                          <Play size={48} className="mx-auto mb-4 opacity-20" />
                          <p className="font-mono text-xs uppercase">Awaiting Command</p>
                        </>
                      )}
                  </div>
                )}
             </div>
        </div>
      </div>
    </ToolWrapper>
  );
};