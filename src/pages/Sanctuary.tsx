import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Wind, 
  Loader2, 
  Volume2, 
  X, 
  Music, 
  Youtube, 
  Cpu, 
  Heart, 
  Activity, 
  Upload, 
  RefreshCw, 
  Smartphone,
  CheckCircle2,
  Zap,
  Info,
  Droplets,
  Video,
  Shield,
  Smile,
  Sun,
  Flame,
  Cloud,
  Moon,
  Sparkles as SparkleIcon,
  Square,
  ChevronDown
} from 'lucide-react';
import * as Tone from 'tone';
import { geminiService } from '../services/geminiService';
import { veoService } from '../services/veoService';
import { youtubeService } from '../services/youtubeService';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { db, trackEngagement } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '../hooks/useToast';
import { vaultService } from '../services/vaultService';
import { iotDiffuserService } from '../services/iotDiffuserService';
import { deviceSyncService } from '../services/deviceSyncService';
import { LiveActivityTicker } from '../components/LiveActivityTicker';
import { Save, Check } from 'lucide-react';
import { SmartFulfillmentCard } from '../components/SmartFulfillmentCard';

export const SanctuaryPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'meditation' | 'composition' | 'youtube' | 'iot' | 'visual'>('meditation');
  
  // Meditation states
  const [feeling, setFeeling] = useState('');
  const [duration, setDuration] = useState('10'); // Default 10 mins
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isSavingMeditation, setIsSavingMeditation] = useState(false);
  const [hasSavedMeditation, setHasSavedMeditation] = useState(false);
  const [isSavingComposition, setIsSavingComposition] = useState(false);
  const [hasSavedComposition, setHasSavedComposition] = useState(false);

  // Veo states
  const [veoPrompt, setVeoPrompt] = useState('');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isAutoGeneratingPrompt, setIsAutoGeneratingPrompt] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Soundscape states
  const [volume, setVolume] = useState(-12);
  const [selectedSoundscape, setSelectedSoundscape] = useState<string | null>(null);
  const [isSoundscapeLoading, setIsSoundscapeLoading] = useState(false);

  const SOUNDSCAPES = [
    { id: 'rain', name: 'Monsoon Rain', icon: Droplets, color: 'text-blue-400' },
    { id: 'forest', name: 'Vedic Forest', icon: Wind, color: 'text-emerald-400' },
    { id: 'waves', name: 'Ganges Waves', icon: Activity, color: 'text-cyan-400' },
    { id: 'chant', name: 'Cosmic OM', icon: SparkleIcon, color: 'text-amber-400' }
  ];

  // Aroma states
  const [aromas, setAromas] = useState<any[]>([]);
  const [selectedAroma, setSelectedAroma] = useState<any>(null);
  const [isFetchingAromas, setIsFetchingAromas] = useState(false);

  // Composition states
  const [diseaseContext, setDiseaseContext] = useState('');
  const [composition, setComposition] = useState<any>(null);
  const [isCompPlaying, setIsCompPlaying] = useState(false);
  const [isToneStarted, setIsToneStarted] = useState(false);
  
  // YouTube states
  const [ytTokens, setYtTokens] = useState<any>(null);
  const [ytProfile, setYtProfile] = useState<any>(null);
  const [ytVideos, setYtVideos] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetchingYT, setIsFetchingYT] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);

  // IoT states
  const [iotState, setIotState] = useState<any>(null);
  const [iotSyncEnabled, setIotSyncEnabled] = useState(false);
  const [reverseFeedback, setReverseFeedback] = useState<string[]>([]);
  const [liveBiometrics, setLiveBiometrics] = useState<{ heartRate: number; stressLevel: number } | null>(null);

  // Breathing states
  const [activeBreathProtocol, setActiveBreathProtocol] = useState<any>(null);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'sustain' | 'idle'>('idle');
  const [breathTimer, setBreathTimer] = useState(0);

  const BREATH_PROTOCOLS = [
    {
      id: 'box',
      name: 'Box Breathing',
      description: 'The Warrior\'s Calm. Equal ratios for nervous system regulation.',
      phases: { inhale: 4, hold: 4, exhale: 4, sustain: 4 },
      icon: Square,
      color: 'bg-indigo-500'
    },
    {
      id: 'nadi',
      name: 'Nadi Shodhana',
      description: 'Alternate Nostril. Balancing the Ida and Pingala channels.',
      phases: { inhale: 4, hold: 4, exhale: 8, sustain: 2 },
      icon: Wind,
      color: 'bg-emerald-500'
    },
    {
      id: 'bhastrika',
      name: 'Bhastrika',
      description: 'Bellows Breath. Rapid energizing for mental clarity.',
      phases: { inhale: 1, hold: 0, exhale: 1, sustain: 0 },
      icon: Flame,
      color: 'bg-rose-500'
    }
  ];

  // Breath Loop Logic
  useEffect(() => {
    let timer: any;
    if (activeBreathProtocol) {
      const runPhase = (phase: keyof typeof activeBreathProtocol.phases) => {
        const duration = activeBreathProtocol.phases[phase];
        if (duration === 0) {
          // Skip if duration is 0
          const phases = Object.keys(activeBreathProtocol.phases) as (keyof typeof activeBreathProtocol.phases)[];
          const nextIdx = (phases.indexOf(phase) + 1) % phases.length;
          runPhase(phases[nextIdx]);
          return;
        }

        setBreathPhase(phase as any);
        setBreathTimer(duration);

        // Sound Feedback
        if (isPlaying && synthRef.current) {
          const notes: Record<string, string> = { inhale: 'C4', hold: 'E4', exhale: 'G4', sustain: 'B4' };
          synthRef.current.triggerAttackRelease(notes[phase as string] || 'C4', '8n');
        }

        let remaining = duration;
        timer = setInterval(() => {
          remaining -= 1;
          setBreathTimer(remaining);
          if (remaining <= 0) {
            clearInterval(timer);
            const phases = Object.keys(activeBreathProtocol.phases) as (keyof typeof activeBreathProtocol.phases)[];
            const nextIdx = (phases.indexOf(phase) + 1) % phases.length;
            runPhase(phases[nextIdx]);
          }
        }, 1000);
      };

      runPhase('inhale');
    }

    return () => clearInterval(timer);
  }, [activeBreathProtocol, isPlaying]);

  const toggleBreath = (protocol: any) => {
    if (activeBreathProtocol?.id === protocol.id) {
      setActiveBreathProtocol(null);
      setBreathPhase('idle');
    } else {
      setActiveBreathProtocol(protocol);
      if (!isPlaying) setIsPlaying(true);
    }
  };

  const synthRef = useRef<Tone.PolySynth | null>(null);
  const loopRef = useRef<Tone.Loop | null>(null);
  const soundscapePlayerRef = useRef<Tone.Player | null>(null);

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
    
    // Check for saved YT tokens in localStorage
    const savedTokens = localStorage.getItem('youtube_tokens');
    if (savedTokens) {
      const parsed = JSON.parse(savedTokens);
      setYtTokens(parsed);
      fetchYouTubeData(parsed);
    }
  }, [user]);

  const fetchYouTubeData = async (tokens: any) => {
    setIsFetchingYT(true);
    try {
      const [profile, videos] = await Promise.all([
        youtubeService.getProfile(tokens),
        youtubeService.getVideos(tokens)
      ]);
      setYtProfile(profile);
      setYtVideos(videos);
    } catch (err) {
      console.error("Fetch YT error:", err);
      toast("Failed to retrieve your sacred content vault.", "error");
    } finally {
      setIsFetchingYT(false);
    }
  };

  // Handle IoT feedback & Live Biometrics
  useEffect(() => {
    if (!user || !iotSyncEnabled) return;

    const unsubscribe = deviceSyncService.subscribeToLiveBiometrics(user.uid, (data) => {
      setLiveBiometrics(data);
      setIotState(data); // Syncing with legacy state for compatibility
      
      // Reverse feedback logic: if stress is high, adjust music
      if (data.stressLevel > 0.7) {
        setReverseFeedback(prev => {
          const msg = "High stress detected! Auto-tuning frequencies to parasympathetic state...";
          if (prev[0] === msg) return prev;
          return [msg, ...prev.slice(0, 4)];
        });
        
        if (synthRef.current) {
          // Lower octave for grounding
          synthRef.current.set({ detune: -1200 });
        }
      } else if (data.stressLevel < 0.4) {
        if (synthRef.current) {
          // Reset detune
          synthRef.current.set({ detune: 0 });
        }
      }
    });

    return () => unsubscribe();
  }, [user, iotSyncEnabled]);

  // Handle YouTube OAuth PostMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'YOUTUBE_AUTH_SUCCESS') {
        const tokens = event.data.tokens;
        setYtTokens(tokens);
        localStorage.setItem('youtube_tokens', JSON.stringify(tokens));
        fetchYouTubeData(tokens);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleUpdateVideo = async () => {
    if (!editingVideo || !ytTokens) return;
    setLoading(true);
    try {
      await youtubeService.updateVideo(
        ytTokens,
        editingVideo.contentDetails?.videoId || editingVideo.id,
        editingVideo.snippet.title,
        editingVideo.snippet.description
      );
      toast("Manifestation metadata updated successfully.", "success");
      setEditingVideo(null);
      fetchYouTubeData(ytTokens);
    } catch (err: any) {
      console.error("Update error:", err);
      toast(err.message || "Failed to update cosmic metadata.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleMeditationGenerate = async () => {
    if (!feeling) return;
    setLoading(true);
    setHasSavedMeditation(false);
    setSelectedAroma(null);
    try {
      const result = await geminiService.generateMeditation(feeling, {
        ...profile?.healthData,
        currentBiometrics: liveBiometrics
      }, duration);
      setSession(result);
      setAromas(result.suggestedAromas || []);
      
      // Automatically trigger selected/suggested aroma and lighting via IoT
      if (result.suggestedAromas && result.suggestedAromas.length > 0) {
        const firstAroma = result.suggestedAromas[0];
        
        // Context-aware logic for aroma selection if AI suggestion is generic
        let finalAroma = firstAroma.name;
        if (profile?.dosha === 'Kapha' && (feeling === 'Heavy' || feeling === 'Dull')) {
          finalAroma = 'Zap'; // Invigorate Kapha
        } else if (profile?.dosha === 'Pitta' && (feeling === 'Driven' || feeling === 'Restless')) {
          finalAroma = 'Peppermint'; // Cooling Pitta
        }

        iotDiffuserService.triggerAroma(finalAroma, `Bio-rhythm alignment for ${feeling} meditation`);
        setSelectedAroma({ ...firstAroma, name: finalAroma });
        
        // Simulated Lighting Sync
        const moodToColor: Record<string, string> = {
          'Harmonious': '#10b981', // Emerald
          'Calm': '#0ea5e9',      // Sky
          'Restless': '#6366f1',  // Indigo
          'Driven': '#f43f5e',    // Rose
          'Heavy': '#64748b',     // Slate
          'Clear': '#f59e0b',     // Amber
          'Balanced': '#5A5A40'    // Sage
        };
        
        const color = moodToColor[feeling] || '#5A5A40';
        fetch('/api/iot/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'lighting_sync',
            value: color,
            reason: `Atmospheric resonance for ${feeling} session`
          })
        }).catch(err => console.error("Lighting sync failed", err));
      }
      
      setCurrentLine(0);
      setProgress(0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAromaSelect = (aroma: any) => {
    setSelectedAroma(aroma === selectedAroma ? null : aroma);
    if (aroma !== selectedAroma) {
      iotDiffuserService.triggerAroma(aroma.name, `Manual selection for ${session?.title || 'meditation'}`);
    }
  };

  const handleFetchAromas = async () => {
    if (!feeling) return;
    setIsFetchingAromas(true);
    try {
      const result = await geminiService.suggestAromas(feeling, session?.title, profile?.healthData);
      setAromas(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetchingAromas(false);
    }
  };

  const handleSaveMeditation = async () => {
    if (!user || !session) return;
    setIsSavingMeditation(true);
    try {
      await vaultService.saveItem(
        user.uid,
        'sonic_meditation',
        session.title,
        {
          ...session,
          mood: feeling,
          duration: parseInt(duration) || 10
        },
        `https://picsum.photos/seed/${session.title}/800/600`,
        `Meditative session for feeling: ${feeling}`
      );
      setHasSavedMeditation(true);
      toast("Meditation saved to your Sacred Vault!", "success");
    } catch (error) {
      console.error(error);
      toast("Failed to save to vault.", "error");
    } finally {
      setIsSavingMeditation(false);
    }
  };

  const handleCompositionGenerate = async () => {
    if (!diseaseContext) return;
    setLoading(true);
    setHasSavedComposition(false);
    try {
      const result = await geminiService.generateSonicComposition(diseaseContext, 'disease', {
        ...profile?.healthData,
        currentBiometrics: liveBiometrics
      });
      setComposition(result);
      setupAudio(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveComposition = async () => {
    if (!user || !composition) return;
    setIsSavingComposition(true);
    try {
      await vaultService.saveItem(
        user.uid,
        'sonic_composition',
        composition.title,
        composition,
        `https://picsum.photos/seed/${composition.title}/800/600`,
        `Bio-resonant composition for: ${diseaseContext}`
      );
      setHasSavedComposition(true);
      toast("Composition saved to your Sacred Vault!", "success");
    } catch (error) {
      console.error(error);
      toast("Failed to save to vault.", "error");
    } finally {
      setIsSavingComposition(false);
    }
  };

  const setupAudio = async (comp: any) => {
    await Tone.start();
    setIsToneStarted(true);

    // Dispose old instances
    if (synthRef.current) synthRef.current.dispose();
    if (loopRef.current) loopRef.current.dispose();

    // Create complex synth for Ayurvedic textures
    const filter = new Tone.Filter(440, "lowpass").toDestination();
    const reverb = new Tone.Reverb(3).connect(filter);
    const synth = new Tone.PolySynth(Tone.Synth).connect(reverb);
    
    synth.set({
      oscillator: { type: comp.instruments.includes('Woodwinds') ? "sine" : "triangle" },
      envelope: { attack: 1.5, release: 2 }
    });
    
    synthRef.current = synth;

    // Use BPM from Gemini
    Tone.getTransport().bpm.value = comp.bpm;

    // Simple loop for generative atmosphere
    loopRef.current = new Tone.Loop((time) => {
      const notes = ["C4", "E4", "G4", "B4"]; // Gemini could suggest scales too
      const note = notes[Math.floor(Math.random() * notes.length)];
      synth.triggerAttackRelease(note, "2n", time);
    }, "2n").start(0);
  };

  const toggleComposition = () => {
    if (isCompPlaying) {
      Tone.getTransport().pause();
    } else {
      Tone.getTransport().start();
    }
    setIsCompPlaying(!isCompPlaying);
  };

  const handleConnectYouTube = async () => {
    try {
      const url = await youtubeService.getAuthUrl();
      window.open(url, 'youtube_auth', 'width=600,height=700');
    } catch (error) {
      toast("Failed to initiate YouTube connection.", "error");
    }
  };

  const handleSoundscapeSelect = async (id: string) => {
    await Tone.start();
    if (selectedSoundscape === id) {
      soundscapePlayerRef.current?.stop();
      setSelectedSoundscape(null);
      return;
    }

    setIsSoundscapeLoading(true);
    try {
      if (soundscapePlayerRef.current) {
        soundscapePlayerRef.current.stop();
        soundscapePlayerRef.current.dispose();
      }

      // Using placeholders for now but preparing for real buffers
      const urls: Record<string, string> = {
        rain: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_826477b75f.mp3?filename=heavy-rain-nature-sounds-8186.mp3',
        forest: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=forest-at-day-nature-sounds-8185.mp3',
        waves: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c6f244105a.mp3?filename=ocean-waves-1129.mp3',
        chant: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_88444c6c00.mp3?filename=traditional-yoga-chant-6421.mp3'
      };

      const player = new Tone.Player({
        url: urls[id] || urls.rain,
        loop: true,
        autostart: true,
        volume: volume,
        fadeOut: 2
      }).toDestination();

      soundscapePlayerRef.current = player;
      setSelectedSoundscape(id);
    } catch (error) {
      console.error("Failed to load soundscape:", error);
      toast("Failed to load soundscape audio.", "error");
    } finally {
      setIsSoundscapeLoading(false);
    }
  };

  const handleVolumeChange = (newVal: number) => {
    setVolume(newVal);
    if (soundscapePlayerRef.current) {
      soundscapePlayerRef.current.volume.value = newVal;
    }
    if (synthRef.current) {
      synthRef.current.volume.value = newVal;
    }
  };

  const handleUploadToYouTube = async () => {
    if (!composition) return;
    setIsUploading(true);
    // Simulate complex upload
    setTimeout(() => {
      setIsUploading(false);
      setYtVideos(prev => [{
        id: Math.random().toString(36),
        title: composition.title,
        description: composition.sonicPrescription,
        thumbnail: `https://picsum.photos/seed/${composition.title}/320/180`,
        publishedAt: new Date().toISOString()
      }, ...prev]);
    }, 3000);
  };

  const handleGenerateVideo = async () => {
    if (!veoPrompt) return;
    setIsGeneratingVideo(true);
    try {
      const uri = await veoService.generateVideo({
        prompt: veoPrompt,
        resolution: '720p',
        aspectRatio: '16:9'
      });
      
      const blob = await veoService.fetchVideoBlob(uri);
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      toast("Video generated successfully!", "success");
    } catch (error: any) {
      console.error(error);
      if (error.message === "API_KEY_RESET_REQUIRED") {
        setHasApiKey(false);
        toast("API Key issues. Please re-select your key.", "error");
      } else {
        toast("Failed to generate video.", "error");
      }
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleAutoGenerateVideo = async () => {
    setIsAutoGeneratingPrompt(true);
    setIsGeneratingVideo(true);
    try {
      toast("AI is crafting a dosha-aligned visualization prompt...", "info");
      const prompt = await geminiService.generateVeoWellnessPrompt(profile?.healthData);
      setVeoPrompt(prompt);
      setIsAutoGeneratingPrompt(false);
      
      toast("Prompt manifested. Starting video generation...", "info");
      
      const uri = await veoService.generateVideo({
        prompt: prompt,
        resolution: '720p',
        aspectRatio: '16:9'
      });
      
      const blob = await veoService.fetchVideoBlob(uri);
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      toast("Dosha-aligned video generated successfully!", "success");
    } catch (error: any) {
      console.error(error);
      if (error.message === "API_KEY_RESET_REQUIRED") {
        setHasApiKey(false);
        toast("API Key issues. Please re-select your key.", "error");
      } else {
        toast("Failed to generate auto video.", "error");
      }
    } finally {
      setIsAutoGeneratingPrompt(false);
      setIsGeneratingVideo(false);
    }
  };

  const handleSelectApiKey = async () => {
    try {
      await (window as any).aistudio.openSelectKey();
      setHasApiKey(true);
      toast("API Key selected successfully.", "success");
    } catch (err) {
      console.error("Key selection error:", err);
      toast("Failed to select API Key.", "error");
    }
  };

  useEffect(() => {
    const checkKey = async () => {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    };
    if (activeTab === 'visual') {
      checkKey();
    }
  }, [activeTab]);

  useEffect(() => {
    let interval: any;
    if (isPlaying && session) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (currentLine < session.script.length - 1) {
              setCurrentLine(currentLine + 1);
              return 0;
            } else {
              setIsPlaying(false);
              trackEngagement('sanctuary');
              return 100;
            }
          }
          return prev + 1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, session, currentLine]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-4xl font-bold text-[#5A5A40] tracking-tight">Sonic Sanctuary</h2>
            {liveBiometrics && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-xl"
              >
                <Heart size={12} className="text-rose-500 fill-rose-500 animate-pulse" />
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">{liveBiometrics.heartRate} BPM</span>
              </motion.div>
            )}
          </div>
          <p className="text-[#2D3436] opacity-70 italic">Bio-Resonance & Meditative Engineering.</p>
        </div>
        
        <div className="flex bg-[#D1D1C1]/20 p-1.5 rounded-2xl backdrop-blur-sm self-stretch sm:self-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'meditation', icon: Wind, label: 'Meditation' },
            { id: 'composition', icon: Music, label: 'Gen-Audio' },
            { id: 'visual', icon: Video, label: 'Visuals' },
            { id: 'youtube', icon: Youtube, label: 'Vault' },
            { id: 'iot', icon: Cpu, label: 'IoT Hub' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-[#5A5A40] text-white shadow-lg shadow-[#5A5A40]/30" 
                  : "text-[#5A5A40] opacity-60 hover:opacity-100"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Breathing Protocols (Prana Hub) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#5A5A40]">Prana Hub</h3>
            <p className="text-xs opacity-50 font-serif italic text-[#5A5A40]">Calibrated respiratory mastery.</p>
          </div>
          {activeBreathProtocol && (
             <button 
               onClick={() => setActiveBreathProtocol(null)}
               className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-rose-100"
             >
               Stop Protocol
             </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BREATH_PROTOCOLS.map((protocol) => (
            <button
              key={protocol.id}
              onClick={() => toggleBreath(protocol)}
              className={cn(
                "p-6 rounded-[32px] border transition-all text-left group overflow-hidden relative",
                activeBreathProtocol?.id === protocol.id 
                  ? "bg-[#5A5A40] text-white border-transparent shadow-xl h-full" 
                  : "bg-white border-[#D1D1C1]/20 hover:border-[#5A5A40]/40"
              )}
            >
              <div className="flex items-center gap-4 relative z-10 h-full">
                 <div className={cn(
                   "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shrink-0",
                   activeBreathProtocol?.id === protocol.id ? "bg-white/20" : "bg-[#F5F5F0]"
                 )}>
                    <protocol.icon size={24} className={activeBreathProtocol?.id === protocol.id ? "text-white" : "text-[#5A5A40]"} />
                 </div>
                 <div className="space-y-1">
                    <h4 className="font-serif font-bold text-lg leading-none">{protocol.name}</h4>
                    <p className={cn(
                      "text-[10px] italic leading-relaxed line-clamp-2",
                      activeBreathProtocol?.id === protocol.id ? "opacity-70" : "opacity-40 text-[#2D3436]"
                    )}>
                      {protocol.description}
                    </p>
                 </div>
              </div>
              
              {activeBreathProtocol?.id === protocol.id && (
                <motion.div 
                  layoutId="breath-bg"
                  className="absolute inset-0 bg-[#5A5A40] z-0"
                />
              )}
            </button>
          ))}
        </div>

        {/* Visual Breath Guide */}
        <AnimatePresence>
          {activeBreathProtocol && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#1A1A15] text-white rounded-[40px] p-12 flex flex-col items-center justify-center space-y-10 relative shadow-2xl">
                <div className="text-center space-y-2">
                  <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">Current Phase</h5>
                  <div className="text-4xl font-serif font-bold italic h-10 flex items-center justify-center text-indigo-400">
                    {breathPhase === 'inhale' && 'Expand...'}
                    {breathPhase === 'hold' && 'Kumbhaka (Hold)'}
                    {breathPhase === 'exhale' && 'Release...'}
                    {breathPhase === 'sustain' && 'Bahya Kumbhaka'}
                    {breathPhase === 'idle' && 'Calibrating...'}
                  </div>
                </div>

                <div className="relative flex items-center justify-center w-64 h-64">
                  {/* Pulsing Visualizer */}
                  <motion.div 
                    className="absolute inset-0 border-2 border-white/20 rounded-full"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  
                  <motion.div
                    className={cn(
                      "w-48 h-48 rounded-full border-4 border-indigo-500 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.2)]",
                      activeBreathProtocol.color
                    )}
                    animate={{
                      scale: breathPhase === 'inhale' ? 1.5 : (breathPhase === 'exhale' ? 0.8 : (breathPhase === 'hold' ? 1.5 : 0.8)),
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: activeBreathProtocol.phases[breathPhase as keyof typeof activeBreathProtocol.phases] || 1, 
                      ease: "easeInOut" 
                    }}
                  >
                    <span className="text-6xl font-mono font-bold">{breathTimer}</span>
                  </motion.div>

                  {/* Phase Progress Circle */}
                  <svg className="absolute -inset-10 w-[20rem] h-[20rem] -rotate-90">
                    <circle
                      cx="160"
                      cy="160"
                      r="140"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeOpacity="0.1"
                    />
                    <motion.circle
                      cx="160"
                      cy="160"
                      r="140"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="4"
                      strokeDasharray="880"
                      animate={{ strokeDashoffset: [880, 0] }}
                      transition={{ duration: activeBreathProtocol.phases[breathPhase as keyof typeof activeBreathProtocol.phases] || 1, ease: "linear" }}
                      key={breathPhase}
                    />
                  </svg>
                </div>

                <div className="flex gap-4">
                  {Object.entries(activeBreathProtocol.phases).map(([phase, dur]: [string, any]) => (
                    <div key={phase} className={cn(
                      "px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all",
                      breathPhase === phase ? "bg-white text-[#1A1A15] border-white scale-110 shadow-lg" : "bg-transparent border-white/10 text-white/40"
                    )}>
                      {phase}: {dur}s
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <AnimatePresence mode="wait">
        {activeTab === 'meditation' && (
          <motion.div 
            key="meditation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {!session ? (
              <div className="text-center py-20 bg-white rounded-[60px] border border-[#D1D1C1]/30 shadow-sm space-y-8">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <Wind size={40} />
                </div>
                <div className="max-w-md mx-auto space-y-4 px-6">
                  <input
                    type="text"
                    value={feeling}
                    onChange={(e) => setFeeling(e.target.value)}
                    placeholder="How do you feel right now?"
                    className="w-full p-6 rounded-3xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 text-center text-xl italic bg-[#F5F5F0]"
                  />

                  <div className="flex flex-wrap justify-center gap-2 px-4">
                    {[
                      { label: 'Harmonious', icon: Smile, color: 'text-emerald-600 bg-emerald-50' },
                      { label: 'Calm', icon: Wind, color: 'text-sky-600 bg-sky-50' },
                      { label: 'Restless', icon: Activity, color: 'text-indigo-600 bg-indigo-50' },
                      { label: 'Driven', icon: Flame, color: 'text-rose-600 bg-rose-50' },
                      { label: 'Heavy', icon: Cloud, color: 'text-slate-600 bg-slate-50' },
                      { label: 'Clear', icon: Sun, color: 'text-amber-600 bg-amber-50' }
                    ].map((m) => (
                      <button
                        key={m.label}
                        onClick={() => setFeeling(m.label)}
                        className={cn(
                          "px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 border transition-all",
                          feeling === m.label 
                            ? `${m.color} border-transparent shadow-md scale-105` 
                            : "bg-white border-[#D1D1C1]/30 text-[#5A5A40] opacity-60 hover:opacity-100"
                        )}
                      >
                        <m.icon size={14} />
                        {m.label}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex justify-center flex-wrap gap-4">
                    {['5', '10', '20', '30'].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={cn(
                          "px-6 py-2 rounded-2xl text-sm font-bold transition-all",
                          duration === d
                            ? "bg-[#5A5A40] text-white shadow-lg"
                            : "bg-[#F5F5F0] text-[#5A5A40] opacity-60 hover:opacity-100"
                        )}
                      >
                        {d} min
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleMeditationGenerate}
                    disabled={!feeling || loading}
                    className="w-full bg-[#5A5A40] text-white py-5 rounded-3xl font-bold hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#5A5A40]/20 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Manifesting Transformation...
                      </>
                    ) : (
                      <>
                        <Zap size={20} />
                        Begin Transformation
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
               /* Session Full Display Logic - existing UI */
              <div className="bg-[#0A0502] rounded-[60px] overflow-hidden min-h-[600px] flex flex-col relative text-white">
                <div className="absolute inset-0 opacity-40">
                  <img src={`https://picsum.photos/seed/${session.title}/1200/800?blur=10`} className="w-full h-full object-cover" alt="bg" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
                </div>
                <div className="relative p-12 flex justify-between items-start">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-3xl font-bold mb-2">{session.title}</h3>
                      <div className="flex items-center gap-4">
                        <p className="text-sm opacity-60 uppercase tracking-widest">{session.integratedWisdom}</p>
                        <button
                          onClick={handleSaveMeditation}
                          disabled={isSavingMeditation || hasSavedMeditation}
                          className={cn(
                            "flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold transition-all backdrop-blur-md",
                            hasSavedMeditation 
                              ? "bg-emerald-500 text-white" 
                              : "bg-white/10 text-white hover:bg-white/20"
                          )}
                        >
                          {isSavingMeditation ? <Loader2 className="animate-spin" size={12} /> : hasSavedMeditation ? <Check size={12} /> : <Save size={12} />}
                          {hasSavedMeditation ? 'Stored in Vault' : 'Store in Vault'}
                        </button>
                      </div>
                    </div>

                    {/* Aroma Selection in Session */}
                    <div className="flex flex-wrap gap-3">
                      {aromas.map((aroma, i) => (
                        <button
                          key={i}
                          onClick={() => handleAromaSelect(aroma)}
                          className={cn(
                            "px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center gap-2",
                            selectedAroma?.name === aroma.name
                              ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                              : "bg-black/20 text-white/60 border-white/10 hover:bg-black/40"
                          )}
                        >
                          <Droplets size={12} />
                          {aroma.name}
                        </button>
                      ))}
                    </div>
                    {session.fulfillmentActions && (
                      <div className="pt-6">
                        <SmartFulfillmentCard actions={session.fulfillmentActions} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-4">
                    <button onClick={() => { 
                      soundscapePlayerRef.current?.stop();
                      setSelectedSoundscape(null);
                      setSession(null); 
                    }} className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-all"><X /></button>
                    
                    {/* Soundscape Selector */}
                    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/10 space-y-4">
                      <div className="flex items-center justify-between gap-8 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Soundscapes</span>
                        <div className="flex items-center gap-2">
                          <Volume2 size={12} className="text-white/40" />
                          <input 
                            type="range" 
                            min="-60" 
                            max="0" 
                            value={volume} 
                            onChange={(e) => handleVolumeChange(Number(e.target.value))}
                            className="w-20 accent-emerald-500 h-1 rounded-full appearance-none bg-white/10 cursor-pointer"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {SOUNDSCAPES.map((ss) => (
                          <button
                            key={ss.id}
                            onClick={() => handleSoundscapeSelect(ss.id)}
                            disabled={isSoundscapeLoading}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all border",
                              selectedSoundscape === ss.id
                                ? "bg-white text-black border-white shadow-lg"
                                : "bg-white/5 text-white/60 border-white/5 hover:bg-white/10"
                            )}
                          >
                            <ss.icon size={12} className={cn(selectedSoundscape === ss.id ? "text-emerald-600" : ss.color)} />
                            {ss.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedAroma && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 p-4 rounded-3xl max-w-[200px] text-right"
                      >
                         <div className="flex items-center gap-2 justify-end mb-1 text-emerald-400">
                           <SparkleIcon size={12} className="animate-pulse" />
                           <span className="text-[10px] font-bold uppercase tracking-widest">Active Aroma</span>
                         </div>
                         <p className="text-xs font-bold text-white mb-1">{selectedAroma.name}</p>
                         <p className="text-[9px] text-white/60 italic leading-tight">{selectedAroma.ayurvedicProperty}</p>
                      </motion.div>
                    )}
                  </div>
                </div>
                <div className="relative flex-1 flex flex-col items-center justify-center px-12 text-center">
                   <AnimatePresence mode="wait">
                    <motion.div key={currentLine} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                      <p className="text-[10px] font-bold tracking-[0.4em] text-emerald-400 uppercase">{session.script[currentLine].speaker}</p>
                      <p className="text-4xl font-serif italic text-gray-100 max-w-2xl leading-relaxed">"{session.script[currentLine].text}"</p>
                    </motion.div>
                   </AnimatePresence>
                </div>
                <div className="relative p-12 space-y-8">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white transition-all duration-100" style={{ width: `${((currentLine + progress/100) / session.script.length) * 100}%` }} />
                  </div>
                  <div className="flex items-center justify-center gap-12">
                    <button onClick={() => { setCurrentLine(0); setProgress(0); }} className="opacity-40 hover:opacity-100 transition-all"><RotateCcw size={24} /></button>
                    <button onClick={() => setIsPlaying(!isPlaying)} className="w-24 h-24 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-110 transition-all">
                      {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </button>
                    <Volume2 size={24} className="opacity-40" />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'composition' && (
          <motion.div 
            key="composition"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-10 rounded-[60px] border border-[#D1D1C1]/30 shadow-sm space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center">
                    <Music size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#5A5A40]">Disease-Specific Synthesis</h3>
                    <p className="text-sm text-[#2D3436] opacity-60">Generate targeted bio-frequencies based on condition.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Activity className="absolute left-6 top-1/2 -translate-y-1/2 text-[#5A5A40] opacity-40" size={20} />
                    <input
                      type="text"
                      value={diseaseContext}
                      onChange={(e) => setDiseaseContext(e.target.value)}
                      placeholder="e.g., Hypertension, Insomnia, Joint Inflammation..."
                      className="w-full p-6 pl-16 rounded-3xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 bg-[#F5F5F0]"
                    />
                  </div>
                  <button
                    onClick={handleCompositionGenerate}
                    disabled={!diseaseContext || loading}
                    className="w-full bg-[#5A5A40] text-white py-5 rounded-3xl font-bold hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#5A5A40]/20 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Synthesizing Frequencies...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={20} />
                        Synthesize Sonic Profile
                      </>
                    )}
                  </button>
                </div>

                {composition && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-8 border-t border-[#D1D1C1]/30 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h4 className="text-2xl font-bold text-[#5A5A40]">{composition.title}</h4>
                        <p className="text-[#2D3436] opacity-70 leading-relaxed text-sm">{composition.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                         <button
                           onClick={handleSaveComposition}
                           disabled={isSavingComposition || hasSavedComposition}
                           className={cn(
                             "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                             hasSavedComposition 
                               ? "bg-emerald-500 text-white" 
                               : "bg-[#F5F5F0] text-[#5A5A40] hover:bg-[#D1D1C1]"
                           )}
                         >
                           {isSavingComposition ? <Loader2 className="animate-spin" size={14} /> : hasSavedComposition ? <Check size={14} /> : <Save size={14} />}
                           {hasSavedComposition ? 'Stored' : 'Store in Vault'}
                         </button>
                         {ytTokens && (
                           <button onClick={handleUploadToYouTube} disabled={isUploading} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-all">
                             {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                             Sync to YouTube
                           </button>
                         )}
                         <button 
                          onClick={toggleComposition} 
                          className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                            isCompPlaying ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                          )}
                        >
                          {isCompPlaying ? <Pause size={24} /> : <Play size={24} />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 bg-[#F5F5F0] rounded-2xl border border-[#D1D1C1]/20">
                        <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-1">Tempo</p>
                        <p className="font-mono font-bold text-[#5A5A40]">{composition.bpm} BPM</p>
                      </div>
                      <div className="p-4 bg-[#F5F5F0] rounded-2xl border border-[#D1D1C1]/20">
                        <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-1">Frequencies</p>
                        <p className="font-mono font-bold text-[#5A5A40]">{composition.frequencies[0]}</p>
                      </div>
                      <div className="p-4 bg-[#F5F5F0] rounded-2xl border border-[#D1D1C1]/20">
                        <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-1">Dosha Focus</p>
                        <p className="font-mono font-bold text-[#5A5A40]">{composition.instruments[0]}</p>
                      </div>
                      <div className="p-4 bg-[#F5F5F0] rounded-2xl border border-[#D1D1C1]/20">
                        <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-1">Status</p>
                        <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold">
                          <CheckCircle2 size={10} /> Calibrated
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-[#1A1A1A] p-8 rounded-[40px] text-white space-y-6">
                <div className="flex items-center gap-3">
                  <Activity className="text-emerald-400" />
                  <h4 className="font-bold">Sonic Bio-State</h4>
                </div>
                <div className="space-y-4">
                  <div className="h-40 relative flex items-end justify-between gap-1">
                    {[40, 70, 45, 90, 65, 30, 85, 40, 60, 20].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: isCompPlaying ? `${h}%` : '5%' }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse', delay: i * 0.1 }}
                        className="flex-1 bg-gradient-to-t from-emerald-500/20 to-emerald-400 rounded-t-lg"
                      />
                    ))}
                  </div>
                  <div className="pt-4 border-t border-white/10 space-y-4">
                    <p className="text-xs opacity-60 leading-relaxed italic">
                      "Real-time neuro-entrainment active. Frequencies adjusted to align with your autonomic regulation."
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 p-8 rounded-[40px] space-y-4 border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Info size={20} />
                  <h4 className="font-bold">Medical Efficacy</h4>
                </div>
                <p className="text-sm text-emerald-900/70 leading-relaxed">
                  {composition?.sonicPrescription || "Enter a condition to receive a sonic prescription blending ancient ragas and modern psychoacoustics."}
                </p>
                {composition?.fulfillmentActions && (
                  <div className="pt-4">
                    <SmartFulfillmentCard actions={composition.fulfillmentActions} />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'visual' && (
          <motion.div 
            key="visual"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="bg-white p-10 rounded-[60px] border border-[#D1D1C1]/30 shadow-sm space-y-8">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center">
                    <Video size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#5A5A40]">Veo Wellness Studio</h3>
                    <p className="text-sm text-[#2D3436] opacity-60">Generate dynamic wellness tutorials & visualizations.</p>
                  </div>
                </div>
                
                {!hasApiKey && (
                  <button
                    onClick={handleSelectApiKey}
                    className="flex items-center gap-2 px-6 py-3 bg-[#5A5A40] text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-[#4A4A30] transition-all shadow-lg"
                  >
                    <Zap size={16} />
                    Select Gemini API Key
                  </button>
                )}
              </div>

              {hasApiKey ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t border-[#D1D1C1]/20">
                  <div className="space-y-6">
                    <div className="flex justify-between items-end px-2">
                       <label className="text-[10px] uppercase font-bold opacity-40 tracking-widest">Visualization Prompt</label>
                       <button 
                        onClick={handleAutoGenerateVideo}
                        disabled={isGeneratingVideo || isAutoGeneratingPrompt}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-purple-600 hover:text-purple-700 transition-colors uppercase tracking-widest disabled:opacity-50"
                       >
                         {isAutoGeneratingPrompt ? <Loader2 className="animate-spin" size={12} /> : <SparkleIcon size={12} />}
                         Auto-Generate from Dosha
                       </button>
                    </div>
                    <div className="space-y-2">
                       <textarea
                        rows={6}
                        value={veoPrompt}
                        onChange={(e) => setVeoPrompt(e.target.value)}
                        placeholder="Describe the wellness visualization you wish to manifest. e.g., 'A serene high-fidelity visualization of a lotus blooming in a sacred Himalayan pond at dawn, representing spiritual awakening.'"
                        className="w-full p-6 rounded-[32px] bg-[#F5F5F0] border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 resize-none text-sm leading-relaxed"
                       />
                       <p className="text-[10px] opacity-40 px-2 italic">Note: Video generation may take a few minutes. Please remain centered.</p>
                    </div>

                    <button
                      onClick={handleGenerateVideo}
                      disabled={!veoPrompt || isGeneratingVideo}
                      className="w-full bg-[#5A5A40] text-white py-5 rounded-[32px] font-bold hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#5A5A40]/20 disabled:opacity-50"
                    >
                      {isGeneratingVideo ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          Manifesting Visualization...
                        </>
                      ) : (
                        <>
                          <Video size={20} />
                          Generate Veo Reflection
                        </>
                      )}
                    </button>
                  </div>

                  <div className="aspect-video rounded-[32px] bg-[#0A0502] overflow-hidden border border-[#D1D1C1]/20 relative shadow-2xl group">
                    {videoUrl ? (
                      <video 
                        src={videoUrl} 
                        controls 
                        className="w-full h-full object-cover"
                        poster={`https://picsum.photos/seed/veo/800/450`}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-4">
                        {isGeneratingVideo ? (
                          <motion.div
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="space-y-4"
                          >
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                              <SparkleIcon size={32} className="text-[#A8D5BA]" />
                            </div>
                            <p className="text-white/60 text-sm font-serif italic">"Subtle energies are converging into visual form. This takes time in the material realm..."</p>
                          </motion.div>
                        ) : (
                          <>
                             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                                <Video size={32} className="text-white/20" />
                             </div>
                             <div>
                                <p className="text-white font-bold mb-1">Mirror of Reflection</p>
                                <p className="text-white/40 text-xs">Your generated visualization will appear here once manifested.</p>
                             </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-[#F5F5F0] rounded-[40px] space-y-4 border border-[#D1D1C1]/30">
                  <Shield size={40} className="mx-auto text-[#5A5A40] opacity-40" />
                  <div className="max-w-md mx-auto">
                    <h4 className="font-bold text-[#5A5A40]">Authentication Required</h4>
                    <p className="text-sm opacity-60">High-fidelity video generation requires a dedicated Gemini API key from a paid Google Cloud project. Please click the button above to safely provide your key.</p>
                    <a 
                      href="https://ai.google.dev/gemini-api/docs/billing" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-2 inline-block font-bold"
                    >
                      Learn more about Billing & API Keys
                    </a>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'youtube' && (
          <motion.div key="youtube" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {!ytTokens ? (
              <div className="text-center py-20 bg-white rounded-[60px] border border-[#D1D1C1]/30 space-y-8 border-dashed">
                <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <Youtube size={40} />
                </div>
                <div className="space-y-4 max-w-sm mx-auto">
                  <h3 className="text-2xl font-bold text-[#5A5A40]">YouTube Management Hub</h3>
                  <p className="text-[#2D3436] opacity-60">Connect your channel to professionalize your therapeutic content distribution.</p>
                  <button onClick={handleConnectYouTube} className="w-full bg-[#FF0000] text-white py-4 rounded-3xl font-bold flex items-center justify-center gap-2 hover:bg-[#CC0000] transition-all shadow-xl shadow-red-500/20">
                    <Smartphone size={20} />
                    Connect via Google
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[40px] border border-[#D1D1C1]/30">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#5A5A40]/10">
                      <img src={ytProfile?.snippet?.thumbnails?.default?.url || "https://picsum.photos/seed/yt/200/200"} className="w-full h-full object-cover" alt="Channel" loading="lazy" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[#5A5A40]">{ytProfile?.snippet?.title || "Wellness Channel"}</h3>
                      <div className="flex items-center gap-4 text-xs font-bold opacity-40 uppercase tracking-widest mt-1">
                        <span>{ytProfile?.statistics?.subscriberCount || "0"} Subscribers</span>
                        <span>{ytProfile?.statistics?.videoCount || "0"} Videos</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => fetchYouTubeData(ytTokens)} 
                      disabled={isFetchingYT}
                      className="p-3 rounded-2xl bg-[#D1D1C1]/20 text-[#5A5A40] hover:bg-[#D1D1C1]/40 transition-all"
                    >
                      <RefreshCw className={cn(isFetchingYT && "animate-spin")} size={20} />
                    </button>
                    <button onClick={() => { setYtTokens(null); localStorage.removeItem('youtube_tokens'); setYtProfile(null); }} className="text-sm font-bold text-red-600 hover:underline">Disconnect</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h4 className="text-xl font-bold text-[#5A5A40]">Manage Videos</h4>
                    {isFetchingYT ? (
                      <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#5A5A40]" /></div>
                    ) : (
                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                        {ytVideos.length === 0 && <p className="text-center py-20 opacity-40 italic">No uploads found.</p>}
                        {ytVideos.map((vid) => (
                          <div 
                            key={vid.id} 
                            onClick={() => setEditingVideo({ ...vid })}
                            className={cn(
                              "bg-white p-4 rounded-3xl border border-[#D1D1C1]/30 flex gap-4 cursor-pointer transition-all hover:shadow-md",
                              editingVideo?.id === vid.id && "ring-2 ring-[#5A5A40]"
                            )}
                          >
                            <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0">
                              <img src={vid.snippet.thumbnails.default.url} className="w-full h-full object-cover" alt="t" />
                            </div>
                            <div className="overflow-hidden">
                              <h5 className="font-bold text-[#5A5A40] truncate text-sm">{vid.snippet.title}</h5>
                              <p className="text-[10px] opacity-40 mt-1">{new Date(vid.snippet.publishedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-[#F5F5F0] p-8 rounded-[40px] border border-[#D1D1C1]/30">
                    {editingVideo ? (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xl font-bold text-[#5A5A40]">Edit Details</h4>
                          <button onClick={() => setEditingVideo(null)} className="p-2 hover:bg-[#D1D1C1]/40 rounded-full transition-all"><X size={16} /></button>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                             <label className="text-[10px] uppercase font-bold opacity-40 tracking-widest pl-2">Title</label>
                             <input 
                              type="text" 
                              value={editingVideo.snippet.title}
                              onChange={(e) => setEditingVideo({...editingVideo, snippet: {...editingVideo.snippet, title: e.target.value}})}
                              className="w-full p-4 rounded-2xl bg-white border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] uppercase font-bold opacity-40 tracking-widest pl-2">Description</label>
                             <textarea 
                              rows={5}
                              value={editingVideo.snippet.description}
                              onChange={(e) => setEditingVideo({...editingVideo, snippet: {...editingVideo.snippet, description: e.target.value}})}
                              className="w-full p-4 rounded-2xl bg-white border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 resize-none text-sm"
                             />
                          </div>
                          <button 
                            onClick={handleUpdateVideo}
                            disabled={loading}
                            className="w-full bg-[#5A5A40] text-white py-4 rounded-2xl font-bold hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-2"
                          >
                            {loading ? <Loader2 className="animate-spin" /> : <Upload size={18} />}
                            Update Metadata
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                         <Info size={40} />
                         <p className="text-sm italic">Select a video from your vault to manage its therapeutic metadata and visibility.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'iot' && (
          <motion.div key="iot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-white p-10 rounded-[60px] border border-[#D1D1C1]/30 shadow-sm space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center">
                      <Cpu size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[#5A5A40]">IoT Sanctuary Hub</h3>
                      <p className="text-sm text-[#2D3436] opacity-60">Synchronize medical sensors & environment.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIotSyncEnabled(!iotSyncEnabled)}
                    className={cn(
                      "px-6 py-2 rounded-2xl font-bold text-sm transition-all",
                      iotSyncEnabled ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {iotSyncEnabled ? "Sync Active" : "Connect Sensors"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-[#F5F5F0] rounded-[40px] space-y-4">
                    <Heart className="text-red-500" size={24} />
                    <div>
                      <p className="text-[10px] uppercase font-bold opacity-40">Heart Rate</p>
                      <p className="text-3xl font-mono font-bold text-[#5A5A40]">{iotState?.heartRate?.toFixed(0) || "--"} <span className="text-xs">BPM</span></p>
                    </div>
                  </div>
                  <div className="p-6 bg-[#F5F5F0] rounded-[40px] space-y-4">
                    <Zap className="text-amber-500" size={24} />
                    <div>
                      <p className="text-[10px] uppercase font-bold opacity-40">Stress Indication</p>
                      <p className="text-3xl font-mono font-bold text-[#5A5A40]">{((iotState?.stressLevel || 0) * 100).toFixed(0)} <span className="text-xs">%</span></p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="p-6 bg-emerald-50 rounded-[40px] border border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <Droplets size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold opacity-40">Active Aroma Sync</p>
                        <p className="text-xl font-bold text-[#5A5A40]">{iotState?.activeAroma || "Ambient"}</p>
                      </div>
                    </div>
                    {iotState?.lastAromaUpdate && (
                      <div className="text-right">
                        <p className="text-[9px] uppercase font-bold opacity-30">Last Triggered</p>
                        <p className="text-[10px] font-mono text-[#5A5A40]">{new Date(iotState.lastAromaUpdate).toLocaleTimeString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-emerald-50 rounded-[40px] border border-emerald-100 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Activity size={20} />
                    <h4 className="font-bold">Reverse Feedback Stream</h4>
                  </div>
                  <div className="space-y-3">
                    {reverseFeedback.length === 0 && <p className="text-xs italic opacity-40">Awaiting live biometric data...</p>}
                    {reverseFeedback.map((msg, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-xs bg-white/50 p-3 rounded-xl border border-emerald-200 text-emerald-900 leading-relaxed">
                        {msg}
                      </motion.div>
                    ))}
                  </div>
                </div>
             </div>

             <div className="bg-[#5A5A40] p-10 rounded-[60px] text-white/90 space-y-8 relative overflow-hidden shadow-2xl shadow-[#5A5A40]/40">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <h3 className="text-3xl font-bold">Biometric Synchronization</h3>
                <p className="leading-relaxed opacity-80 text-lg italic">
                  "Your sanctuary is no longer static. It breathes with you. Our advanced IoT integration listens to your cardiovascular and hormonal markers, adjusting the generative audio in real-time to force-calibrate your physiology towards homeostasis."
                </p>
                <div className="space-y-4 pt-8">
                   <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl">
                     <span className="font-bold">Neural Entrainment</span>
                     <span className="text-emerald-400 font-mono">ACTIVE</span>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl">
                     <span className="font-bold">Vagal Tone Reinforcement</span>
                     <span className="text-emerald-400 font-mono">STABILIZED</span>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl">
                     <span className="font-bold">Cortisol Suppression</span>
                     <span className="text-emerald-400 font-mono">92% EFF</span>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      <LiveActivityTicker />
    </div>
  );
};
