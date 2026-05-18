import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Sparkles, Utensils, Wind, Volume2, Loader2, Target, Send, Activity, MapPin, Save, Check } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { vaultService } from '../services/vaultService';
import { useToast } from '../hooks/useToast';

import { SmartFulfillmentCard } from '../components/SmartFulfillmentCard';

const COLORS = ['#A8D5BA', '#F3A683', '#778BEB']; // Vata, Pitta, Kapha

export const QuizResultsPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [locationContext, setLocationContext] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [persona, setPersona] = useState('beginner');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [healthGoals, setHealthGoals] = useState('');
  const [refining, setRefining] = useState(false);

  const [savingVault, setSavingVault] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocationContext({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const docRef = doc(db, 'profiles', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
    };
    fetchProfile();
  }, [user]);

  if (!state?.results) {
    navigate('/quiz');
    return null;
  }

  const { results } = state;
  const data = [
    { name: 'Vata', value: results.vata },
    { name: 'Pitta', value: results.pitta },
    { name: 'Kapha', value: results.kapha },
  ];

  const dominantDosha = data.reduce((prev, current) => (prev.value > current.value) ? prev : current).name;

  useEffect(() => {
    const fetchRecs = async () => {
      setLoading(true);
      try {
        const season = 'Spring'; // Dynamic season could be added
        const recs = await geminiService.generateDoshaRecommendations(dominantDosha, persona, season, healthGoals || profile?.healthData?.healthGoals, profile?.healthData, locationContext);
        setRecommendations(recs);

        // Save to Firebase if logged in
        if (user) {
          const profileRef = doc(db, 'profiles', user.uid);
          try {
            const profileSnap = await getDoc(profileRef);
            
            const profileData: any = {
              uid: user.uid,
              email: user.email,
              dosha: dominantDosha,
              doshaPercentages: results,
              updatedAt: serverTimestamp()
            };

            // Only add immutable/fixed fields if document doesn't exist
            if (!profileSnap.exists()) {
              profileData.createdAt = serverTimestamp();
              profileData.role = 'user';
              profileData.onboardingCompleted = false;
            }

            await setDoc(profileRef, profileData, { merge: true });
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `profiles/${user.uid}`);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, [dominantDosha, persona, user, locationContext, profile]);

  const handleSpeak = () => {
    if (!recommendations) return;
    const text = `Your dominant dosha is ${dominantDosha}. ${recommendations.summary}. Modern Perspective: ${recommendations.modernPerspective}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };
  const handleSaveToVault = async () => {
    if (!user || !recommendations) return;
    setSavingVault(true);
    try {
      await vaultService.saveItem(
        user.uid,
        'prescription',
        `Ayurvedic recommendations: ${dominantDosha}`,
        {
          dosha: dominantDosha,
          results,
          recommendations,
          persona,
          healthGoals,
          timestamp: new Date().toISOString()
        },
        `https://picsum.photos/seed/${dominantDosha}-dosha/800/800`,
        `Comprehensive ${dominantDosha} balancing protocol generated on ${new Date().toLocaleDateString()}.`
      );
      toast("Recommendations saved to your Sacred Vault!", "success");
    } catch (error) {
      console.error(error);
      toast("Failed to save recommendations.", "error");
    } finally {
      setSavingVault(false);
    }
  };

   const handleRefine = async () => {
    if (!healthGoals.trim()) return;
    setRefining(true);
    try {
      const season = 'Spring';
      const recs = await geminiService.generateDoshaRecommendations(dominantDosha, persona, season, healthGoals, profile?.healthData, locationContext);
      setRecommendations(recs);
    } catch (error) {
      console.error(error);
    } finally {
      setRefining(false);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-[#5A5A40]">Your Dosha Profile</h2>
        <p className="text-xl text-[#2D3436] opacity-70 italic">A unique blend of elements that define your nature.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Chart */}
        <div className="h-[400px] bg-white p-8 rounded-3xl border border-[#D1D1C1] shadow-sm">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-[#5A5A40] text-white shadow-xl">
            <h3 className="text-2xl font-bold mb-4">Dominant Dosha: {dominantDosha}</h3>
            <p className="text-lg opacity-90 leading-relaxed">
              You are primarily {dominantDosha}. This means your constitution is influenced by the qualities of 
              {dominantDosha === 'Vata' ? ' Air and Space' : dominantDosha === 'Pitta' ? ' Fire and Water' : ' Earth and Water'}.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-[#5A5A40] uppercase tracking-wider">Persona:</span>
            <div className="flex bg-[#E8E8E0] p-1 rounded-full">
              {['beginner', 'advanced'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPersona(p)}
                  className={cn(
                    "px-6 py-2 rounded-full text-sm font-bold transition-all",
                    persona === p ? "bg-[#5A5A40] text-white" : "text-[#5A5A40]"
                  )}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-[#5A5A40]">Tailored Guidance</h3>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleSaveToVault}
              disabled={!user || savingVault}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-bold bg-[#5A5A40] text-white hover:bg-[#4A4A30] transition-all disabled:opacity-50"
            >
              {savingVault ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              Save to Vault
            </button>
            <button 
              onClick={handleSpeak}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all",
                isSpeaking ? "bg-emerald-100 text-emerald-700" : "bg-[#F5F5F0] text-[#5A5A40] hover:bg-[#E8E8E0]"
              )}
            >
              <Volume2 size={20} /> {isSpeaking ? 'Speaking...' : 'Listen to Summary'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="animate-spin text-[#5A5A40]" size={48} />
            <p className="text-[#5A5A40] italic font-serif">Calibrating Your Bio-Blueprint...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <RecCard title="Lifestyle" icon={Wind} items={recommendations?.lifestyle} color="bg-sky-50" />
              <RecCard title="Nourishment" icon={Utensils} items={recommendations?.dietary} color="bg-amber-50" />
              <RecCard title="Rasayana" icon={Sparkles} items={recommendations?.rasayana} color="bg-rose-50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {recommendations?.modernPerspective && (
                <div className="p-8 bg-indigo-50 rounded-[40px] border border-indigo-100 space-y-4">
                  <h4 className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-widest">
                    <Activity size={20} /> Modern Clinical Perspective
                  </h4>
                  <p className="text-indigo-900/80 italic leading-relaxed">{recommendations.modernPerspective}</p>
                </div>
              )}
              {recommendations?.fulfillmentActions && (
                <SmartFulfillmentCard actions={recommendations.fulfillmentActions} />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {recommendations?.regionalPerspectives?.length > 0 && (
                <div className="p-8 bg-emerald-50 rounded-[40px] border border-emerald-100 space-y-4">
                  <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-widest">
                    <MapPin size={20} /> Regional Medical Wisdom
                  </h4>
                  <ul className="space-y-2">
                    {recommendations.regionalPerspectives.map((p: string, i: number) => (
                      <li key={i} className="text-emerald-900/80 text-sm flex gap-3 italic">
                        <span className="shrink-0">•</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Refinement Prompt */}
      {!loading && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto bg-white p-10 rounded-[40px] border border-[#D1D1C1] shadow-xl space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-2xl mb-2">
              <Target size={24} />
            </div>
            <h3 className="text-2xl font-bold text-[#5A5A40]">Refine Your Path</h3>
            <p className="text-sm text-[#2D3436] opacity-60 italic">Have specific health goals or current challenges? Tell us more to tailor your guidance.</p>
          </div>

          <div className="space-y-4">
            <textarea
              value={healthGoals}
              onChange={(e) => setHealthGoals(e.target.value)}
              placeholder="e.g., I'm struggling with low energy in the afternoons, or I want to improve my skin health..."
              className="w-full p-6 rounded-3xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 min-h-[120px] text-sm resize-none"
            />
            <button
              onClick={handleRefine}
              disabled={!healthGoals.trim() || refining}
              className="w-full bg-[#5A5A40] text-white py-5 rounded-2xl font-bold hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 px-6"
            >
              {refining ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Synthesizing Personalized Recalibration...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Update Recommendations
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const RecCard = ({ title, icon: Icon, items, color }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("p-8 rounded-3xl border border-[#D1D1C1] space-y-6", color)}
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#5A5A40] shadow-sm">
        <Icon size={24} />
      </div>
      <h4 className="text-xl font-bold text-[#5A5A40]">{title}</h4>
    </div>
    <ul className="space-y-3">
      {items?.map((item: string, i: number) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed text-[#2D3436]">
          <span className="text-[#5A5A40] font-bold">•</span>
          {item}
        </li>
      ))}
    </ul>
  </motion.div>
);
