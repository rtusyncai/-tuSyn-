import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Utensils, Target, Send, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../hooks/useToast';

export interface FulfillmentActions {
  type: 'kitchen' | 'marketplace';
  title: string;
  description: string;
  items: string[];
  rationale: string;
}

interface SmartFulfillmentCardProps {
  actions: FulfillmentActions;
  className?: string;
}

export const SmartFulfillmentCard: React.FC<SmartFulfillmentCardProps> = ({ actions, className }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-8 rounded-[40px] border relative overflow-hidden group transition-all",
        actions.type === 'kitchen' 
          ? "bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30" 
          : "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30",
        className
      )}
    >
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
        {actions.type === 'kitchen' ? <Utensils size={100} /> : <Target size={100} />}
      </div>
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <h4 className={cn(
            "flex items-center gap-2 text-xs font-bold uppercase tracking-widest",
            actions.type === 'kitchen' ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"
          )}>
            {actions.type === 'kitchen' ? <Utensils size={20} /> : <Activity size={20} />}
            Smart Fulfillment: {actions.type === 'kitchen' ? 'Kitchen Auto-Order' : 'Marketplace Linkage'}
          </h4>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/50 dark:bg-black/20 rounded-full border border-current/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-tighter opacity-60 dark:text-white">Sensed Location</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <h5 className="text-xl font-bold text-[#5A5A40] dark:text-[#A8D5BA]">{actions.title}</h5>
          <p className="text-sm opacity-70 italic leading-relaxed dark:text-[#E8E8E0]/70">"{actions.description}"</p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {actions.items.map((item, i) => (
              <span key={i} className="px-4 py-2 bg-white dark:bg-[#1A1A15] rounded-xl text-xs font-medium shadow-sm border border-black/5 dark:border-white/5 dark:text-[#E8E8E0]">
                {item}
              </span>
            ))}
          </div>
          <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest dark:text-[#E8E8E0]/40">
            Rationale: {actions.rationale}
          </p>
        </div>

        <button 
          onClick={() => actions.type === 'kitchen' ? toast("Kitchen automation sequence initiated.", "success") : navigate('/marketplace')}
          className={cn(
            "w-full py-4 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2",
            actions.type === 'kitchen' 
              ? "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600" 
              : "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
          )}
        >
          {actions.type === 'kitchen' ? 'Initialize Kitchen Sync' : 'Access Marketplace'}
          <Send size={16} />
        </button>
      </div>
    </motion.div>
  );
};
