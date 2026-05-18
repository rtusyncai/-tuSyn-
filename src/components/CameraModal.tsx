import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, RefreshCw, Sparkles, Loader2 } from 'lucide-react';

interface CameraModalProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
  title: string;
}

export const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const constraints = {
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Unable to access camera. Please check permissions.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      onCapture(base64);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
    >
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
        <h3 className="text-white font-bold tracking-widest uppercase text-sm flex items-center gap-2">
          <Camera size={18} /> {title}
        </h3>
        <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-all">
          <X size={24} />
        </button>
      </div>

      <div className="relative w-full h-full flex items-center justify-center bg-zinc-900">
        {error ? (
          <div className="text-white text-center p-8 space-y-4">
            <p className="text-rose-400">{error}</p>
            <button onClick={onClose} className="px-6 py-2 bg-white text-black rounded-full font-bold">Close</button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Viewfinder Overlays */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center border-[40px] border-black/40">
           <div className="w-64 h-64 border-2 border-white/20 rounded-3xl relative">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-lg" />
           </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-12 flex flex-col items-center gap-6 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-white/60 text-xs font-medium tracking-wide">ALIGNED WITH TERRAIN & DOSHA</p>
        <button
          onClick={handleCapture}
          disabled={!stream || isCapturing}
          className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-emerald-500 shadow-2xl active:scale-95 transition-all disabled:opacity-50"
        >
          {isCapturing ? <Loader2 className="animate-spin text-emerald-600" /> : <div className="w-16 h-16 rounded-full border-2 border-zinc-200" />}
        </button>
        <div className="flex gap-4">
           <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
             <Sparkles size={12} /> Live Scan Active
           </span>
        </div>
      </div>
    </motion.div>
  );
};
