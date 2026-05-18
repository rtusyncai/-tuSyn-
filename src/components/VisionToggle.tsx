import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Box, Camera, Glasses, X } from 'lucide-react';
import { useVision, VisionMode } from '../hooks/useVision';
import { cn } from '../lib/utils';

export const VisionToggle: React.FC = () => {
  const { mode, setMode } = useVision();
  const [isOpen, setIsOpen] = React.useState(false);

  const modes: { id: VisionMode, name: string, icon: any, desc: string }[] = [
    { id: 'standard', name: 'Mortal View', icon: Eye, desc: 'Standard 2D Interface' },
    { id: 'glasses', name: 'AyurLens HUD', icon: Glasses, desc: 'Smart AI Glasses Overlay' },
    { id: 'ar', name: 'Etheric Vision', icon: Camera, desc: 'Project into physical space' },
    { id: 'vr', name: 'Sanctuary View', icon: Box, desc: 'Immersive Sanctuary Hub' },
  ];

  return (
    <div className="fixed bottom-24 right-8 z-[100] flex flex-col items-end gap-4 pointer-events-auto">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="flex flex-col gap-3 mb-2"
          >
            {modes.filter(m => m.id !== mode).map((targetMode) => (
              <button
                key={targetMode.id}
                onClick={() => {
                  setMode(targetMode.id);
                  setIsOpen(false);
                }}
                className="group flex items-center gap-3 bg-white/80 dark:bg-[#252520]/80 backdrop-blur-xl p-3 rounded-2xl shadow-xl border border-white/20 dark:border-white/10 hover:scale-105 transition-all"
              >
                <div className="text-right">
                  <div className="text-[10px] font-bold text-[#5A5A40] dark:text-[#A8D5BA] uppercase tracking-widest">{targetMode.name}</div>
                  <div className="text-[8px] opacity-40 whitespace-nowrap">{targetMode.desc}</div>
                </div>
                <div className="w-10 h-10 bg-[#5A5A40] dark:bg-[#A8D5BA] rounded-xl flex items-center justify-center text-white dark:text-[#1A1A15]">
                  <targetMode.icon size={20} />
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500 group relative",
          isOpen ? "bg-red-500 rotate-90" : "bg-[#5A5A40] dark:bg-[#A8D5BA]"
        )}
      >
        <div className="absolute inset-0 bg-current opacity-20 rounded-inherit animate-ping group-hover:block hidden" />
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90 }} animate={{ rotate: 0 }}>
              <X size={24} className="text-white dark:text-black" />
            </motion.div>
          ) : (
            <motion.div key="icon" initial={{ scale: 0 }} animate={{ scale: 1 }}>
              {mode === 'standard' && <Eye size={24} className="text-white dark:text-[#1A1A15]" />}
              {mode === 'ar' && <Camera size={24} className="text-white dark:text-[#1A1A15]" />}
              {mode === 'vr' && <Glasses size={24} className="text-white dark:text-[#1A1A15]" />}
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
};
