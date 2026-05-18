import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

const questions = [
  {
    id: 'frame',
    text: 'How would you describe your physical frame?',
    options: [
      { value: 'vata', label: 'Thin, slender, bony, difficult to gain weight.' },
      { value: 'pitta', label: 'Medium build, athletic, well-proportioned.' },
      { value: 'kapha', label: 'Large build, broad shoulders, gains weight easily.' },
    ]
  },
  {
    id: 'skin',
    text: 'What is your skin type?',
    options: [
      { value: 'vata', label: 'Dry, rough, thin, cool to the touch.' },
      { value: 'pitta', label: 'Fair, sensitive, prone to redness or freckles.' },
      { value: 'kapha', label: 'Thick, oily, smooth, pale, cool.' },
    ]
  },
  {
    id: 'sleep',
    text: 'How is your sleep pattern?',
    options: [
      { value: 'vata', label: 'Light, interrupted, prone to insomnia.' },
      { value: 'pitta', label: 'Sound, moderate length, wakes up refreshed.' },
      { value: 'kapha', label: 'Deep, heavy, long, difficult to wake up.' },
    ]
  },
  {
    id: 'metabolism',
    text: 'Describe your digestion and appetite.',
    options: [
      { value: 'vata', label: 'Irregular appetite, prone to bloating/gas.' },
      { value: 'pitta', label: 'Strong appetite, intense hunger, prone to acidity.' },
      { value: 'kapha', label: 'Slow digestion, steady appetite, can skip meals.' },
    ]
  },
  {
    id: 'emotion',
    text: 'How do you react to stress?',
    options: [
      { value: 'vata', label: 'Anxiety, fear, worry, overthinking.' },
      { value: 'pitta', label: 'Irritability, anger, impatience, frustration.' },
      { value: 'kapha', label: 'Calm, withdrawn, stubborn, lethargic.' },
    ]
  }
];

export const QuizPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const handleSelect = (value: string) => {
    setAnswers({ ...answers, [questions[currentStep].id]: value });
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate results and navigate
      const counts = { vata: 0, pitta: 0, kapha: 0 };
      Object.values(answers).forEach(v => counts[v as keyof typeof counts]++);
      
      const total = questions.length;
      const results = {
        vata: (counts.vata / total) * 100,
        pitta: (counts.pitta / total) * 100,
        kapha: (counts.kapha / total) * 100,
      };
      
      navigate('/quiz/results', { state: { results } });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-[#5A5A40]">Dosha Discovery Quiz</h2>
        <p className="text-[#2D3436] opacity-70 italic">Answer honestly to reveal your unique Prakriti.</p>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-[#D1D1C1] rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-[#5A5A40]"
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white p-12 rounded-3xl border border-[#D1D1C1] shadow-xl space-y-8"
        >
          <h3 className="text-2xl font-medium text-[#5A5A40]">{questions[currentStep].text}</h3>
          
          <div className="space-y-4">
            {questions[currentStep].options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center justify-between group",
                  answers[questions[currentStep].id] === option.value 
                    ? "border-[#5A5A40] bg-[#F5F5F0]" 
                    : "border-[#D1D1C1] hover:border-[#5A5A40]/50"
                )}
              >
                <span className="text-lg">{option.label}</span>
                {answers[questions[currentStep].id] === option.value && (
                  <CheckCircle2 className="text-[#5A5A40]" size={24} />
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-between pt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2 text-[#5A5A40] disabled:opacity-30 font-medium"
            >
              <ArrowLeft size={20} /> Back
            </button>
            <button
              onClick={handleNext}
              disabled={!answers[questions[currentStep].id]}
              className="flex items-center gap-2 bg-[#5A5A40] text-white px-8 py-3 rounded-full font-bold disabled:opacity-50 hover:bg-[#4A4A30] transition-all"
            >
              {currentStep === questions.length - 1 ? 'See Results' : 'Next'} <ArrowRight size={20} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

import { cn } from '../lib/utils';
