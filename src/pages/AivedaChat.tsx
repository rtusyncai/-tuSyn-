import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Loader2, Sparkles, User, Bot, Trash2, Search, Info, MessageSquare, 
  Smile, Frown, Zap, Moon, Activity, MapPin, X, FileUp, Check, 
  AlertCircle, Mic, MicOff, FileText, ShoppingBag, Stethoscope, 
  ClipboardList, History, Wind, Droplets, Lightbulb, Fan, Power, 
  Heart, Coffee, Sun, Bath, Archive, Palmtree, ArrowDown, Edit3, Save 
} from 'lucide-react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp, getDocs, getDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { geminiService } from '../services/geminiService';
import { vaultService } from '../services/vaultService';
import { cn } from '../lib/utils';
import { useToast } from '../hooks/useToast';
import { useBiometrics } from '../hooks/useBiometrics';
import { YogaFlowAnimator } from '../components/YogaFlowAnimator';
import { SmartFulfillmentCard } from '../components/SmartFulfillmentCard';
import { neuroSyncService } from '../services/neuroSyncService';
import { iotDiffuserService } from '../services/iotDiffuserService';
import Markdown from 'react-markdown';

const ChatMessage = React.memo(({ msg, isUser, onIotAction }: { msg: any, isUser: boolean, onIotAction: (action: any) => void }) => {
  return (
    <div className="p-4 sm:p-2">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={cn(
          "flex gap-3 sm:gap-4 max-w-[95%] sm:max-w-[85%] mb-6",
          isUser ? "ml-auto flex-row-reverse" : ""
        )}
      >
        <div className={cn(
          "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
          isUser ? "bg-[#E8E8E0] text-[#5A5A40]" : "bg-[#5A5A40] text-white"
        )}>
          {isUser ? <User size={14} className="sm:w-[18px]" /> : <Bot size={14} className="sm:w-[18px]" />}
        </div>
        <div className={cn(
          "p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] text-sm leading-relaxed shadow-sm",
          isUser 
            ? "bg-[#F5F5F0] text-[#2D3436] rounded-tr-none" 
            : "bg-white border border-[#D1D1C1]/30 text-[#2D3436] rounded-tl-none"
        )}>
          <div className="markdown-body prose prose-sm max-w-none break-words">
            <Markdown>{msg.content}</Markdown>
          </div>
          {msg.fulfillmentActions && (
            <div className="mt-4 pt-4 border-t border-[#D1D1C1]/10">
              <SmartFulfillmentCard actions={msg.fulfillmentActions} />
            </div>
          )}
          {msg.iotActions && msg.iotActions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#D1D1C1]/20 flex flex-wrap gap-2">
              {msg.iotActions.map((action: any, i: number) => (
                <button
                  key={i}
                  onClick={() => onIotAction(action)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#5A5A40]/5 text-[#5A5A40] rounded-full text-[10px] font-bold hover:bg-[#5A5A40] hover:text-white transition-all"
                >
                  <Zap size={12} /> {action.device}: {action.mode || action.temp}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

export const AivedaChatPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: biometrics } = useBiometrics();
  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [showSensoryInput, setShowSensoryInput] = useState(false);
  const [showContextSidebar, setShowContextSidebar] = useState(false);
  const [sensoryFeedback, setSensoryFeedback] = useState('');
  const [locationContext, setLocationContext] = useState<any>(null);
  const [regionalContext, setRegionalContext] = useState<string>('');
  const [consultationMode, setConsultationMode] = useState<'ai' | 'live'>('ai');
  const consultationModeRef = useRef(consultationMode);
  const [uploading, setUploading] = useState(false);
  const [documentAnalysis, setDocumentAnalysis] = useState<any>(null);
  const [editedDocAnalysis, setEditedDocAnalysis] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isEditingAnalysis, setIsEditingAnalysis] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [consultationHelper, setConsultationHelper] = useState<any>(null);
  const [showHelper, setShowHelper] = useState(true);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [showPrescription, setShowPrescription] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<any>(null);
  const [showYogaFlow, setShowYogaFlow] = useState(false);
  const [yogaFlowData, setYogaFlowData] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [dinacharyaInsight, setDinacharyaInsight] = useState<any>(null);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [iotDevices, setIotDevices] = useState<any>({
    diffuser: { status: 'off', mode: 'None', lastAction: '' },
    shower: { status: 'off', temp: 'Cold', lastAction: '' },
    air_purifier: { status: 'on', mode: 'Auto', lastAction: '' },
    lighting: { status: 'on', mode: 'Natural', lastAction: '' }
  });
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const scrollToBottom = () => {
    if (virtuosoRef.current && messages.length > 0) {
      virtuosoRef.current.scrollToIndex({
        index: messages.length - 1,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    consultationModeRef.current = consultationMode;
  }, [consultationMode]);

  useEffect(() => {
    if (!user) return;

    const findSession = async () => {
      // Fetch profile data
      const profileSnap = await getDoc(doc(db, 'profiles', user.uid));
      const neuroProfile = await neuroSyncService.getNeuroProfile(user.uid);

      if (profileSnap.exists()) {
        setProfile({ ...profileSnap.data(), neuroProfile });
      } else {
        setProfile({ neuroProfile });
      }

      const q = query(
        collection(db, 'ayur_chats'),
        where('uid', '==', user.uid),
        orderBy('updatedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const session = snapshot.docs[0];
        setSessionId(session.id);
        const sessionMessages = session.data().messages || [];
        setMessages(sessionMessages);
        if (sessionMessages.length === 0) {
          setShowMoodSelector(true);
        }
      } else {
        const newSession = await addDoc(collection(db, 'ayur_chats'), {
          uid: user.uid,
          messages: [],
          updatedAt: serverTimestamp()
        });
        setSessionId(newSession.id);
        setShowMoodSelector(true);
      }
    };

    findSession();
  }, [user]);

  useEffect(() => {
    if (profile?.healthData?.dosha) {
      const fetchDinacharya = async () => {
        const time = new Date().getHours();
        const timeContext = time < 12 ? 'Morning' : time < 17 ? 'Afternoon' : time < 21 ? 'Evening' : 'Night';
        const insight = await geminiService.generateDinacharyaInsights(profile.healthData.dosha, timeContext, profile.healthData);
        setDinacharyaInsight(insight);
      };
      fetchDinacharya();
    }
  }, [profile]);

  const handleIotAction = (action: any) => {
    let message = '';
    let type: 'success' | 'info' = 'info';

    if (action.device === 'diffuser') {
      message = `Diffuser activated: ${action.mode} essence`;
      type = 'success';
    } else if (action.device === 'shower') {
      message = `Shower temperature set to ${action.temp}`;
      type = 'info';
    } else if (action.device === 'lighting') {
      message = `Lighting adjusted to ${action.mode}`;
      type = 'info';
    }

    if (message) {
      toast(message, type);
    }

    setIotDevices((prev: any) => {
      const newDevices = { ...prev };
      if (action.device === 'diffuser') {
        newDevices.diffuser = { status: 'on', mode: action.mode, lastAction: `Dispensing ${action.mode} essence` };
      } else if (action.device === 'shower') {
        newDevices.shower = { status: 'on', temp: action.temp, lastAction: `Setting temperature to ${action.temp}` };
      } else if (action.device === 'lighting') {
        newDevices.lighting = { status: 'on', mode: action.mode, lastAction: `Adjusting to ${action.mode} spectrum` };
      }
      return newDevices;
    });
  };

  useEffect(() => {
    let watchId: number;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const newContext = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          setLocationContext(newContext);

          // Fetch city name for UI display with multiple fallbacks
          try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`);
            const data = await res.json();
            if (data.city || data.locality || data.principalSubdivision) {
              const locationName = data.city || data.locality || data.principalSubdivision;
              const country = data.countryName;
              setRegionalContext(`${locationName}, ${country}`);
            } else {
              throw new Error('Incomplete data from BigDataCloud');
            }
          } catch (err) {
            console.warn('Primary geocoding failed, trying secondary...', err);
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=10`);
              const data = await res.json();
              if (data.address) {
                const city = data.address.city || data.address.town || data.address.village || data.address.suburb;
                const country = data.address.country;
                setRegionalContext(city ? `${city}, ${country}` : country);
              } else {
                throw new Error('No address found');
              }
            } catch (innerErr) {
              console.error('All geocoding services failed:', innerErr);
              setRegionalContext(`${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`);
            }
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError('Live location tracking failed. Regional medicine suggestions may be limited.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    consultationModeRef.current = consultationMode;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setInput(transcript);

        // Auto-update helper in live mode
        if (consultationModeRef.current === 'live' && transcript.length > 20) {
          updateHelperDebounced(transcript);
        }
      };

      recognitionRef.current.onstart = () => {
        setIsRecording(true);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please enable it in your browser settings.');
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
        setIsRecording(false);
      };
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const path = `ayur_chats/${sessionId}`;
    const unsubscribe = onSnapshot(doc(db, 'ayur_chats', sessionId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setMessages(data.messages || []);
        if (data.messages?.length > 0) {
          setShowMoodSelector(false);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return unsubscribe;
  }, [sessionId]);

  const handleMoodSelect = async (mood: string) => {
    if (!sessionId || !user) return;
    setLoading(true);
    setShowMoodSelector(false);

    try {
      const welcomeData = await geminiService.generateAivedaWelcome(mood, profile?.healthData);
      
      // Handle IoT Actions
      if (welcomeData.iotActions && welcomeData.iotActions.length > 0) {
        welcomeData.iotActions.forEach((action: any) => {
          if (action.device === 'diffuser') {
            iotDiffuserService.triggerAroma(action.value, action.reason);
          }
        });

        setIotDevices((prev: any) => {
          const newDevices = { ...prev };
          welcomeData.iotActions.forEach((action: any) => {
            if (newDevices[action.device]) {
              newDevices[action.device] = {
                ...newDevices[action.device],
                status: 'on',
                mode: action.value,
                lastAction: action.reason
              };
            }
          });
          return newDevices;
        });
      }

      const modelMessage = {
        role: 'model',
        content: welcomeData.text,
        timestamp: new Date().toISOString(),
        iotActions: welcomeData.iotActions
      };

      const path = `ayur_chats/${sessionId}`;
      await updateDoc(doc(db, 'ayur_chats', sessionId), {
        messages: [modelMessage],
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `ayur_chats/${sessionId}`);
      setError('Failed to start session. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const generateYogaFlow = async () => {
    if (!profile?.healthData?.dosha) {
      setError("Please complete your Dosha quiz first.");
      return;
    }
    setLoading(true);
    try {
      const mood = profile?.mood || 'Balanced';
      const moodKey = mood === 'Low Energy' ? 'Restorative' : mood === 'Restless' ? 'Focus' : 'Energizing';
      const flow = await geminiService.generateYogaFlow(profile.healthData.dosha, moodKey, profile.healthData);
      setYogaFlowData(flow);
      setShowYogaFlow(true);
    } catch (error) {
      console.error(error);
      setError('Failed to generate yoga flow.');
    } finally {
      setLoading(false);
    }
  };

  const handleCuratePackage = async () => {
    const goal = prompt("What is your primary wellness goal for this ṚtuSyn package? (e.g., Deep Rejuvenation, Weight Loss, Neural Recovery)");
    if (!goal) return;
    const message = `CURATE PACKAGE: I would like a custom ṚtuSyn wellness program for 7 days focusing on: ${goal}. Please design a Neural Chrono-Sync plan for me.`;
    await processMessage(message);
  };

  const handleSend = async () => {
    if (!user || !input.trim() || !sessionId) return;
    
    const messageToSend = input;
    setInput('');
    await processMessage(messageToSend);
  };

  const handleSensorySubmit = async () => {
    if (!sensoryFeedback.trim()) return;
    const message = `SENSORY FEEDBACK: I'm noticing ${sensoryFeedback}. What does this mean for my balance?`;
    setSensoryFeedback('');
    setShowSensoryInput(false);
    await processMessage(message);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !sessionId) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const analysis = await geminiService.analyzeDocument(base64, file.type, profile?.healthData);
          setDocumentAnalysis(analysis);
          setEditedDocAnalysis(JSON.parse(JSON.stringify(analysis)));
          setShowAnalysis(true);
          
          const message = `DOCUMENT UPLOAD: I've uploaded a medical document (${file.name}). Summary: ${analysis.summary}`;
          await processMessage(message);
        } catch (innerError) {
          console.error('Error processing uploaded file:', innerError);
          setError('Failed to analyze the document. Please try again.');
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        setError('Failed to read the file.');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setError('An error occurred during file upload.');
      setUploading(false);
    }
  };

  const syncToProfile = async () => {
    if (!editedDocAnalysis || !user) return;
    
    const path = `profiles/${user.uid}`;
    try {
      const profileRef = doc(db, 'profiles', user.uid);
      const profileSnap = await getDoc(profileRef);
      const currentData = profileSnap.exists() ? profileSnap.data() : {};
      
      const healthData = currentData.healthData || {};
      
      await updateDoc(profileRef, {
        healthData: {
          ...healthData,
          medicalHistory: `${healthData.medicalHistory || ''}\n${editedDocAnalysis.profileUpdates.medicalHistory || ''}`.trim(),
          allergies: `${healthData.allergies || ''}\n${editedDocAnalysis.profileUpdates.allergies || ''}`.trim(),
          medications: `${healthData.medications || ''}\n${editedDocAnalysis.profileUpdates.medications || ''}`.trim(),
        },
        updatedAt: serverTimestamp()
      });
      
      setDocumentAnalysis(null);
      setEditedDocAnalysis(null);
      setShowAnalysis(false);
      toast("Health profile updated with analyzed data", "success");
      
      // Refresh profile local state
      const updatedSnap = await getDoc(profileRef);
      setProfile(updatedSnap.data());
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      setError('Failed to sync data to profile.');
    }
  };

  const updateHelperDebounced = useRef(
    (() => {
      let timeout: any;
      return (transcript: string) => {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
          try {
            const helper = await geminiService.getConsultationGuidance(transcript, profile?.healthData, { ...locationContext, regional: regionalContext });
            setConsultationHelper(helper);
          } catch (err) {
            console.error('Auto-helper update failed:', err);
          }
        }, 3000);
      };
    })()
  ).current;

  const processMessage = async (messageContent: string) => {
    if (!user || !sessionId) return;

    const userMessage = {
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      await updateDoc(doc(db, 'ayur_chats', sessionId), {
        messages: updatedMessages,
        updatedAt: serverTimestamp()
      });

      const aiResponse = await geminiService.aivedaDoctorChat(
        messageContent, 
        messages, 
        profile, 
        { ...locationContext, regional: regionalContext },
        biometrics
      );

      // Handle IoT Actions
      if (aiResponse.iotActions && aiResponse.iotActions.length > 0 && profile?.isIotSyncEnabled !== false) {
        aiResponse.iotActions.forEach((action: any) => {
          if (action.device === 'diffuser') {
            iotDiffuserService.triggerAroma(action.value, action.reason);
          }
        });

        setIotDevices((prev: any) => {
          const newDevices = { ...prev };
          aiResponse.iotActions.forEach((action: any) => {
            if (newDevices[action.device]) {
              newDevices[action.device] = {
                ...newDevices[action.device],
                status: 'on',
                mode: action.value,
                lastAction: action.reason
              };
            }
          });
          return newDevices;
        });
      }

      const modelMessage = {
        role: 'model',
        content: aiResponse.text,
        timestamp: new Date().toISOString(),
        iotActions: aiResponse.iotActions
      };

      const finalMessages = [...updatedMessages, modelMessage];
      
      await updateDoc(doc(db, 'ayur_chats', sessionId), {
        messages: finalMessages,
        updatedAt: serverTimestamp()
      });

      // Update Consultation Helper & Marketplace Recommendations
      if (consultationMode === 'live' || finalMessages.length % 3 === 0) {
        const transcript = finalMessages.map(m => `${m.role}: ${m.content}`).join('\n');
        
        // Mock catalog if DB is empty, otherwise use DB
        const productsSnap = await getDocs(collection(db, 'marketplace'));
        const products = productsSnap.docs.length > 0 
          ? productsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
          : [
              { id: '1', name: 'Triphala Churna', description: 'Digestive support.', category: 'Digestion' },
              { id: '2', name: 'Ashwagandha', description: 'Stress relief.', category: 'Vitality' }
            ];
            
        const services = [
          { id: 's7', name: 'Neural Chrono-Sync Rejuvenation', provider: 'ṚtuSyn Sanctuary HQ', type: 'Retreat', category: 'Ayurveda' },
          { id: 's1', name: 'Ayurvedic Wellness Retreat', provider: 'Himalayan Sanctuary', type: 'Retreat', category: 'Ayurveda' },
          { id: 's2', name: 'Thai Massage Therapy', provider: 'Zen Hands', type: 'Therapist', category: 'Thai' },
          { id: 's4', name: 'Integrative Physio', provider: 'Modern Health Hospital', type: 'Hospital', category: 'Physio' }
        ];

        const helper = await geminiService.getConsultationGuidance(transcript, profile?.healthData, { ...locationContext, regional: regionalContext }, { products, services });
        setConsultationHelper(helper);

        // Fetch marketplace products for recommendations
        const recs = await geminiService.recommendMarketplaceProducts(profile?.healthData, products);
        
        const detailedRecs = recs.map((r: any) => {
          const product = products.find(p => p.id === r.productId);
          return { ...r, ...product };
        });
        setRecommendedProducts(detailedRecs);
      }
    } catch (error) {
      console.error(error);
      setError('Failed to process message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      if (isRecording) {
        recognitionRef.current.stop();
        // The onend handler will set isRecording to false
      } else {
        setError(null);
        // Ensure we handle common errors like "already started" or "not-allowed"
        try {
          recognitionRef.current.start();
        } catch (e: any) {
          if (e.name === 'InvalidStateError' || e.message?.includes('already started')) {
            console.warn('Recognition already started');
            setIsRecording(true);
          } else {
            throw e;
          }
        }
      }
    } catch (err: any) {
      console.error('Speech recognition toggle error:', err);
      if (err.name === 'NotAllowedError' || err.message?.includes('not-allowed')) {
        setError('Microphone access denied. Please check your browser settings.');
      } else {
        setError('Failed to toggle speech recognition.');
      }
      setIsRecording(false);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const transcript = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const report = await geminiService.generateTreatmentSuggestions(transcript, profile?.healthData);
      setReportData(report);
      setShowReport(true);
    } catch (error) {
      console.error(error);
      setError('Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const generatePrescription = async () => {
    setLoading(true);
    try {
      const transcript = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const prescription = await geminiService.generatePrescription(transcript, profile?.healthData);
      setPrescriptionData(prescription);
      setShowPrescription(true);
    } catch (error) {
      console.error(error);
      setError('Failed to generate prescription.');
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    if (!user || !sessionId) return;
    try {
      // Generate summary before clearing if there are messages
      if (messages.length > 2) {
        const transcript = messages.map(m => `${m.role}: ${m.content}`).join('\n');
        const summary = await geminiService.generateConsultationSummary(transcript, profile?.healthData);
        await updateDoc(doc(db, 'ayur_chats', sessionId), {
          summary: summary,
          updatedAt: serverTimestamp()
        });
      }

      await updateDoc(doc(db, 'ayur_chats', sessionId), {
        messages: [],
        updatedAt: serverTimestamp()
      });
      setMessages([]);
      setShowMoodSelector(true);
    } catch (error) {
      console.error(error);
      setError('Failed to clear chat.');
    }
  };

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'ayur_chats'),
        where('uid', '==', user.uid),
        orderBy('updatedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const sessions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPastSessions(sessions);
      setShowHistory(true);
    } catch (error) {
      console.error(error);
      setError('Failed to fetch consultation history.');
    } finally {
      setLoading(false);
    }
  };

  const moods = [
    { name: 'Balanced', icon: Smile, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { name: 'Low Energy', icon: Frown, color: 'text-blue-500', bg: 'bg-blue-50' },
    { name: 'High Heat', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
    { name: 'Restless', icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="h-[calc(100vh-120px)] sm:h-[calc(100vh-160px)] flex flex-col relative">
      <div className="flex-1 flex gap-0 lg:gap-8 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white rounded-[40px] border border-[#D1D1C1]/50 shadow-sm overflow-hidden relative z-10 w-full">
          {/* Chat Header */}
          <div className="p-4 sm:p-6 border-b border-[#D1D1C1]/30 bg-[#F5F5F0]/50 backdrop-blur-md flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#5A5A40] flex items-center justify-center text-white shadow-lg shrink-0">
                <Bot size={20} className="sm:w-[24px]" />
              </div>
              <div className="overflow-hidden">
                <h2 className="text-base sm:text-xl font-serif font-bold text-[#5A5A40] truncate">Consultation</h2>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] sm:text-[10px] uppercase tracking-widest font-bold text-[#5A5A40]/50">AI Doctor</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={() => setShowContextSidebar(!showContextSidebar)}
                className="lg:hidden p-2 sm:p-3 hover:bg-[#D1D1C1]/30 rounded-xl text-[#5A5A40] transition-colors"
                title="Context"
              >
                <Info size={18} />
              </button>
              <button 
                onClick={() => setShowHistory(true)}
                className="p-2 sm:p-3 hover:bg-[#D1D1C1]/30 rounded-xl text-[#5A5A40] transition-colors"
                title="History"
              >
                <History size={18} />
              </button>
              <button 
                onClick={clearChat}
                className="p-2 sm:p-3 hover:bg-red-50 rounded-xl text-red-400 hover:text-red-600 transition-colors"
                title="Clear Session"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          {/* Error Toast */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2"
              >
                <AlertCircle size={14} />
                {error}
                <button onClick={() => setError(null)} className="ml-2 hover:opacity-60">
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <div className="flex-1 overflow-hidden relative">
            <Virtuoso
              ref={virtuosoRef}
              data={messages}
              followOutput="smooth"
              atBottomStateChange={setAtBottom}
              initialTopMostItemIndex={messages.length > 0 ? messages.length - 1 : 0}
              className="scrollbar-hide"
              style={{ height: '100%' }}
              itemContent={(index, msg) => (
                <ChatMessage 
                  msg={msg} 
                  isUser={msg.role === 'user'} 
                  onIotAction={handleIotAction} 
                />
              )}
              components={{
                Footer: () => (
                  <div className="p-4 sm:p-8 pt-0">
                    {loading && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-4 mb-4"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#5A5A40] flex items-center justify-center text-white shadow-lg">
                          <Loader2 size={18} className="animate-spin" />
                        </div>
                        <div className="bg-white border border-[#D1D1C1]/30 p-6 rounded-[2rem] rounded-tl-none shadow-sm flex items-center gap-3">
                          <div className="flex gap-1 shrink-0">
                            <span className="w-1.5 h-1.5 bg-[#5A5A40]/30 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-[#5A5A40]/30 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 bg-[#5A5A40]/30 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                          <span className="text-xs font-serif italic text-[#5A5A40]/60">Consulting Sacred Texts...</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )
              }}
            />

            <AnimatePresence>
              {!atBottom && messages.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-6 right-6 p-3 bg-[#5A5A40] text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-20 flex items-center justify-center"
                >
                  <ArrowDown size={20} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <div className="p-4 sm:p-8 bg-[#F5F5F0]/30 backdrop-blur-md border-t border-[#D1D1C1]/30 shrink-0">
            <div className="max-w-4xl mx-auto relative group">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Describe symptoms..."
                className="w-full bg-white border border-[#D1D1C1] rounded-[1.5rem] sm:rounded-[2rem] py-3 sm:py-5 px-4 sm:px-8 pr-24 sm:pr-32 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] transition-all resize-none h-16 sm:h-20 shadow-lg"
              />
              <div className="absolute right-2 sm:right-4 bottom-2 sm:bottom-4 flex items-center gap-1 sm:gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".pdf,.jpg,.jpeg,.png,.txt" 
                />
                <button 
                  onClick={toggleRecording}
                  className={cn(
                    "p-2 sm:p-3 rounded-xl transition-all",
                    isRecording ? "bg-red-500 text-white animate-pulse" : "bg-[#F5F5F0] text-[#5A5A40] hover:bg-[#D1D1C1]"
                  )}
                  title={isRecording ? "Stop Recording" : "Start Transcription"}
                >
                  {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="p-2 sm:p-3 bg-[#5A5A40] text-white rounded-xl hover:bg-[#4A4A30] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center justify-center gap-3 sm:gap-6 text-[8px] sm:text-[10px] uppercase tracking-widest font-bold text-[#5A5A40]/40 overflow-x-auto whitespace-nowrap scrollbar-hide">
              <button onClick={() => setShowSensoryInput(true)} className="hover:text-[#5A5A40] transition-colors flex items-center gap-1 sm:gap-1.5">
                <Sparkles size={10} /> Sensory Input
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="hover:text-[#5A5A40] transition-colors flex items-center gap-1 sm:gap-1.5">
                <FileUp size={10} /> Reports
              </button>
              <button onClick={() => setShowMoodSelector(true)} className="hover:text-[#5A5A40] transition-colors flex items-center gap-1 sm:gap-1.5">
                <Smile size={10} /> Mood
              </button>
              <button onClick={handleCuratePackage} className="hover:text-[#5A5A40] transition-colors flex items-center gap-1 sm:gap-1.5">
                <Palmtree size={10} /> Curate Package
              </button>
              <button onClick={generateYogaFlow} className="hover:text-[#5A5A40] transition-colors flex items-center gap-1 sm:gap-1.5">
                <Activity size={10} /> Yoga Flow
              </button>
            </div>
          </div>
        </div>

        {/* Context Sidebar */}
        <AnimatePresence>
          {(showContextSidebar || window.innerWidth >= 1024) && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed lg:static right-0 top-0 bottom-0 w-80 sm:w-96 lg:w-96 bg-[#F5F5F0] lg:bg-transparent z-50 lg:z-0 lg:flex flex-col gap-6 p-6 lg:p-0 shadow-2xl lg:shadow-none"
            >
              <div className="flex lg:hidden items-center justify-between mb-4">
                <h3 className="font-bold text-[#5A5A40]">Health Context</h3>
                <button onClick={() => setShowContextSidebar(false)} className="p-2 text-[#5A5A40]">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-6 scrollbar-hide">
                {/* Proactive Dinacharya Ritual */}
                {dinacharyaInsight && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[40px] border border-[#D1D1C1]/50 shadow-sm overflow-hidden"
                  >
                    <div className="p-6 bg-amber-50/50 border-b border-amber-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-700">
                        <Sun size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Dinacharya Ritual</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-600/60 uppercase">{dinacharyaInsight.category}</span>
                    </div>
                    <div className="p-6 sm:p-8 space-y-4">
                      <h3 className="text-lg font-serif font-bold text-[#5A5A40]">{dinacharyaInsight.title}</h3>
                      <p className="text-sm text-[#5A5A40]/70 leading-relaxed italic">
                        {dinacharyaInsight.ritual}
                      </p>
                      
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <div className="flex items-center gap-2 text-emerald-700 mb-1">
                          <Activity size={12} />
                          <span className="text-[9px] font-bold uppercase tracking-widest">Scientific Insight</span>
                        </div>
                        <p className="text-[10px] text-emerald-900/60">{dinacharyaInsight.modernBenefit}</p>
                      </div>

                      <button 
                        onClick={() => toast("Added to your daily tracker!", "success")}
                        className="w-full py-3 bg-[#5A5A40] text-white rounded-2xl font-bold text-[10px] hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-2"
                      >
                        <Check size={14} /> {dinacharyaInsight.actionableTip}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Health Context */}
                <div className="bg-white rounded-[40px] border border-[#D1D1C1]/50 shadow-sm p-6 sm:p-8 space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-[#5A5A40]/50 flex items-center gap-2">
                    <Activity size={16} /> Health Context
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-[#F5F5F0] rounded-2xl border border-[#D1D1C1]/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase text-[#5A5A40]/60">Current Mood</span>
                        <Smile size={14} className="text-amber-500" />
                      </div>
                      <p className="text-sm font-serif font-bold text-[#5A5A40]">{profile?.mood || 'Calm'}</p>
                    </div>

                    <div className="p-4 bg-[#F5F5F0] rounded-2xl border border-[#D1D1C1]/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase text-[#5A5A40]/60">Location Context</span>
                        <MapPin size={14} className="text-emerald-500" />
                      </div>
                      <p className="text-sm font-serif font-bold text-[#5A5A40]">{regionalContext || 'Global'}</p>
                      <p className="text-[10px] text-[#5A5A40]/40 mt-1 italic">
                        {locationContext && typeof locationContext === 'object' 
                          ? `${locationContext.lat.toFixed(2)}°, ${locationContext.lng.toFixed(2)}°` 
                          : 'Awaiting data...'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[#D1D1C1]/30">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/50 mb-4">IoT Environment</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(iotDevices).map(([key, device]: [string, any]) => (
                        <button
                          key={key}
                          onClick={() => handleIotAction({ device: key, mode: device.status === 'on' ? 'off' : 'on' })}
                          className={cn(
                            "p-3 rounded-2xl border transition-all flex flex-col gap-1 text-left",
                            device.status === 'on' 
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                              : "bg-[#F5F5F0] border-[#D1D1C1]/30 text-[#5A5A40]/40"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            {key === 'diffuser' && <Droplets size={14} />}
                            {key === 'shower' && <Droplets size={14} />}
                            {key === 'air_purifier' && <Wind size={14} />}
                            {key === 'lighting' && <Lightbulb size={14} />}
                            <Power size={12} className={device.status === 'on' ? "text-emerald-500" : "text-[#5A5A40]/20"} />
                          </div>
                          <span className="text-[10px] font-bold capitalize">{key.replace('_', ' ')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Consultation Guidance */}
                {consultationHelper && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#5A5A40] rounded-[40px] p-6 sm:p-8 text-white shadow-xl flex flex-col"
                  >
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50 flex items-center gap-2 mb-4">
                      <Stethoscope size={16} /> Clinical Helper
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Suggested Questions</p>
                        {consultationHelper.suggestedQuestions.map((q: any, i: number) => (
                          <button
                            key={i}
                            onClick={() => setInput(q.question)}
                            className="w-full text-left p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all group"
                          >
                            <p className="text-[11px] font-bold mb-1 group-hover:text-emerald-300">{q.question}</p>
                            <p className="text-[9px] text-white/40 italic">{q.rationale}</p>
                          </button>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Observations</p>
                        {consultationHelper.suggestedObservations.map((o: any, i: number) => (
                          <div key={i} className="p-3 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-[11px] font-bold mb-1">{o.observation}</p>
                            <p className="text-[9px] text-white/40">{o.rationale}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={generateReport}
                          className="w-full py-3 bg-white text-[#5A5A40] rounded-2xl font-bold text-[10px] hover:bg-emerald-50 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          <FileText size={14} /> Full Treatment Report
                        </button>
                        <button 
                          onClick={generatePrescription}
                          className="w-full py-3 bg-[#1A1A15] text-[#A8D5BA] rounded-2xl font-bold text-[10px] hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          <ClipboardList size={14} /> Clinical Prescription
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showMoodSelector && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden p-12 text-center"
            >
              <div className="w-20 h-20 bg-[#F5F5F0] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Smile size={40} className="text-[#5A5A40]" />
              </div>
              <h2 className="text-3xl font-serif font-bold text-[#5A5A40] mb-4">How are you feeling?</h2>
              <p className="text-[#2D3436]/60 italic mb-12">Your current state helps Aiveda provide more accurate guidance.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {moods.map((mood) => (
                  <button
                    key={mood.name}
                    onClick={() => handleMoodSelect(mood.name)}
                    className={cn(
                      "p-6 rounded-3xl border border-[#D1D1C1]/50 transition-all flex flex-col items-center gap-4 group",
                      mood.bg,
                      "hover:shadow-xl hover:-translate-y-1"
                    )}
                  >
                    <mood.icon size={32} className={cn("transition-transform group-hover:scale-110", mood.color)} />
                    <span className="text-xs font-bold text-[#5A5A40]">{mood.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {showSensoryInput && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden p-12"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                    <Sparkles size={24} />
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-[#5A5A40]">Sensory Input</h2>
                </div>
                <button onClick={() => setShowSensoryInput(false)} className="p-2 hover:bg-[#F5F5F0] rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-sm text-[#2D3436]/60 italic mb-6">
                Describe physical observations like tongue coating, skin texture, or body temperature for a deeper analysis.
              </p>

              <textarea
                value={sensoryFeedback}
                onChange={(e) => setSensoryFeedback(e.target.value)}
                placeholder="e.g., My tongue has a white coating this morning and my skin feels unusually dry..."
                className="w-full h-40 p-6 bg-[#F5F5F0] border border-[#D1D1C1]/50 rounded-3xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 resize-none text-sm mb-6"
              />

              <button
                onClick={handleSensorySubmit}
                disabled={loading || !sensoryFeedback.trim()}
                className="w-full py-4 bg-[#5A5A40] text-white rounded-2xl font-bold hover:bg-[#4A4A30] transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Activity size={20} />}
                Analyze Sensory Data
              </button>
            </motion.div>
          </div>
        )}

        {showReport && reportData && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-[#D1D1C1]/30 bg-[#F5F5F0]/50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#5A5A40] rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <FileText size={24} />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#5A5A40]">Consultation Report</h3>
                </div>
                <button onClick={() => setShowReport(false)} className="p-2 hover:bg-white rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide">
                <section className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40 border-b border-[#D1D1C1]/30 pb-2">Diagnostic Impression</h4>
                  <p className="text-lg font-serif text-[#5A5A40] leading-relaxed italic">
                    "{reportData.diagnosticImpression}"
                  </p>
                </section>

                <div className="grid grid-cols-2 gap-12">
                  <section className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/60 border-b border-emerald-100 pb-2">Lifestyle Recommendations</h4>
                    <ul className="space-y-4">
                      {reportData.lifestyle.map((l: any, i: number) => (
                        <li key={i} className="flex gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                          <div>
                            <p className="text-sm text-[#5A5A40] font-medium">{l.text}</p>
                            <p className="text-[10px] text-[#5A5A40]/40 mt-1">Confidence: {l.confidenceScore}%</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-600/60 border-b border-amber-100 pb-2">Dietary Guidance</h4>
                    <ul className="space-y-4">
                      {reportData.dietary.map((d: any, i: number) => (
                        <li key={i} className="flex gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                          <div>
                            <p className="text-sm text-[#5A5A40] font-medium">{d.text}</p>
                            <p className="text-[10px] text-[#5A5A40]/40 mt-1">Confidence: {d.confidenceScore}%</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </div>

              <div className="p-8 bg-[#F5F5F0]/50 border-t border-[#D1D1C1]/30 flex gap-4">
                <button className="flex-1 py-4 bg-[#5A5A40] text-white rounded-2xl font-bold hover:bg-[#4A4A30] transition-all shadow-lg">
                  Download PDF Report
                </button>
                <button className="flex-1 py-4 border border-[#D1D1C1] text-[#5A5A40] rounded-2xl font-bold hover:bg-white transition-all">
                  Sync to Health Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showPrescription && prescriptionData && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-[#D1D1C1]/30 bg-[#F5F5F0]/50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <ClipboardList size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-[#5A5A40]">Integrated Prescription</h3>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-[#5A5A40]/40">Rx ID: {prescriptionData.prescriptionId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="text-right hidden sm:block">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">Prescription Date</p>
                     <p className="text-xs font-bold text-[#5A5A40]">{prescriptionData.date || new Date().toLocaleDateString()}</p>
                   </div>
                   <button onClick={() => setShowPrescription(false)} className="p-2 hover:bg-white rounded-full transition-all">
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 sm:p-12 space-y-12 scrollbar-hide">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <div className="md:col-span-2 space-y-8">
                    <section className="space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40 border-b border-[#D1D1C1]/30 pb-2">Diagnostic Summary</h4>
                      <p className="text-base font-serif text-[#5A5A40] leading-relaxed italic">
                        "{prescriptionData.diagnosticSummary}"
                      </p>
                    </section>

                    <section className="space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/60 border-b border-emerald-100 pb-2">Medications & Supplements</h4>
                      <div className="space-y-4">
                        {prescriptionData.medications.map((m: any, i: number) => (
                          <div key={i} className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 relative group">
                            <div className="flex justify-between items-start mb-3">
                              <h5 className="text-lg font-bold text-emerald-900">{m.name}</h5>
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold uppercase tracking-widest">{m.frequency}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                              <div>
                                <p className="text-[10px] font-bold text-emerald-900/40 uppercase tracking-widest">Dosage</p>
                                <p className="font-bold text-emerald-800">{m.dosage}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-emerald-900/40 uppercase tracking-widest">Duration</p>
                                <p className="font-bold text-emerald-800">{m.duration || 'As directed'}</p>
                              </div>
                            </div>
                            <div className="pt-3 border-t border-emerald-200/50">
                               <p className="text-xs text-emerald-900/60 italic font-medium">"{m.instructions}"</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="space-y-8">
                    <section className="space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-600/60 border-b border-amber-100 pb-2">Lifestyle & Diet</h4>
                      <ul className="space-y-4">
                        {prescriptionData.lifestyleDietary.map((item: string, i: number) => (
                          <li key={i} className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                            <p className="text-xs text-[#5A5A40] font-medium leading-relaxed">{item}</p>
                          </li>
                        ))}
                      </ul>
                    </section>

                    <div className="p-6 bg-[#F5F5F0] rounded-3xl border border-[#D1D1C1]/50 space-y-4">
                      <div className="flex items-center gap-2 text-[#5A5A40]">
                        <Heart size={16} />
                        <h5 className="font-bold uppercase tracking-widest text-[10px]">Doctor's Advice</h5>
                      </div>
                      <p className="text-xs text-[#5A5A40]/80 italic leading-relaxed">
                        {prescriptionData.advice}
                      </p>
                    </div>

                    <div className="p-6 bg-sky-50 rounded-3xl border border-sky-100 space-y-2">
                       <h5 className="font-bold uppercase tracking-widest text-[10px] text-sky-700">Next Review</h5>
                       <p className="text-xs font-bold text-sky-900">{prescriptionData.followUp}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-emerald-50/50 border-t border-emerald-100 flex gap-4 shrink-0 overflow-x-auto no-scrollbar">
                <button 
                  onClick={async () => {
                    if (!user || !prescriptionData) return;
                    try {
                      await vaultService.saveItem(
                        user.uid,
                        'prescription',
                        `Prescription for ${prescriptionData.diagnosticSummary.split(' ').slice(0, 3).join(' ')}...`,
                        prescriptionData,
                        `https://picsum.photos/seed/${prescriptionData.prescriptionId}/800/600`,
                        `Integrated clinical prescription from consultation session.`
                      );
                      toast("Prescription saved to your Sacred Vault!", "success");
                    } catch (err) {
                      console.error(err);
                      toast("Failed to archive prescription.", "error");
                    }
                  }}
                  className="flex-1 min-w-[140px] py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                   <Archive size={18} /> Archive in Vault
                </button>
                <button className="flex-1 min-w-[140px] py-4 border border-emerald-200 text-emerald-700 rounded-2xl font-bold hover:bg-white transition-all flex items-center justify-center gap-2">
                   <FileText size={18} /> Download PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showAnalysis && documentAnalysis && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-[#D1D1C1]/30 bg-[#F5F5F0]/50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <FileUp size={24} />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#5A5A40]">Document Analysis</h3>
                </div>
                <button onClick={() => setShowAnalysis(false)} className="p-2 hover:bg-white rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide">
                <section className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#D1D1C1]/30 pb-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">Analysis Summary</h4>
                    <button 
                      onClick={() => setIsEditingAnalysis(!isEditingAnalysis)}
                      className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 hover:text-indigo-700 flex items-center gap-1"
                    >
                      {isEditingAnalysis ? <><Save size={12} /> Lock Summary</> : <><Edit3 size={12} /> Correct Summary</>}
                    </button>
                  </div>
                  {isEditingAnalysis ? (
                    <textarea 
                      value={editedDocAnalysis.summary}
                      onChange={(e) => setEditedDocAnalysis({...editedDocAnalysis, summary: e.target.value})}
                      className="w-full text-lg font-serif text-[#5A5A40] leading-relaxed italic bg-[#F5F5F0] border-none rounded-xl p-4 focus:ring-1 focus:ring-indigo-500 outline-none h-32 resize-none"
                    />
                  ) : (
                    <p className="text-lg font-serif text-[#5A5A40] leading-relaxed italic">
                      "{documentAnalysis.summary}"
                    </p>
                  )}
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <section className="space-y-6">
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-600/60">Key Findings</h4>
                    </div>
                    {isEditingAnalysis ? (
                      <div className="space-y-3">
                        {editedDocAnalysis.keyFindings.map((finding: string, i: number) => (
                          <div key={i} className="flex gap-2">
                            <input 
                              type="text"
                              value={finding}
                              onChange={(e) => {
                                const newFindings = [...editedDocAnalysis.keyFindings];
                                newFindings[i] = e.target.value;
                                setEditedDocAnalysis({...editedDocAnalysis, keyFindings: newFindings});
                              }}
                              className="w-full text-sm text-[#5A5A40] bg-[#F5F5F0] border-none rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ul className="space-y-4">
                        {documentAnalysis.keyFindings.map((finding: string, i: number) => (
                          <li key={i} className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                            <p className="text-sm text-[#5A5A40] font-medium leading-relaxed">{finding}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className="space-y-6">
                    <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-600/60">Ayurvedic Perspective</h4>
                    </div>
                    {isEditingAnalysis ? (
                      <textarea 
                        value={editedDocAnalysis.ayurvedicPerspective}
                        onChange={(e) => setEditedDocAnalysis({...editedDocAnalysis, ayurvedicPerspective: e.target.value})}
                        className="w-full p-6 bg-amber-50 rounded-3xl border border-amber-100 italic text-sm text-amber-900 leading-relaxed shadow-inner h-40 resize-none outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    ) : (
                      <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 italic text-sm text-amber-900 leading-relaxed shadow-inner">
                        {documentAnalysis.ayurvedicPerspective}
                      </div>
                    )}
                  </section>
                </div>

                <section className="space-y-4 pt-6 border-t border-[#D1D1C1]/30">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40 pb-2">Extracted Data for Profile Sync</h4>
                    <span className="text-[9px] text-amber-600 font-bold uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <Zap size={10} /> Correct any AI inaccuracies below
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-4 bg-[#F5F5F0] rounded-2xl border border-[#D1D1C1]/30">
                      <p className="text-[10px] font-bold uppercase text-[#5A5A40]/50 mb-1">Medical history</p>
                      <textarea
                        value={editedDocAnalysis?.profileUpdates?.medicalHistory || ''}
                        onChange={(e) => setEditedDocAnalysis({
                          ...editedDocAnalysis,
                          profileUpdates: { ...editedDocAnalysis.profileUpdates, medicalHistory: e.target.value }
                        })}
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs font-bold text-[#5A5A40] resize-none h-16 scrollbar-hide"
                        placeholder="None detected"
                      />
                    </div>
                    <div className="p-4 bg-[#F5F5F0] rounded-2xl border border-[#D1D1C1]/30">
                      <p className="text-[10px] font-bold uppercase text-[#5A5A40]/50 mb-1">Allergies</p>
                      <textarea
                        value={editedDocAnalysis?.profileUpdates?.allergies || ''}
                        onChange={(e) => setEditedDocAnalysis({
                          ...editedDocAnalysis,
                          profileUpdates: { ...editedDocAnalysis.profileUpdates, allergies: e.target.value }
                        })}
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs font-bold text-[#5A5A40] resize-none h-16 scrollbar-hide"
                        placeholder="None detected"
                      />
                    </div>
                    <div className="p-4 bg-[#F5F5F0] rounded-2xl border border-[#D1D1C1]/30">
                      <p className="text-[10px] font-bold uppercase text-[#5A5A40]/50 mb-1">Medications</p>
                      <textarea
                        value={editedDocAnalysis?.profileUpdates?.medications || ''}
                        onChange={(e) => setEditedDocAnalysis({
                          ...editedDocAnalysis,
                          profileUpdates: { ...editedDocAnalysis.profileUpdates, medications: e.target.value }
                        })}
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs font-bold text-[#5A5A40] resize-none h-16 scrollbar-hide"
                        placeholder="None detected"
                      />
                    </div>
                  </div>
                </section>
              </div>

              <div className="p-8 bg-[#F5F5F0]/50 border-t border-[#D1D1C1]/30 flex gap-4 shrink-0">
                <button 
                  onClick={syncToProfile}
                  className="flex-1 py-4 bg-[#5A5A40] text-white rounded-2xl font-bold hover:bg-[#4A4A30] transition-all shadow-lg flex items-center justify-center gap-2"
                >
                   <Check size={20} /> Sync with Health Profile
                </button>
                <button 
                  onClick={() => setShowAnalysis(false)}
                  className="flex-1 py-4 border border-[#D1D1C1] text-[#5A5A40] rounded-2xl font-bold hover:bg-white transition-all"
                >
                  Dismiss Results
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showHistory && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#F5F5F0] w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-[#D1D1C1]/30 bg-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#E8E8E0] rounded-2xl flex items-center justify-center text-[#5A5A40]">
                    <History size={24} />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#5A5A40]">Consultation History</h3>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-[#F5F5F0] rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-hide">
                {pastSessions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                    <History size={64} className="mb-4" />
                    <p className="text-lg font-serif">No past consultations found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pastSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => {
                          setSessionId(session.id);
                          setMessages(session.messages || []);
                          setShowHistory(false);
                        }}
                        className="bg-white p-6 rounded-[2rem] border border-[#D1D1C1]/30 text-left hover:shadow-xl hover:-translate-y-1 transition-all group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                            {session.updatedAt?.toDate().toLocaleDateString()}
                          </span>
                          <span className="text-[10px] font-bold text-[#5A5A40]/40">
                            {session.messages?.length || 0} Messages
                          </span>
                        </div>
                        <p className="text-sm font-serif font-bold text-[#5A5A40] line-clamp-2 mb-2 group-hover:text-emerald-700 transition-colors">
                          {session.summary?.overallSummary || 'Consultation Session'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {session.summary?.diagnoses?.slice(0, 2).map((d: string, i: number) => (
                            <span key={i} className="text-[8px] font-bold uppercase tracking-wider bg-[#F5F5F0] text-[#5A5A40]/60 px-2 py-0.5 rounded-full">
                              {d}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {showYogaFlow && yogaFlowData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#5A5A40]/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#FCFCF8] w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-[#D1D1C1]"
            >
              <div className="p-6 sm:p-8 border-b border-[#D1D1C1]/30 bg-[#F5F5F0] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#5A5A40] shadow-sm">
                    <Activity size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#5A5A40]">Personalized Yoga Manifest</h2>
                    <p className="text-[10px] text-[#5A5A40]/50 font-bold uppercase tracking-widest">{yogaFlowData.title}</p>
                  </div>
                </div>
                <button onClick={() => setShowYogaFlow(false)} className="p-3 hover:bg-white rounded-2xl text-[#5A5A40] transition-all">
                  <X />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-12 space-y-12 scrollbar-hide">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h3 className="text-2xl font-serif font-bold text-[#5A5A40]">The Clinical Sequence</h3>
                      <p className="text-[#2D3436] opacity-70 leading-relaxed text-sm italic">{yogaFlowData.description}</p>
                    </div>

                    <div className="space-y-4">
                      {yogaFlowData.asanas.map((asana: any, i: number) => (
                        <div key={i} className="p-5 bg-white rounded-3xl border border-[#D1D1C1]/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">0{i+1}: {asana.name}</span>
                            <span className="px-2 py-0.5 bg-[#5A5A40]/5 rounded-full text-[8px] font-bold text-[#5A5A40]/60">BIOMECHANICALLY SYNCED</span>
                          </div>
                          <p className="text-xs text-[#2D3436]/60 leading-relaxed">{asana.benefit}</p>
                          <div className="flex items-center gap-2 pt-2 text-[9px] font-medium text-[#5A5A40]/80 italic">
                            <Wind size={10} /> {asana.breathing}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 bg-[#5A5A40]/5 rounded-[32px] border border-[#5A5A40]/10">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] mb-2 flex items-center gap-2">
                        <Moon size={12} /> Biological Impact
                      </h4>
                      <p className="text-xs text-[#2D3436]/70 leading-relaxed italic">{yogaFlowData.subDoshaImpact}</p>
                    </div>
                  </div>

                  <div className="space-y-6 lg:sticky lg:top-0">
                    <YogaFlowAnimator 
                      manifest={yogaFlowData.animationManifest} 
                      searchQuery={yogaFlowData.videoSearchQuery} 
                      title={yogaFlowData.title}
                    />
                    
                    <div className="p-6 bg-white rounded-[32px] border border-[#D1D1C1]/50 space-y-4 shadow-inner">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/50">Integrated Protocol</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-medium text-[#2D3436]">
                          <span>Neural Sync</span>
                          <span className="text-emerald-500">Active</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium text-[#2D3436]">
                          <span>Sonic Entrainment</span>
                          <span className="text-emerald-500">432Hz</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium text-[#2D3436]">
                          <span>Visual Guidance</span>
                          <span className="text-amber-500">Dynamic</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
