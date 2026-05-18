import React from 'react';
import { motion } from 'motion/react';
import { 
  Sun, 
  Moon, 
  Coffee, 
  Heart, 
  Activity, 
  Utensils, 
  Wind, 
  Sparkles, 
  Droplets, 
  Zap,
  ArrowRight,
  Clock,
  BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export interface Ritual {
  time: string;
  activity: string;
  desc: string;
  icon: any;
  category: 'Morning' | 'Midday' | 'Evening' | 'Night';
}

const ritualsByDosha: Record<string, Ritual[]> = {
  Vata: [
    { time: '5:00 AM - 6:00 AM', activity: 'Waking & Gentle Stretch', desc: 'Wake up before sunrise to catch the calm Vata energy. Gentle movements to ground the body.', icon: Sun, category: 'Morning' },
    { time: '7:00 AM', activity: 'Warm Oil Abhyanga', desc: 'Self-massage with warm sesame oil to soothe the nervous system and nourish dry skin.', icon: Heart, category: 'Morning' },
    { time: '12:30 PM', activity: 'Grounded Lunch', icon: Utensils, desc: 'Focus on warm, moist, cooked foods like kitchari or root vegetable stews.', category: 'Midday' },
    { time: '6:00 PM', activity: 'Restorative Meditation', icon: Wind, desc: 'A 15-minute grounding meditation to settle the wandering Vata mind.', category: 'Evening' },
    { time: '9:30 PM', activity: 'Early Rest', icon: Moon, desc: 'Dim lights and avoid screens. Aim for sleep before 10 PM to maintain stability.', category: 'Night' },
  ],
  Pitta: [
    { time: '5:30 AM - 6:30 AM', activity: 'Cooling Breathwork', desc: 'Sitali pranayama to release internal heat and calm the ambitious Pitta spirit.', icon: Wind, category: 'Morning' },
    { time: '8:00 AM', activity: 'Coconut Oil Massage', desc: 'Massage with cooling oils to prevent inflammation and soothe skin sensitivity.', icon: Droplets, category: 'Morning' },
    { time: '12:00 PM', activity: 'Cooling Lunch', icon: Utensils, desc: 'The largest meal of the day. Include bitter greens, whole grains, and sweet fruits.', category: 'Midday' },
    { time: '7:00 PM', activity: 'Moonlight Walk', icon: Moon, desc: 'A short walk under the moonlight to cool the body and mind after a productive day.', category: 'Evening' },
    { time: '10:30 PM', activity: 'Cooling Sleep', icon: Activity, desc: 'Ensure the bedroom is cool. Reflect on gratitude to ease Pitta judgment.', category: 'Night' },
  ],
  Kapha: [
    { time: '4:30 AM - 5:30 AM', activity: 'Invigorating Movement', desc: 'Early waking and brisk exercise to stimulate metabolism and clear stagnation.', icon: Zap, category: 'Morning' },
    { time: '7:30 AM', activity: 'Garshana (Dry Brushing)', desc: 'Dry silk or bristle brushing to move lymph and energize the body-mind.', icon: Sparkles, category: 'Morning' },
    { time: '1:00 PM', activity: 'Spiced Light Lunch', icon: Utensils, desc: 'Focus on light, dry, and spicy foods to balance heavy Kapha energy.', category: 'Midday' },
    { time: '5:00 PM', activity: 'Warm Herbal Tea', icon: Coffee, desc: 'Ginger or Tulsi tea to support digestion and keep the system active.', category: 'Evening' },
    { time: '10:00 PM', activity: 'Digital Detox', icon: Moon, desc: 'Total disconnection from devices to allow the mind to process the day clearly.', category: 'Night' },
  ],
  Default: [
    { time: 'Morning', activity: 'Hydrate with Warm Water', desc: 'Flush out toxins and wake up the internal organs gently.', icon: Droplets, category: 'Morning' },
    { time: 'Midday', activity: 'Mindful Eating', desc: 'Eat your largest meal without distractions to maximize nutrient absorption.', icon: Utensils, category: 'Midday' },
    { time: 'Evening', activity: 'Evening Reflection', desc: 'Briefly review your day with a lens of growth and compassion.', icon: Sun, category: 'Evening' },
    { time: 'Night', activity: 'Scheduled Rest', desc: 'Consistent sleep patterns are the foundation of Ayurvedic health.', icon: Moon, category: 'Night' },
  ]
};

interface DinacharyaRitualsProps {
  dosha: string;
}

export const DinacharyaRituals: React.FC<DinacharyaRitualsProps> = ({ dosha }) => {
  const rituals = ritualsByDosha[dosha] || ritualsByDosha.Default;

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[#5A5A40]">
            <Clock className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-[0.3em]">Dinacharya</span>
          </div>
          <h3 className="text-3xl md:text-5xl font-serif font-bold text-[#5A5A40]">Rhythms of {dosha || 'the Soul'}</h3>
          <p className="text-lg text-[#2D3436] opacity-70 italic max-w-xl">
            Aligning your daily actions with the universal cycles of nature to cultivate effortless balance.
          </p>
        </div>
        <Link 
          to="/resources" 
          className="group flex items-center gap-3 px-6 py-3 rounded-2xl bg-white border border-[#D1D1C1] text-[#5A5A40] text-sm font-bold hover:shadow-lg transition-all"
        >
          Explore Full Wisdom <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rituals.map((ritual, index) => (
          <motion.div
            key={ritual.activity}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white to-[#F5F5F0] rounded-[40px] border border-[#D1D1C1]/40 shadow-sm transition-all group-hover:shadow-xl group-hover:-translate-y-1" />
            
            <div className="relative p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#5A5A40] group-hover:scale-110 transition-transform">
                  <ritual.icon size={28} />
                </div>
                <div className="px-3 py-1 bg-[#5A5A40]/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60">
                  {ritual.category}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-widest text-[#5A5A40] opacity-50 flex items-center gap-2">
                  <Clock size={12} /> {ritual.time}
                </div>
                <h4 className="text-xl font-serif font-bold text-[#5A5A40] leading-tight">{ritual.activity}</h4>
                <p className="text-sm text-[#2D3436]/60 leading-relaxed italic line-clamp-2 group-hover:line-clamp-none transition-all">
                  {ritual.desc}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Informative Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="p-8 rounded-[40px] bg-[#5A5A40] text-white flex flex-col justify-center gap-4 shadow-xl"
        >
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
             <BookOpen size={24} />
          </div>
          <h4 className="text-2xl font-serif font-bold">Why Ritual?</h4>
          <p className="text-sm opacity-80 leading-relaxed">
            Dinacharya isn't just a schedule; it's a recalibration. By syncing your biology with the sun and moon, you reduce "Sahaj" stress and enhance "Tejas" (radiant health).
          </p>
          <Link to="/resources" className="text-xs font-bold uppercase tracking-widest hover:underline mt-2">
            Read Dinacharya Foundations
          </Link>
        </motion.div>
      </div>
    </div>
  );
};
