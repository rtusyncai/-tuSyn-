import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Youtube, Play, Pause, RotateCcw, ExternalLink, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

interface YogaFlowAnimatorProps {
  manifest: string[];
  searchQuery: string;
  title: string;
}

const POSE_VISUALS: Record<string, any> = {
  "mountain": { shape: "M 50 20 L 50 80 M 30 40 L 50 30 L 70 40", desc: "Standing Tall" },
  "plank": { shape: "M 20 70 L 80 50 M 30 70 L 30 80 M 70 50 L 70 60", desc: "Core Strength" },
  "cobra": { shape: "M 20 80 C 40 80 60 40 80 30 M 30 80 L 30 90", desc: "Heart Opening" },
  "downward-dog": { shape: "M 20 80 L 50 20 L 80 80 M 35 50 L 25 60 M 65 50 L 75 60", desc: "Grounding Connection" },
  "warrior": { shape: "M 30 80 L 50 40 L 70 80 M 40 50 L 20 40 M 60 50 L 85 40", desc: "Inner Power" },
  "tree": { shape: "M 50 20 L 50 80 M 50 50 L 30 40 M 50 60 L 70 50 L 50 40", desc: "Focused Balance" },
  "childs-pose": { shape: "M 20 80 C 40 70 60 70 80 80 M 30 80 Q 50 60 70 80", desc: "Sacred Rest" },
};

export const YogaFlowAnimator: React.FC<YogaFlowAnimatorProps> = ({ manifest, searchQuery, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % manifest.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, manifest.length]);

  const currentPose = manifest[currentIndex]?.toLowerCase() || "mountain";
  const visual = POSE_VISUALS[currentPose] || POSE_VISUALS["mountain"];

  return (
    <div className="bg-[#F5F5F0] rounded-[40px] border border-[#D1D1C1]/50 p-8 space-y-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5A5A40] flex items-center justify-center text-white">
            <Activity size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#5A5A40] uppercase tracking-widest">{title}</h4>
            <p className="text-[10px] text-[#5A5A40]/50 font-bold uppercase tracking-tight">Neural Manifestation</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 bg-white rounded-lg text-[#5A5A40] shadow-sm hover:shadow-md transition-all"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button 
            onClick={() => setCurrentIndex(0)}
            className="p-2 bg-white rounded-lg text-[#5A5A40] shadow-sm hover:shadow-md transition-all"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="relative aspect-video bg-white rounded-[32px] border border-[#D1D1C1]/30 flex items-center justify-center overflow-hidden">
        {/* Abstract Background Grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#5A5A40 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPose}
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.2, rotate: 5 }}
            transition={{ type: "spring", damping: 12, stiffness: 100 }}
            className="relative z-10 text-center space-y-4"
          >
            <svg viewBox="0 0 100 100" className="w-32 h-32 mx-auto">
              <motion.path
                d={visual.shape}
                fill="none"
                stroke="#5A5A40"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </svg>
            <p className="text-xs font-bold text-[#5A5A40] uppercase tracking-[0.2em]">{currentPose}</p>
            <p className="text-[10px] italic text-[#5A5A40]/60">{visual.desc}</p>
          </motion.div>
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="absolute bottom-6 left-6 right-6 flex gap-1 items-center">
          {manifest.map((_, i) => (
            <div 
              key={i}
              className={cn(
                "h-1 rounded-full flex-1 transition-all duration-500",
                i === currentIndex ? "bg-[#5A5A40] scale-y-125" : "bg-[#D1D1C1]/40"
              )}
            />
          ))}
        </div>
      </div>

      <div className="pt-4 flex items-center justify-between">
        <a 
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest hover:underline"
        >
          <Youtube size={14} className="text-red-500" /> Deep Dive: Watch Tutorial <ExternalLink size={12} />
        </a>
        <div className="text-[9px] font-medium text-[#5A5A40]/40 italic">
          Neural Entrainment Enabled
        </div>
      </div>
    </div>
  );
};
