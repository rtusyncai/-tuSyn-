import React, { Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import { OrbitControls, Stars, Float, MeshDistortMaterial, Sphere, Text } from '@react-three/drei';
import { useVision } from '../hooks/useVision';
import { useAuth } from '../hooks/useAuth';
import { useBiometrics } from '../hooks/useBiometrics';
import { deviceSyncService, ConnectedDevice } from '../services/deviceSyncService';
import { neuroSyncService, NeuroProfile } from '../services/neuroSyncService';
import { NeuroHUD } from './NeuroSyncOverlay';
import { motion, AnimatePresence } from 'motion/react';
import { Battery, Zap, Activity, Info, Scan, Wifi, Globe, ShieldCheck, Bluetooth } from 'lucide-react';
import { cn } from '../lib/utils';

const xrStore = createXRStore();

const GlassesHUD = () => {
    const { user } = useAuth();
    const { data: bio, isSyncing } = useBiometrics();
    const [bridgedDevices, setBridgedDevices] = React.useState<ConnectedDevice[]>([]);
    
    // Derived/Simulated local stats that aren't in core biometrics yet
    const [localStats, setLocalStats] = React.useState({
        respiration: 14,
        agni: 70,
        ojas: 85
    });

    React.useEffect(() => {
        if (user) {
            deviceSyncService.getUserDevices(user.uid).then(setBridgedDevices);
        }
        
        const interval = setInterval(() => {
            setLocalStats(prev => ({
                respiration: Math.floor(12 + Math.random() * 6),
                agni: Math.min(100, Math.max(0, prev.agni + (Math.random() - 0.5) * 4)),
                ojas: Math.min(100, Math.max(0, prev.ojas + (Math.random() - 0.5) * 2))
            }));
        }, 3000);

        return () => clearInterval(interval);
    }, [user]);

    const activeGlasses = bridgedDevices.find(d => d.type === 'glasses');
    const activeWatch = bridgedDevices.find(d => d.type === 'watch' || d.type === 'ring');

    return (
        <div className="fixed inset-0 pointer-events-none p-6 sm:p-10 flex flex-col justify-between border-[2px] border-emerald-500/10 mix-blend-screen overflow-hidden">
            {/* Corner Brackets */}
            <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-emerald-500 opacity-40" />
            <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-emerald-500 opacity-40" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-emerald-500 opacity-40" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-emerald-500 opacity-40" />

            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-4">
                    <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/20">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                             <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                                {activeGlasses ? `Neural Link: ${activeGlasses.brand.toUpperCase()} ACTIVE` : 'Neural Link: SYNCED'}
                             </span>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[8px] opacity-40 uppercase">Agni (Metabolic Heat)</span>
                                <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden mt-1">
                                    <motion.div animate={{ width: `${localStats.agni}%` }} className="h-full bg-orange-500" />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] opacity-40 uppercase">Ojas (Vitality)</span>
                                <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden mt-1">
                                    <motion.div animate={{ width: `${localStats.ojas}%` }} className="h-full bg-emerald-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/20 max-w-xs hidden xs:flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-emerald-400">
                                <Activity size={12} />
                                <span className="text-[10px] font-bold uppercase">Spanda Telemetry</span>
                            </div>
                            {activeWatch && (
                                <span className="text-[8px] font-bold text-emerald-500/60 uppercase tracking-tighter">Live from {activeWatch.brand}</span>
                            )}
                        </div>
                        <div className="flex flex-col gap-3">
                             <div className="flex justify-between items-end">
                                <div className="flex flex-col">
                                    <span className="text-[8px] opacity-40 uppercase">Heart Rhythm</span>
                                    <span className="text-lg font-mono text-white leading-none">{bio.heartRate} <span className="text-[10px] opacity-40">BPM</span></span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-[8px] opacity-40 uppercase">Prana Load</span>
                                    <span className={cn(
                                        "text-lg font-mono leading-none",
                                        bio.stressLevel > 0.7 ? "text-rose-400" : bio.stressLevel > 0.4 ? "text-amber-400" : "text-emerald-400"
                                    )}>
                                        {Math.round(bio.stressLevel * 100)}%
                                    </span>
                                </div>
                             </div>
                             <div className="flex flex-col gap-1">
                                <div className="text-[8px] opacity-40 uppercase flex justify-between">
                                    <span>Stress Gradient</span>
                                    <span>{bio.stressLevel > 0.7 ? 'CRITICAL' : 'HARMONIC'}</span>
                                </div>
                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                    <motion.div 
                                        animate={{ width: `${bio.stressLevel * 100}%` }}
                                        className={cn(
                                            "h-full transition-colors",
                                            bio.stressLevel > 0.7 ? "bg-rose-500" : bio.stressLevel > 0.4 ? "bg-amber-400" : "bg-emerald-500"
                                        )}
                                    />
                                </div>
                             </div>
                             <div className="flex justify-between items-center text-[10px]">
                                <span className="opacity-40 uppercase">Ambient Temp</span>
                                <span className="font-mono text-white">{bio.ambientTemperature}°C</span>
                             </div>
                        </div>
                    </div>

                    {activeGlasses && (
                        <div className="bg-[#5A5A40]/40 backdrop-blur-md p-4 rounded-2xl border border-[#A8D5BA]/20 flex items-center gap-3">
                            <Bluetooth size={14} className="text-[#A8D5BA] animate-pulse" />
                            <div className="flex flex-col">
                                <span className="text-[8px] opacity-60 uppercase text-[#D1D1C1]">Active Bridge</span>
                                <span className="text-[10px] font-bold text-white">{activeGlasses.model}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-end gap-2 text-white">
                    <div className="flex items-center gap-3 text-emerald-400/60 font-mono text-[10px]">
                        <Globe size={12} />
                        <span className="hidden sm:inline">LOC: 8.4095° S, 115.1889° E</span>
                    </div>
                    <div className="flex items-center gap-3 text-emerald-400 font-mono text-[10px]">
                        <Zap size={12} />
                        <span>BAT: 94%</span>
                    </div>
                </div>
            </div>

            {/* Central Reticle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="w-48 h-48 border border-emerald-500/20 rounded-full flex items-center justify-center"
                >
                    <div className="w-4 h-4 border-t border-l border-emerald-500/40" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-2 bg-emerald-500/40" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-2 bg-emerald-500/40" />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[1px] w-2 bg-emerald-500/40" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[1px] w-2 bg-emerald-500/40" />
                </motion.div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Scan className="text-emerald-500 animate-pulse" size={24} />
                    <span className="text-[8px] font-mono text-emerald-500 mt-2 tracking-tighter opacity-60">SCANNING PRANA</span>
                </div>
            </div>

            <div className="flex justify-between items-end">
                <div className="flex flex-col gap-2 max-w-sm">
                    <div className="flex items-center gap-2 text-[#FFD700] mb-1">
                        <ShieldCheck size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Environmental Awareness</span>
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={Math.floor(localStats.agni / 10)} 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-black/70 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border-l-[4px] border-l-[#FFD700] border border-[#FFD700]/20"
                        >
                            <h4 className="text-xs sm:text-sm font-bold text-white mb-2 underline decoration-[#FFD700]/40">
                                {localStats.agni > 75 
                                    ? "High Thermal Agni Detected." 
                                    : bio.heartRate > 80 
                                        ? "Sympathetic Activation Detected." 
                                        : "Atmospheric Saturation Detected."}
                            </h4>
                            <p className="text-[10px] sm:text-xs text-white/70 italic leading-relaxed font-serif">
                                {localStats.agni > 75 
                                    ? "Your inner heat is peaking. Nearby cooling scents (Sandalwood, Rose) are recommended to prevent Pitta aggravation."
                                    : bio.heartRate > 80
                                        ? "Neural activity indicates mild stress. Adjusting lens filtration to amber hues to maximize melatonin precursors."
                                        : `Atmospheric temperature is ${bio.ambientTemperature}°C. High humidity and aromatic compounds from nearby flora are increasing 'Kapha' density.`}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="flex flex-col items-end gap-2 p-4 border border-white/10 rounded-3xl bg-black/40 backdrop-blur-sm hidden md:flex">
                    <div className="text-[8px] font-bold opacity-40 uppercase tracking-widest text-white">Nearby Resonances</div>
                    <div className="flex flex-col gap-3 w-full">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
                                <Activity size={14} className="text-emerald-400" />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-white">Yogic Center</div>
                                <div className="text-[8px] text-emerald-400">140m • ALIGNED</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SacredImagePlane = ({ image, biometrics }: { image: string; biometrics: any }) => {
  const meshRef = React.useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const hrFactor = (biometrics?.heartRate || 72) / 60;
    const pulse = 1 + Math.sin(time * hrFactor * Math.PI) * 0.04;
    if (meshRef.current) {
      meshRef.current.scale.set(pulse, pulse, 1);
      meshRef.current.position.y = Math.sin(time * 0.5) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[3, 2]} />
      <meshBasicMaterial 
        map={new THREE.TextureLoader().load(image)} 
        transparent 
        opacity={0.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const SacredTorusKnot = ({ biometrics, baseColor }: { biometrics: any; baseColor?: string }) => {
  const meshRef = React.useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const hrSpeed = (biometrics?.heartRate || 72) / 72;

    if (meshRef.current) {
      meshRef.current.rotation.x += 0.003 * hrSpeed;
      meshRef.current.rotation.y += 0.006 * hrSpeed;

      const freq = hrSpeed * Math.PI * 2;
      const stressAmp = 0.04 + (biometrics?.stressLevel || 0.45) * 0.08;
      const pulse = 1.0 + Math.sin(time * freq) * stressAmp;
      
      meshRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  const stressEmissive = React.useMemo(() => {
    const calmColor = new THREE.Color("#5A5A40");
    const tenseColor = new THREE.Color("#ef4444");
    const level = biometrics?.stressLevel !== undefined ? biometrics.stressLevel : 0.45;
    return calmColor.clone().lerp(tenseColor, level);
  }, [biometrics?.stressLevel]);

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 4, 0, 0]}>
      <torusKnotGeometry args={[1, 0.3, 128, 16]} />
      <MeshDistortMaterial
        color={baseColor || "#A8D5BA"}
        speed={1 + (biometrics?.heartRate || 72) / 40}
        distort={0.15 + (biometrics?.stressLevel || 0.45) * 0.5}
        radius={1}
        emissive={stressEmissive}
        emissiveIntensity={0.3 + (biometrics?.stressLevel || 0.45) * 1.5}
        wireframe
      />
    </mesh>
  );
};

const BioPulsar = ({ biometrics, baseColor }: { biometrics: any; baseColor?: string }) => {
  const meshRef = React.useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const hrSpeed = (biometrics?.heartRate || 72) / 60;
    const freq = hrSpeed * Math.PI * 2;
    const pulse = 0.6 * (1 + Math.sin(time * freq) * 0.15);

    if (meshRef.current) {
       meshRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  const dynamicColor = React.useMemo(() => {
    const calm = new THREE.Color(baseColor || "#34d399");
    const tense = new THREE.Color("#b91c1c");
    const level = biometrics?.stressLevel !== undefined ? biometrics.stressLevel : 0.45;
    return calm.clone().lerp(tense, level);
  }, [baseColor, biometrics?.stressLevel]);

  return (
    <Sphere ref={meshRef} args={[1, 32, 32]} position={[0, -1.5, 0]}>
      <MeshDistortMaterial
        color={dynamicColor}
        speed={3 + (biometrics?.heartRate || 72) / 24}
        distort={0.1 + (biometrics?.stressLevel || 0.45) * 0.5}
        metalness={0.8}
        roughness={0.2}
      />
    </Sphere>
  );
};

const SacredGeometry = ({ payload, biometrics }: { payload: any; biometrics: any }) => {
  const stress = biometrics?.stressLevel || 0.45;
  return (
    <Float speed={1.5 + stress * 2.5} rotationIntensity={0.5 + stress} floatIntensity={1.5 + stress}>
      {payload?.image ? (
          <SacredImagePlane image={payload.image} biometrics={biometrics} />
      ) : (
          <SacredTorusKnot biometrics={biometrics} baseColor={payload?.data?.plan?.colors?.[0]} />
      )}
      
      <BioPulsar biometrics={biometrics} baseColor={payload?.data?.plan?.colors?.[1]} />

      {payload?.data?.plan?.colors?.map((color: string, i: number) => (
          <Float key={i} position={[(i - 1) * 2, 1, -1]} speed={2 + stress * 3}>
              <Sphere args={[0.2, 16, 16]}>
                  <meshStandardMaterial 
                    color={color} 
                    emissive={color} 
                    emissiveIntensity={0.3 + stress * 1.2} 
                  />
              </Sphere>
          </Float>
      ))}
    </Float>
  );
};

const NeuroSphere = ({ biometrics }: { biometrics: any }) => {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const stress = biometrics?.stressLevel || 0.45;
  const hr = biometrics?.heartRate || 72;

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const breathingFreq = (hr / 120) * Math.PI; 
    const basePulse = 1.6 + Math.sin(time * breathingFreq) * 0.35;
    
    if (meshRef.current) {
      meshRef.current.scale.set(basePulse, basePulse, basePulse);
    }
  });

  const color = React.useMemo(() => {
    const calmColor = new THREE.Color("#10b981");
    const neutralColor = new THREE.Color("#6366f1");
    const tenseColor = new THREE.Color("#ec4899");
    
    if (stress > 0.6) {
      return neutralColor.clone().lerp(tenseColor, (stress - 0.6) / 0.4);
    } else {
      return calmColor.clone().lerp(neutralColor, stress / 0.6);
    }
  }, [stress]);

  return (
    <Float speed={0.8 + stress * 1.5} rotationIntensity={0.3} floatIntensity={0.8}>
       <Sphere ref={meshRef} args={[1, 64, 64]}>
          <MeshDistortMaterial
            color={color}
            speed={0.2 + hr / 150}
            distort={0.15 + stress * 0.35}
            radius={1}
            opacity={0.38 - stress * 0.15}
            transparent
          />
       </Sphere>
    </Float>
  );
};

const EthericUI = ({ title }: { title?: string }) => (
    <group position={[0, 2.5, -3]}>
        <Text
            fontSize={0.2}
            color="#A8D5BA"
            font="https://fonts.gstatic.com/s/inter/v12/UcCOjFGCW8CwpnyBTfnebA.woff"
            anchorX="center"
            anchorY="middle"
        >
            {title ? `SYNCING: ${title.toUpperCase()}` : 'PRANAMAYA VISION ACTIVE'}
        </Text>
        <Text
            position={[0, -0.3, 0]}
            fontSize={0.1}
            color="#D1D1C1"
            maxWidth={2}
            textAlign="center"
        >
            {title ? 'Rendering artifacts from your sacred vault.' : 'Visualizing subtle energy flows and localized bio-resonances.'}
        </Text>
    </group>
);

export const VisionPortal: React.FC = () => {
  const { user } = useAuth();
  const { mode, setMode, payload } = useVision();
  const { data: bio } = useBiometrics();
  const [neuroProfile, setNeuroProfile] = React.useState<NeuroProfile | null>(null);
  const [harmony, setHarmony] = React.useState(75);

  React.useEffect(() => {
    if (user && mode === 'neuro') {
      neuroSyncService.getNeuroProfile(user.uid).then(profile => {
        if (profile) setNeuroProfile(profile);
        else {
          const defaultProfile: NeuroProfile = {
            id: user.uid,
            isNeuroSyncEnabled: true,
            preference: 'standard',
            cognitiveLoadThreshold: 80,
            recentNeuralHarmony: [],
            sensoryGuardEnabled: false
          };
          setNeuroProfile(defaultProfile);
        }
      });

      // Simulate neural harmony flux
      const interval = setInterval(() => {
        setHarmony(prev => Math.min(100, Math.max(0, prev + (Math.random() - 0.5) * 5)));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [user, mode]);

  if (mode === 'standard') return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md flex flex-col">
      <div className="absolute top-8 left-8 z-[101] flex flex-col gap-2">
        <h2 className="text-2xl font-serif italic text-white">
            {mode === 'glasses' ? 'AyurLens: Neural HUD' : mode === 'neuro' ? 'Neuro-Synchronous Bridge' : 'Etheric Sanctuary'}
        </h2>
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 ${mode === 'glasses' ? 'bg-orange-500' : mode === 'neuro' ? 'bg-indigo-400' : 'bg-emerald-500'} rounded-full animate-ping`} />
            <span className={`text-[10px] ${mode === 'glasses' ? 'text-orange-400' : mode === 'neuro' ? 'text-indigo-400' : 'text-emerald-400'} font-bold uppercase tracking-widest`}>
                {mode === 'glasses' ? 'Live Environment Scan Active' : mode === 'neuro' ? 'Neural Harmony Sync Active' : `Neural Bridge: ${payload?.title || 'Ambient Sync'}`}
            </span>
        </div>
      </div>

      <div className="absolute top-8 right-24 z-[101]">
         {mode === 'ar' && (
           <button 
             onClick={() => xrStore.enterAR()}
             className="bg-white text-black rounded-full px-6 py-2 font-bold text-sm shadow-xl hover:scale-105 transition-all"
           >
             Enter Etheric AR
           </button>
         )}
         {mode === 'vr' && (
           <button 
             onClick={() => xrStore.enterVR()}
             className="bg-white text-black rounded-full px-6 py-2 font-bold text-sm shadow-xl hover:scale-105 transition-all"
           >
             Enter Sanctuary VR
           </button>
         )}
         {mode === 'glasses' && (
            <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-widest animate-pulse">
                    Object Recognition: ON
                </div>
            </div>
         )}
         {mode === 'neuro' && (
            <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-indigo-500/20 border border-indigo-400/50 rounded-full text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                    Cognitive Load Protection: ACTIVE
                </div>
            </div>
         )}
      </div>

      {mode === 'glasses' && <GlassesHUD />}
      {mode === 'neuro' && neuroProfile && <NeuroHUD profile={neuroProfile} harmony={harmony} />}

      <div className="flex-1 relative">
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <XR store={xrStore}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -10, -10]} color="#A8D5BA" intensity={1} />
            
            <Suspense fallback={null}>
              {mode !== 'glasses' && mode !== 'neuro' && (
                <>
                  <SacredGeometry payload={payload} biometrics={bio} />
                  <EthericUI title={payload?.title} />
                </>
              )}
              {mode === 'neuro' && (
                 <NeuroSphere biometrics={bio} />
              )}
              {mode === 'vr' && (
                  <>
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                  </>
              )}
            </Suspense>

            <OrbitControls enablePan={false} />
          </XR>
        </Canvas>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-4 z-[101]">
        <button 
          onClick={() => {
            setMode('standard');
          }}
          className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all backdrop-blur-md"
        >
          Exit Connection
        </button>
      </div>
    </div>
  );
};
