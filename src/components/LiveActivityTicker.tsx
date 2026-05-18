import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ShoppingBag, 
  User, 
  Activity, 
  Zap, 
  Heart, 
  Thermometer, 
  Brain, 
  Wind, 
  Waves, 
  Bell,
  X
} from 'lucide-react';
import { deviceSyncService } from '../services/deviceSyncService';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

interface ActivityEvent {
  id: string;
  type: 'sale' | 'manifestation' | 'user' | 'sync';
  text: string;
  timestamp: Date;
}

interface Biometrics {
  heartRate: number;
  stressLevel: number;
  ambientTemperature: number;
  timestamp: number;
}

const EVENT_TEMPLATES = [
  { type: 'sale', text: 'New Sacred Exchange processed in the Marketplace', icon: ShoppingBag },
  { type: 'manifestation', text: 'Autonomous Growth Engine synthesized a new neural ornament', icon: Sparkles },
  { type: 'user', text: 'A new Traveler has synchronized their Doshic blueprint', icon: User },
  { type: 'sync', text: 'Global Bio-Rhythm alignment completed for Vata season', icon: Activity },
  { type: 'sync', text: 'Neural Harmony optimized across the collective sanctuary', icon: Zap },
];

export const LiveActivityTicker = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [biometrics, setBiometrics] = useState<Biometrics | null>(null);
  const [isIotEnabled, setIsIotEnabled] = useState(false);
  const [showIntervention, setShowIntervention] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Listen for IoT toggle in profile
    const unsubscribeProfile = onSnapshot(doc(db, 'profiles', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setIsIotEnabled(docSnap.data().isIotSyncEnabled !== false);
      }
    });

    // Collective Events Simulation
    const initialEvents = Array.from({ length: 3 }, (_, i) => {
      const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
      return {
        id: Math.random().toString(36).substr(2, 9),
        type: template.type as any,
        text: template.text,
        timestamp: new Date(Date.now() - i * 1000 * 60 * 5)
      };
    });
    setEvents(initialEvents);

    const interval = setInterval(() => {
      const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
      setEvents(prev => [{
        id: Math.random().toString(36).substr(2, 9),
        type: template.type as any,
        text: template.text,
        timestamp: new Date()
      }, ...prev.slice(0, 2)]);
    }, 15000);

    return () => {
      unsubscribeProfile();
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    if (!user || !isIotEnabled) {
      setBiometrics(null);
      return;
    }

    const unsubscribeBio = deviceSyncService.subscribeToLiveBiometrics(user.uid, (data) => {
      setBiometrics(data);
      
      // Trigger intervention if stress is high
      if (data.stressLevel > 0.75) {
        setShowIntervention(true);
      } else if (data.stressLevel < 0.6) {
        setShowIntervention(false);
      }
    });

    return () => unsubscribeBio();
  }, [user, isIotEnabled]);

  if (isMinimized) {
    return (
      <motion.button
        layoutId="ticker-pnl"
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-32 right-8 z-[60] p-4 bg-white/40 backdrop-blur-xl border border-white/40 rounded-full shadow-2xl text-[#5A5A40] hover:scale-110 transition-all"
      >
        <Activity size={20} className="animate-pulse" />
      </motion.button>
    );
  }

  return (
    <motion.div 
      layoutId="ticker-pnl"
      className="fixed bottom-32 right-8 z-[60] w-full max-w-[320px] bg-white/40 dark:bg-black/20 backdrop-blur-xl rounded-[40px] border border-white/40 dark:border-white/10 shadow-2xl p-6 overflow-hidden space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A40] dark:text-[#A8D5BA]">Live Neural Stream</h4>
        </div>
        <button onClick={() => setIsMinimized(true)} className="text-[#5A5A40]/40 hover:text-[#5A5A40]">
           <X size={14} />
        </button>
      </div>

      {/* IoT Ambient Biometrics */}
      <AnimatePresence mode="popLayout">
        {isIotEnabled && biometrics && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-3 gap-3"
          >
            <div className="p-3 bg-white/60 dark:bg-white/5 rounded-2xl border border-white/20 text-center space-y-1">
              <div className="flex justify-center text-rose-500 mb-1">
                <Heart size={14} className={cn(biometrics.heartRate > 100 && "animate-ping")} />
              </div>
              <div className="text-sm font-bold text-[#5A5A40] dark:text-white leading-none">{biometrics.heartRate}</div>
              <div className="text-[8px] font-medium text-[#5A5A40]/60 uppercase tracking-widest">BPM</div>
            </div>
            
            <div className="p-3 bg-white/60 dark:bg-white/5 rounded-2xl border border-white/20 text-center space-y-1">
              <div className="flex justify-center text-amber-500 mb-1">
                <Brain size={14} />
              </div>
              <div className="text-sm font-bold text-[#5A5A40] dark:text-white leading-none">{Math.round(biometrics.stressLevel * 100)}%</div>
              <div className="text-[8px] font-medium text-[#5A5A40]/60 uppercase tracking-widest">Stress</div>
            </div>

            <div className="p-3 bg-white/60 dark:bg-white/5 rounded-2xl border border-white/20 text-center space-y-1">
              <div className="flex justify-center text-indigo-500 mb-1">
                <Thermometer size={14} />
              </div>
              <div className="text-sm font-bold text-[#5A5A40] dark:text-white leading-none">{biometrics.ambientTemperature}°</div>
              <div className="text-[8px] font-medium text-[#5A5A40]/60 uppercase tracking-widest">Amb.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intervention Suggestion */}
      <AnimatePresence>
        {showIntervention && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-3xl space-y-3"
          >
            <div className="flex items-center gap-3 text-rose-600">
               <Bell size={16} className="animate-bounce" />
               <span className="text-[10px] font-bold uppercase tracking-widest">Stress Spike Detected</span>
            </div>
            <p className="text-[11px] text-rose-900 font-serif italic leading-relaxed">
              Resonance is drifting. We suggest a grounding soundscape to stabilize your field.
            </p>
            <Link 
              to="/nourish" 
              className="flex items-center justify-center gap-2 py-2 bg-rose-500 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-rose-600 transition-all"
            >
              <Wind size={12} /> Breathe in Sanctuary
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Collective Events */}
      <div className="space-y-3 border-t border-white/20 pt-4">
        <h5 className="text-[8px] font-bold text-[#5A5A40]/40 uppercase tracking-[0.3em] mb-2 px-1">Collective Pulse</h5>
        <AnimatePresence mode="popLayout">
          {events.map((event) => {
            const Icon = EVENT_TEMPLATES.find(t => t.type === event.type)?.icon || Activity;
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                className="flex items-start gap-4 p-3 rounded-2xl bg-white/30 dark:bg-white/5 border border-white/10 group"
              >
                <div className="p-2 rounded-xl bg-white dark:bg-[#1A1A15] text-[#5A5A40] dark:text-[#A8D5BA] shadow-sm">
                  <Icon size={12} />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-[10px] leading-tight text-[#2D3436] dark:text-[#E8E8E0] font-medium italic">
                    {event.text}
                  </p>
                  <p className="text-[8px] opacity-40 uppercase tracking-widest font-bold">
                    {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {!isIotEnabled && (
        <p className="text-[9px] text-[#5A5A40]/40 text-center italic">
          Sync your sacred devices in <Link to="/profile" className="underline font-bold">Profile Settings</Link> for neural biometrics.
        </p>
      )}
    </motion.div>
  );
};
