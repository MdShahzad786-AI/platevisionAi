import React, { useState, useRef } from 'react';
import { Upload, Camera, Search, Car, History, BarChart3, AlertCircle, Loader2, PlayCircle, Image as ImageIcon } from 'lucide-react';
import { analyzeMedia } from './services/geminiService';
import { ScanResult, AppState, DetectedPlate } from './types';
import { ScanStats } from './components/ScanStats';
import { CameraCapture } from './components/CameraCapture';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [currentMedia, setCurrentMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'history'>('scan');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        processMedia(base64String, file.type, isVideo ? 'video' : 'image');
      };
      reader.readAsDataURL(file);
    }
  };

  const processMedia = async (base64: string, mimeType: string, type: 'image' | 'video') => {
    setAppState(AppState.SCANNING);
    setCurrentMedia(base64);
    setMediaType(type);
    setErrorMsg(null);
    setCurrentResult(null);

    try {
      const analysis = await analyzeMedia(base64, mimeType);
      
      const detections: DetectedPlate[] = analysis.detections.map(d => ({
        plateNumber: d.plate_number,
        vehicleType: d.vehicle_type,
        region: d.region_guess,
        confidence: d.confidence_score,
        color: d.vehicle_color,
        box_2d: d.box_2d
      }));

      const newResult: ScanResult = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        mediaUrl: base64,
        mediaType: type,
        detections: detections
      };

      setCurrentResult(newResult);
      setHistory(prev => [newResult, ...prev]);
      setAppState(AppState.SUCCESS);
    } catch (err) {
      console.error(err);
      setAppState(AppState.ERROR);
      setErrorMsg("Failed to detect plates. Please ensure media is clear and supported.");
    }
  };

  const resetScan = () => {
    setAppState(AppState.IDLE);
    setCurrentMedia(null);
    setCurrentResult(null);
    setErrorMsg(null);
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Helper to render bounding boxes for images
  const renderBoundingBoxes = () => {
    if (appState !== AppState.SUCCESS || !currentResult || mediaType === 'video') return null;

    return currentResult.detections.map((det, idx) => {
      if (!det.box_2d) return null;
      // box_2d is [ymin, xmin, ymax, xmax] on 0-1000 scale
      const [ymin, xmin, ymax, xmax] = det.box_2d;
      const top = (ymin / 1000) * 100;
      const left = (xmin / 1000) * 100;
      const height = ((ymax - ymin) / 1000) * 100;
      const width = ((xmax - xmin) / 1000) * 100;

      return (
        <div
          key={idx}
          className="absolute border-2 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] z-20 group cursor-pointer hover:bg-green-500/10 transition-colors"
          style={{ top: `${top}%`, left: `${left}%`, width: `${width}%`, height: `${height}%` }}
        >
          <div className="absolute -top-6 left-0 bg-green-500 text-black text-[10px] font-bold px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {det.plateNumber}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Search className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              Plate<span className="text-blue-500">Vision</span>
            </span>
          </div>
          <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('scan')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'scan' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Scanner
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'history' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {activeTab === 'scan' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Input Area */}
            <div className="lg:col-span-8 space-y-6">
              <div className={`
                relative group rounded-2xl overflow-hidden border-2 border-dashed transition-all min-h-[400px] flex flex-col items-center justify-center
                ${appState === AppState.IDLE ? 'border-slate-700 bg-slate-900/50 hover:bg-slate-900 hover:border-blue-500/50' : 'border-slate-800 bg-black'}
              `}>
                
                {currentMedia ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-black">
                    {mediaType === 'video' ? (
                       <video src={currentMedia} controls className="max-w-full max-h-[600px]" />
                    ) : (
                       <div className="relative w-full h-full">
                         <img src={currentMedia} alt="Analysis Target" className="w-full h-full object-contain" />
                         {renderBoundingBoxes()}
                       </div>
                    )}
                    
                    {appState === AppState.SCANNING && (
                       <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                          <div className="flex flex-col items-center p-6 bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                            <p className="font-mono text-blue-200 text-sm tracking-wider animate-pulse">
                              {mediaType === 'video' ? 'ANALYZING VIDEO FRAMES...' : 'DETECTING PLATES...'}
                            </p>
                            <p className="text-xs text-slate-500 mt-2">Powered by Gemini Vision</p>
                          </div>
                       </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Car className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Upload Media</h3>
                    <p className="text-slate-400 max-w-xs mx-auto mb-8">
                      Upload an image or video file to detect license plates automatically.
                    </p>
                    
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition shadow-lg shadow-blue-900/20"
                      >
                        <Upload size={18} />
                        Upload File
                      </button>
                      <button
                        onClick={() => setIsCameraOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition border border-slate-700"
                      >
                        <Camera size={18} />
                        Camera
                      </button>
                    </div>
                    <p className="mt-4 text-xs text-slate-600">Supports .JPG, .PNG, .MP4, .MOV</p>
                  </div>
                )}
                
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                />
              </div>

              {/* Status Messages */}
              {appState === AppState.ERROR && errorMsg && (
                <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-xl flex items-start gap-3 text-red-200">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              )}
            </div>

            {/* Right Column: Results */}
            <div className="lg:col-span-4 flex flex-col h-[calc(100vh-8rem)] sticky top-24">
              {currentResult ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col h-full overflow-hidden">
                   <div className="flex items-center justify-between mb-4 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-mono text-green-400 uppercase tracking-widest">
                          {currentResult.detections.length} Plates Found
                        </span>
                      </div>
                      <button onClick={resetScan} className="text-xs text-slate-400 hover:text-white underline">Clear</button>
                   </div>
                   
                   <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                     {currentResult.detections.map((det, idx) => (
                       <div key={idx} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 hover:border-blue-500/30 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div className="bg-white text-black px-3 py-1 rounded border-2 border-slate-300 shadow-sm">
                               <span className="font-mono text-xl font-bold tracking-wider block">{det.plateNumber}</span>
                            </div>
                            <span className="text-xs font-bold text-green-400 bg-green-900/20 px-2 py-1 rounded">{det.confidence}%</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-y-2 text-sm">
                             <div>
                               <p className="text-[10px] text-slate-500 uppercase font-bold">Type</p>
                               <p className="text-slate-200">{det.vehicleType}</p>
                             </div>
                             <div>
                               <p className="text-[10px] text-slate-500 uppercase font-bold">Color</p>
                               <p className="text-slate-200">{det.color}</p>
                             </div>
                             <div className="col-span-2">
                               <p className="text-[10px] text-slate-500 uppercase font-bold">Region</p>
                               <p className="text-slate-200 truncate">{det.region || "Unknown"}</p>
                             </div>
                          </div>
                       </div>
                     ))}
                     
                     {currentResult.detections.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No license plates detected in this media.</p>
                        </div>
                     )}
                   </div>
                   
                   <div className="pt-4 mt-auto border-t border-slate-800 shrink-0">
                      <button
                        onClick={resetScan}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition shadow-lg shadow-blue-900/20"
                      >
                        Scan New Media
                      </button>
                   </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900/30 rounded-2xl border border-slate-800/50 border-dashed text-slate-500">
                  <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                     <BarChart3 className="w-8 h-8 opacity-50" />
                  </div>
                  <h4 className="text-lg font-medium text-slate-400 mb-2">Ready to Analyze</h4>
                  <p className="text-sm max-w-[200px]">Upload an image or video to see detection results here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-white mb-6">Scan Dashboard</h2>
            
            <ScanStats history={history} />

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-500" />
                  Recent Scans
                </h3>
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">{history.length} records</span>
              </div>
              
              {history.length > 0 ? (
                <div className="divide-y divide-slate-800">
                  {history.map((scan) => (
                    <div key={scan.id} className="p-4 hover:bg-slate-800/50 transition flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="w-full sm:w-24 h-24 sm:h-20 bg-slate-950 rounded-lg overflow-hidden shrink-0 border border-slate-800 relative">
                        {scan.mediaType === 'video' ? (
                           <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <PlayCircle size={24} />
                           </div>
                        ) : (
                           <img src={scan.mediaUrl} alt="Thumb" className="w-full h-full object-cover opacity-80" />
                        )}
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] font-bold text-white uppercase backdrop-blur-sm">
                           {scan.mediaType}
                        </div>
                      </div>
                      
                      <div className="flex-1 w-full">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-slate-500 text-sm">Found:</span>
                          <span className="text-white font-bold">{scan.detections.length} Plates</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400 text-sm">{formatTime(scan.timestamp)}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {scan.detections.slice(0, 5).map((d, i) => (
                            <span key={i} className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-blue-300">
                              {d.plateNumber}
                            </span>
                          ))}
                          {scan.detections.length > 5 && (
                             <span className="px-2 py-1 text-xs text-slate-500">+{scan.detections.length - 5} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No scan history available.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Camera Modal */}
      {isCameraOpen && (
        <CameraCapture 
          onCapture={(src) => {
            setIsCameraOpen(false);
            processMedia(src, 'image/jpeg', 'image');
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
    </div>
  );
};

export default App;