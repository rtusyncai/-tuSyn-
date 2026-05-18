import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Heart, Target, ShieldCheck, Loader2, Save, Users, Moon, Zap, Brain, Sun, Info, ClipboardList, Utensils, Home, Wind, X } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

const questions = [
  {
    id: 'frame',
    text: 'How would you describe your physical frame?',
    icon: <Users className="text-blue-500" />,
    options: [
      { value: 'vata', label: 'Thin, slender, bony, difficult to gain weight.' },
      { value: 'pitta', label: 'Medium build, athletic, well-proportioned.' },
      { value: 'kapha', label: 'Large build, broad shoulders, gains weight easily.' },
    ]
  },
  {
    id: 'skin',
    text: 'What is your skin type?',
    icon: <Sparkles className="text-amber-400" />,
    options: [
      { value: 'vata', label: 'Dry, rough, thin, cool to the touch.' },
      { value: 'pitta', label: 'Fair, sensitive, prone to redness or freckles.' },
      { value: 'kapha', label: 'Thick, oily, smooth, pale, cool.' },
    ]
  },
  {
    id: 'sleep',
    text: 'How is your sleep pattern?',
    icon: <Moon className="text-indigo-400" />,
    options: [
      { value: 'vata', label: 'Light, interrupted, prone to insomnia.' },
      { value: 'pitta', label: 'Sound, moderate length, wakes up refreshed.' },
      { value: 'kapha', label: 'Deep, heavy, long, difficult to wake up.' },
    ]
  },
  {
    id: 'metabolism',
    text: 'Describe your digestion and appetite.',
    icon: <Zap className="text-orange-400" />,
    options: [
      { value: 'vata', label: 'Irregular appetite, prone to bloating/gas.' },
      { value: 'pitta', label: 'Strong appetite, intense hunger, prone to acidity.' },
      { value: 'kapha', label: 'Slow digestion, steady appetite, can skip meals.' },
    ]
  },
  {
    id: 'emotion',
    text: 'How do you react to stress?',
    icon: <Brain className="text-purple-400" />,
    options: [
      { value: 'vata', label: 'Anxiety, fear, worry, overthinking.' },
      { value: 'pitta', label: 'Irritability, anger, impatience, frustration.' },
      { value: 'kapha', label: 'Calm, withdrawn, stubborn, lethargic.' },
    ]
  }
];

export const OnboardingPage = () => {
  const { user, refreshAuth } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'welcome' | 'ayurveda' | 'doshas' | 'quiz_intro' | 'quiz' | 'health' | 'features' | 'finish'>('welcome');
  const [currentQuizStep, setCurrentQuizStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [healthData, setHealthData] = useState({
    medicalHistory: '',
    allergies: '',
    healthGoals: '',
    lifestyle: {
      sleep: '7-8 hours',
      diet: 'Vegetarian',
      activity: 'Moderate'
    }
  });
  const [calculatedDosha, setCalculatedDosha] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showExplainer, setShowExplainer] = useState<string | null>(null);

  const explainers = {
    ayurveda: {
      title: "The Science of Life",
      content: "Ayurveda (Ayur = Life, Veda = Knowledge) is a holistic system that balances your unique constitution. It doesn't just treat symptoms; it harmonizes your internal rhythms with the natural world."
    },
    dosha: {
      title: "What is a Dosha?",
      content: "Doshas are biological energies found throughout the human body and mind. They govern all physical and mental processes and provide every living being with a unique blueprint for health and fulfillment."
    },
    vata: {
      title: "Vata: The Wind Energy",
      content: "Vata governs movement and communication. It is composed of Space and Air. When balanced, Vata types are creative and enthusiastic. When out of balance, they may experience anxiety, insomnia, or digestive irregularities."
    },
    pitta: {
      title: "Pitta: The Fire Energy",
      content: "Pitta governs digestion and metabolism. It is composed of Fire and Water. When balanced, Pitta types are intelligent and decisive leaders. When out of balance, they may experience irritability, skin rashes, or burning sensations."
    },
    kapha: {
      title: "Kapha: The Earth Energy",
      content: "Kapha governs structure and lubrication. It is composed of Earth and Water. When balanced, Kapha types are compassionate, loyal, and steady. When out of balance, they may experience lethargy, congestion, or weight gain."
    }
  };

  const doshaMeta = {
    Vata: "The energy of movement. You likely have a creative, energetic, and light nature, but may struggle with anxiety or dryness.",
    Pitta: "The energy of transformation. You likely have a focused, ambitious, and passionate nature, but may struggle with irritability or acidity.",
    Kapha: "The energy of structure. You likely have a calm, loyal, and steady nature, but may struggle with lethargy or weight gain."
  };

  useEffect(() => {
    if (!user) return;
    const checkProfile = async () => {
      const docRef = doc(db, 'profiles', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().onboardingCompleted) {
        // User has already completed onboarding
      }
    };
    checkProfile();
  }, [user]);

  const handleQuizSelect = (value: string) => {
    setAnswers({ ...answers, [questions[currentQuizStep].id]: value });
  };

  const handleQuizNext = () => {
    if (currentQuizStep < questions.length - 1) {
      setCurrentQuizStep(currentQuizStep + 1);
    } else {
      setStep('health');
    }
  };

  const skipOnboarding = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        onboardingCompleted: true,
        updatedAt: serverTimestamp()
      });
      await refreshAuth();
      navigate('/');
    } catch (error) {
      console.error(error);
    }
  };

  const calculateAndFinish = async (skipHealth = false) => {
    if (!user) return;
    setLoading(true);
    const path = `profiles/${user.uid}`;
    try {
      const counts = { vata: 0, pitta: 0, kapha: 0 };
      Object.values(answers).forEach(v => counts[v as keyof typeof counts]++);
      
      const total = questions.length;
      const doshaPercentages = {
        vata: (counts.vata / total) * 100,
        pitta: (counts.pitta / total) * 100,
        kapha: (counts.kapha / total) * 100,
      };

      const dominantDosha = Object.entries(doshaPercentages).reduce((a, b) => a[1] > b[1] ? a : b)[0];
      const capitalizedDosha = dominantDosha.charAt(0).toUpperCase() + dominantDosha.slice(1);
      setCalculatedDosha(capitalizedDosha);

      await updateDoc(doc(db, 'profiles', user.uid), {
        dosha: capitalizedDosha,
        doshaPercentages,
        healthData: {
          ...(skipHealth ? { medicalHistory: '', allergies: '', healthGoals: '' } : healthData),
          medications: '',
          lifestyle: {
            sleep: '7-8 hours',
            diet: 'Vegetarian',
            activity: 'Moderate'
          }
        },
        onboardingCompleted: true,
        updatedAt: serverTimestamp()
      });

      await refreshAuth();
      setStep('features');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setLoading(false);
    }
  };

  const getProgress = () => {
    const steps = ['welcome', 'ayurveda', 'doshas', 'quiz_intro', 'quiz', 'health', 'features', 'finish'];
    const index = steps.indexOf(step);
    if (step === 'quiz') {
      return (index / steps.length * 100) + ((currentQuizStep + 1) / questions.length * (1 / steps.length * 100));
    }
    return ((index + 1) / steps.length) * 100;
  };

  const ExplainerModal = ({ id, onClose }: { id: string, onClose: () => void }) => {
    const data = explainers[id as keyof typeof explainers];
    if (!data) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative border border-[#D1D1C1]"
          onClick={e => e.stopPropagation()}
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-[#F5F5F0] transition-colors"
          >
            <X size={20} className="text-[#5A5A40]" />
          </button>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-amber-500">
              <Sparkles size={24} />
              <h3 className="text-2xl font-serif font-bold text-[#5A5A40]">{data.title}</h3>
            </div>
            <p className="text-lg text-[#2D3436]/70 leading-relaxed italic font-medium">
              {data.content}
            </p>
            <button
              onClick={onClose}
              className="w-full bg-[#5A5A40] text-white py-4 rounded-2xl font-bold hover:shadow-lg transition-all"
            >
              Got it
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 min-h-[85vh] flex flex-col justify-center relative">
      <AnimatePresence>
        {showExplainer && <ExplainerModal id={showExplainer} onClose={() => setShowExplainer(null)} />}
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-[#F5F5F0] z-50">
        <motion.div 
          className="h-full bg-[#5A5A40]" 
          initial={{ width: 0 }}
          animate={{ width: `${getProgress()}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Global Skip Button */}
      {step !== 'finish' && (
        <button 
          onClick={skipOnboarding}
          className="fixed top-8 right-8 text-xs font-bold text-[#5A5A40]/40 hover:text-[#5A5A40] transition-colors uppercase tracking-widest z-40 flex items-center gap-2"
        >
          Skip Introduction <ArrowRight size={14} />
        </button>
      )}

      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-12"
          >
            <div className="relative inline-block">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-8 bg-gradient-to-tr from-emerald-200 to-[#5A5A40]/20 rounded-full blur-3xl opacity-40"
              />
              <div className="relative w-32 h-32 bg-[#5A5A40] text-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <Sun size={64} className="animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-5xl md:text-6xl font-serif font-bold text-[#5A5A40] tracking-tight">Awaken Your Rhythm</h2>
              <p className="text-xl text-[#2D3436] opacity-70 leading-relaxed max-w-xl mx-auto italic font-medium">
                Welcome to ṚtuSyn. You are about to embark on a journey of biological synchronization.
              </p>
            </div>

            <button
              onClick={() => setStep('ayurveda')}
              className="bg-[#5A5A40] text-white px-16 py-6 rounded-[2.5rem] font-bold text-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-4 mx-auto group"
            >
              Begin Initialization <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {step === 'ayurveda' && (
          <motion.div
            key="ayurveda"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            <div className="bg-white p-12 rounded-[3.5rem] border border-[#D1D1C1] shadow-2xl space-y-10">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl cursor-help" onClick={() => setShowExplainer('ayurveda')}>
                  <Brain size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-serif font-bold text-[#5A5A40]">What is Ayurveda?</h3>
                  <button 
                    onClick={() => setShowExplainer('ayurveda')}
                    className="text-xs uppercase tracking-widest font-bold opacity-30 mt-1 hover:opacity-100 transition-opacity flex items-center gap-1"
                  >
                    Ancient Wisdom, Modern Sync <Info size={10} />
                  </button>
                </div>
              </div>

              <div className="space-y-6 text-lg text-[#2D3436]/80 leading-relaxed">
                <p>
                  Ayurveda, the <span className="font-bold text-[#5A5A40]">“Science of Life,”</span> is a 5,000-year-old system of natural healing that views health as a dynamic state of balance between soul, mind, and body.
                </p>
                <p>
                  In ṚtuSyn, we bridge this antiquity with modern precision, treating you as a unique biological ecosystem rather than a collection of symptoms.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: <Zap />, title: 'Bio-Energy', desc: 'Understanding biological forces.', key: 'dosha' },
                  { icon: <Heart />, title: 'Rhythm Sync', desc: 'Harmonizing internal cycles.', key: 'ayurveda' }
                ].map((item, i) => (
                  <button 
                    key={i} 
                    onClick={() => setShowExplainer(item.key)}
                    className="p-6 bg-[#F5F5F0] rounded-[2rem] border border-[#D1D1C1]/50 flex items-center gap-4 text-left hover:scale-[1.02] transition-transform"
                  >
                    <div className="text-[#5A5A40]">{item.icon}</div>
                    <div>
                      <p className="font-bold text-sm text-[#5A5A40]">{item.title}</p>
                      <p className="text-xs opacity-60 italic">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center pt-6">
                <button 
                  onClick={() => setStep('welcome')}
                  className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]/40 hover:text-[#5A5A40] transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={14} /> Revisit Welcome
                </button>
                <button
                  onClick={() => setStep('doshas')}
                  className="bg-[#5A5A40] text-white px-10 py-5 rounded-3xl font-bold hover:shadow-xl transition-all flex items-center gap-3"
                >
                  Explore the Doshas <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'doshas' && (
          <motion.div
            key="doshas"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            <div className="text-center space-y-4">
              <h3 className="text-4xl font-serif font-bold text-[#5A5A40]">The Three Essential Energies</h3>
              <p className="text-lg text-[#2D3436] opacity-60">Every traveler is a unique blend of these three forces.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Vata', color: 'bg-blue-50 text-blue-600', icon: <Wind />, energy: 'Movement', traits: 'Creative, Light, Adaptable', key: 'vata' },
                { name: 'Pitta', color: 'bg-orange-50 text-orange-600', icon: <Zap />, energy: 'Transformation', traits: 'Focused, Ambitious, Warm', key: 'pitta' },
                { name: 'Kapha', color: 'bg-emerald-50 text-emerald-600', icon: <ShieldCheck />, energy: 'Structure', traits: 'Calm, Steady, Loyal', key: 'kapha' }
              ].map((dosha, i) => (
                <motion.button
                  key={dosha.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setShowExplainer(dosha.key)}
                  className="bg-white p-8 rounded-[3rem] border border-[#D1D1C1] shadow-xl text-center space-y-6 group hover:-translate-y-2 transition-transform"
                >
                  <div className={cn("w-16 h-16 mx-auto rounded-2xl flex items-center justify-center font-bold transition-transform group-hover:rotate-12", dosha.color)}>
                    {dosha.icon}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-serif font-bold text-[#5A5A40]">{dosha.name}</h4>
                    <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40">{dosha.energy} Energy</p>
                  </div>
                  <p className="text-xs text-[#2D3436]/60 leading-relaxed font-medium italic">"{dosha.traits}"</p>
                  <div className="text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest pt-2 group-hover:text-[#5A5A40] transition-colors">
                    Learn More
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="flex justify-between items-center bg-white/50 p-6 rounded-[2.5rem] border border-[#D1D1C1]">
              <button 
                onClick={() => setStep('ayurveda')}
                className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]/40 hover:text-[#5A5A40] transition-colors"
              >
                Back to Theory
              </button>
              <button
                onClick={() => setStep('quiz_intro')}
                className="bg-[#5A5A40] text-white px-12 py-5 rounded-3xl font-bold flex items-center gap-3 hover:scale-105 transition-all shadow-lg"
              >
                Find Your Dosha <Sparkles size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'quiz_intro' && (
          <motion.div
            key="quiz_intro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="text-center space-y-10"
          >
            <div className="w-24 h-24 bg-[#5A5A40]/10 text-[#5A5A40] rounded-[2rem] flex items-center justify-center mx-auto mb-8">
              <ClipboardList size={40} />
            </div>
            <div className="space-y-4">
              <h3 className="text-4xl font-serif font-bold text-[#5A5A40]">Assessment Ritual</h3>
              <p className="text-lg text-[#2D3436] opacity-60 max-w-md mx-auto italic font-medium leading-relaxed">
                Answer these questions instinctively. Your first reaction often holds the truest reflection of your biological nature.
              </p>
            </div>
            <div className="flex flex-col items-center gap-6">
              <button
                onClick={() => setStep('quiz')}
                className="bg-[#5A5A40] text-white px-16 py-6 rounded-[2.5rem] font-bold text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
              >
                Begin Assessment
              </button>
              <button 
                onClick={() => setStep('doshas')}
                className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A40]/40 hover:text-[#5A5A40] transition-colors"
              >
                Re-examine Doshas
              </button>
            </div>
          </motion.div>
        )}

        {step === 'quiz' && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-12"
          >
            <div className="text-center space-y-3">
              <span className="inline-block px-5 py-1.5 rounded-full bg-[#5A5A40]/10 text-[#5A5A40] text-[10px] font-bold tracking-[0.2em] uppercase">
                Step {currentQuizStep + 1} of {questions.length}
              </span>
              <h3 className="text-3xl font-serif font-bold text-[#5A5A40]">{questions[currentQuizStep].text}</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {questions[currentQuizStep].options.map((option, idx) => (
                <motion.button
                  key={option.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => handleQuizSelect(option.value)}
                  className={cn(
                    "group relative overflow-hidden text-left p-8 rounded-[2.5rem] border-2 transition-all duration-300",
                    answers[questions[currentQuizStep].id] === option.value 
                      ? "border-[#5A5A40] bg-[#5A5A40]/5 translate-x-2 shadow-lg shadow-[#5A5A40]/5" 
                      : "border-[#D1D1C1]/50 hover:border-[#5A5A40]/40 hover:bg-[#F5F5F0]/50"
                  )}
                >
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                      answers[questions[currentQuizStep].id] === option.value 
                        ? "bg-[#5A5A40] text-white scale-110" 
                        : "bg-white border border-[#D1D1C1]/50 shadow-inner opacity-70 group-hover:opacity-100"
                    )}>
                      {questions[currentQuizStep].icon}
                    </div>
                    <span className={cn(
                      "text-lg font-bold transition-all",
                      answers[questions[currentQuizStep].id] === option.value ? "text-[#5A5A40]" : "text-[#2D3436] opacity-70 group-hover:opacity-100"
                    )}>
                      {option.label}
                    </span>
                  </div>
                  {answers[questions[currentQuizStep].id] === option.value && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[#5A5A40]">
                      <CheckCircle2 size={24} />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-10">
              <button
                onClick={() => currentQuizStep > 0 ? setCurrentQuizStep(currentQuizStep - 1) : setStep('quiz_intro')}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#5A5A40]/40 hover:text-[#5A5A40] transition-colors"
              >
                <ArrowLeft size={16} /> Previous Question
              </button>
              <button
                onClick={handleQuizNext}
                disabled={!answers[questions[currentQuizStep].id]}
                className="bg-[#5A5A40] text-white px-12 py-5 rounded-[2rem] font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-2xl transition-all shadow-xl flex items-center gap-3"
              >
                {currentQuizStep === questions.length - 1 ? 'Analyze Biology' : 'Continue Integration'} <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'health' && (
          <motion.div
            key="health"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="space-y-12"
          >
            <div className="text-center space-y-3">
              <h3 className="text-4xl font-serif font-bold text-[#5A5A40]">Clinical Context</h3>
              <p className="text-lg text-[#2D3436] opacity-60 max-w-md mx-auto italic font-medium">Refining AIveda's precision for your journey.</p>
            </div>

            <div className="bg-white p-12 rounded-[4rem] border border-[#D1D1C1] shadow-2xl space-y-10">
              <div className="space-y-8">
                {[
                  { id: 'medicalHistory', label: 'Past Health Rituals', icon: <Heart size={20} className="text-rose-400" />, placeholder: 'Known conditions or past surgeries?' },
                  { id: 'allergies', label: 'Biological Sensitivities', icon: <ShieldCheck size={20} className="text-amber-400" />, placeholder: 'Environmental, food, or chemical?' },
                  { id: 'healthGoals', label: 'Wellness Vision', icon: <Target size={20} className="text-emerald-400" />, placeholder: 'What do you hope to manifest here?' }
                ].map((field) => (
                  <div key={field.id} className="space-y-4">
                    <label className="flex items-center gap-3 text-sm font-bold text-[#5A5A40] uppercase tracking-widest opacity-60">
                      {field.icon} {field.label}
                    </label>
                    <textarea
                      value={healthData[field.id as keyof typeof healthData] as string}
                      onChange={(e) => setHealthData({ ...healthData, [field.id]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full p-6 h-32 bg-[#F5F5F0]/50 rounded-[2.5rem] border border-[#D1D1C1] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#5A5A40]/5 transition-all text-base italic shadow-inner"
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-6 pt-4 border-t border-[#D1D1C1]/30">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setStep('quiz')}
                    className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]/40 hover:text-[#5A5A40] transition-colors"
                  >
                    Back to Assessment
                  </button>
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => calculateAndFinish(true)}
                      className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]/40 hover:text-rose-500 transition-colors"
                    >
                      Skip Privacy Fields
                    </button>
                    <button
                      onClick={() => calculateAndFinish(false)}
                      disabled={loading}
                      className="bg-[#5A5A40] text-white px-12 py-5 rounded-3xl font-bold hover:-translate-y-1 transition-all shadow-xl flex items-center gap-3"
                    >
                      {loading ? <Loader2 className="animate-spin" size={22} /> : <Save size={22} />}
                      Synchronize Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'features' && (
          <motion.div
            key="features"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="space-y-12"
          >
            <div className="text-center space-y-4">
              <h3 className="text-4xl font-serif font-bold text-[#5A5A40]">Your New Ecosystem</h3>
              <p className="text-lg text-[#2D3436] opacity-60 max-w-md mx-auto italic font-medium leading-relaxed">
                The sanctuary is organized into three core biological hubs, each tuned to your Dosha.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {[
                { name: 'Nourish Hub', color: 'bg-orange-50 text-orange-600', icon: <Utensils />, desc: 'Biological nutrition manifests through AI-driven meal analysis and Ayurvedic recipes specialized for your profile.' },
                { name: 'Sonic Sanctuary', color: 'bg-blue-50 text-blue-600', icon: <Wind />, desc: 'Immersive frequency therapy tuned to bridge your neural rhythms with universal harmonic archetypes.' },
                { name: 'Wellness Habitat', color: 'bg-stone-50 text-stone-600', icon: <Home />, desc: 'Synchronize your physical environment with your inner state through IoT-driven habitat alignment.' }
              ].map((feature, i) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-8 rounded-[3rem] border border-[#D1D1C1] shadow-xl flex gap-8 items-center group hover:scale-[1.02] transition-all"
                >
                  <div className={cn("w-20 h-20 shrink-0 rounded-[2rem] flex items-center justify-center font-bold text-3xl shadow-lg", feature.color)}>
                    {feature.icon}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold text-[#5A5A40]">{feature.name}</h4>
                    <p className="text-sm text-[#2D3436]/60 leading-relaxed font-medium italic">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              onClick={() => setStep('finish')}
              className="w-full bg-[#5A5A40] text-white py-6 rounded-[2.5rem] font-bold text-xl hover:shadow-2xl transition-all shadow-xl flex items-center justify-center gap-3 group"
            >
              Enter the Sanctuary <ArrowRight size={24} className="group-hover:translate-x-1 transition-all" />
            </button>
          </motion.div>
        )}

        {step === 'finish' && (
          <motion.div
            key="finish"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-10 py-6"
          >
            <div className="relative inline-block mb-4">
              <motion.div 
                animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute -inset-10 bg-emerald-100 rounded-full blur-[60px] opacity-60"
              />
              <div className="relative w-32 h-32 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={56} />
              </div>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-5xl font-serif font-bold text-[#5A5A40] tracking-tight text-center">Initialization Perfected</h2>
              
              <div className="bg-white/80 backdrop-blur-sm p-10 rounded-[3.5rem] border border-[#D1D1C1] shadow-2xl max-w-lg mx-auto space-y-6 relative overflow-hidden group">
                <div className="relative z-10 space-y-3">
                  <span className="inline-block px-4 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-[0.25em]">Dominant biological Archetype</span>
                  <p className="text-5xl font-serif font-bold text-[#5A5A40]">{calculatedDosha}</p>
                  <div className="h-px w-24 bg-[#5A5A40]/10 mx-auto" />
                  <p className="text-sm text-[#2D3436]/70 leading-relaxed font-medium italic">
                    {calculatedDosha ? doshaMeta[calculatedDosha as keyof typeof doshaMeta] : ""}
                  </p>
                </div>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#5A5A40]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              </div>
              
              <p className="text-lg text-[#2D3436] opacity-60 leading-relaxed max-w-sm mx-auto font-medium italic">
                Your biological identity is now harmonized within the Neural Bridge.
              </p>
            </div>

            <button
              onClick={() => navigate('/')}
              className="bg-[#5A5A40] text-white px-20 py-6 rounded-[2.5rem] font-bold text-xl hover:shadow-2xl hover:-translate-y-1 transition-all mx-auto active:scale-95 shadow-xl"
            >
              Enter Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper Footer */}
      <div className="mt-20 pt-8 border-t border-[#D1D1C1]/20 text-center space-y-4">
        <p className="text-[10px] text-[#2D3436]/30 uppercase tracking-[0.3em] font-bold">ṚtuSyn Sanctuary Ritual • Clinical Initialization v4.0</p>
      </div>
    </div>
  );
};
