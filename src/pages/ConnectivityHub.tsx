import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  Wifi, 
  Smartphone, 
  Glasses, 
  Watch, 
  Bluetooth, 
  ShieldCheck, 
  RefreshCw, 
  Settings,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Info,
  Youtube,
  Edit2,
  Check,
  Save,
  X,
  Loader2,
  Mic,
  Speaker
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { youtubeService, YouTubeProfile, YouTubeVideo } from '../services/youtubeService';
import { deviceSyncService, ConnectedDevice } from '../services/deviceSyncService';
import { cn } from '../lib/utils';
import { useToast } from '../hooks/useToast';

const INTEGRATION_MARKET = [
  { 
    id: 'meta-rayban', 
    name: 'Ray-Ban Meta', 
    type: 'glasses', 
    brand: 'Meta', 
    icon: Glasses, 
    desc: 'Voice integration and multi-modal AI sync.',
    capabilities: ['Voice Commands', 'Image Analysis', 'Neural Bridge']
  },
  { 
    id: 'xreal-air', 
    name: 'XREAL Air Series', 
    type: 'glasses', 
    brand: 'XREAL', 
    icon: Glasses, 
    desc: 'Full Etheric HUD and spatial anchoring.',
    capabilities: ['AR Overlay', 'Spatial Tracking', 'Biosync HUD']
  },
  { 
    id: 'apple-watch', 
    name: 'Apple Watch', 
    type: 'watch', 
    brand: 'Apple', 
    icon: Watch, 
    desc: 'Continuous heart rate and sleep telemetry.',
    capabilities: ['HRV Tracking', 'Sleep Data', 'Prana Sync']
  },
  { 
    id: 'tesla-sync', 
    name: 'Tesla Bio-Link', 
    type: 'car', 
    brand: 'Tesla', 
    icon: Smartphone, 
    desc: 'Cabin environment tuning via API.', 
    capabilities: ['Scent Diffusion', 'Climate Sync', 'commute_zen']
  },
  { 
    id: 'amazon-echo', 
    name: 'Amazon Echo', 
    type: 'voice-assistant', 
    brand: 'Amazon', 
    icon: Speaker, 
    desc: 'Voice integration and ambient listening.', 
    capabilities: ['Alexa Skills', 'Ambient Feedback', 'Smart Hub']
  },
  { 
    id: 'google-home', 
    name: 'Google Home', 
    type: 'voice-assistant', 
    brand: 'Google', 
    icon: Speaker, 
    desc: 'Machine learning based voice synthesis.', 
    capabilities: ['Assistant Actions', 'Cast Audio', 'Home Sync']
  }
];

export const ConnectivityHubPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // YouTube State
  const [ytTokens, setYtTokens] = useState<any>(null);
  const [ytProfile, setYtProfile] = useState<YouTubeProfile | null>(null);
  const [ytVideos, setYtVideos] = useState<YouTubeVideo[]>([]);
  const [editingVideo, setEditingVideo] = useState<{ id: string, title: string, description: string } | null>(null);
  const [isUpdatingYt, setIsUpdatingYt] = useState(false);

  useEffect(() => {
    if (user) {
      loadDevices();
      const savedTokens = localStorage.getItem('youtube_tokens');
      if (savedTokens) {
        setYtTokens(JSON.parse(savedTokens));
      }
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'YOUTUBE_AUTH_SUCCESS') {
        const tokens = event.data.tokens;
        setYtTokens(tokens);
        localStorage.setItem('youtube_tokens', JSON.stringify(tokens));
        toast("YouTube successfully synced!", "success");
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user]);

  useEffect(() => {
    if (ytTokens) {
      loadYoutubeData();
    }
  }, [ytTokens]);

  const loadYoutubeData = async () => {
    if (!ytTokens) return;
    const profile = await youtubeService.getProfile(ytTokens);
    setYtProfile(profile);
    const videos = await youtubeService.getVideos(ytTokens);
    setYtVideos(videos);
  };

  const handleYtConnect = async () => {
    const url = await youtubeService.getAuthUrl();
    window.open(url, 'YouTube Auth', 'width=600,height=700');
  };

  const handleUpdateVideo = async () => {
    if (!editingVideo || !ytTokens) return;
    setIsUpdatingYt(true);
    try {
      await youtubeService.updateVideo(ytTokens, editingVideo.id, editingVideo.title, editingVideo.description);
      toast("Video updated successfully!", "success");
      setEditingVideo(null);
      loadYoutubeData();
    } catch (e) {
      toast("Failed to update video.", "error");
    } finally {
      setIsUpdatingYt(false);
    }
  };

  const loadDevices = async () => {
    setLoading(true);
    try {
      const data = await deviceSyncService.getUserDevices(user!.uid);
      setDevices(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (marketItem: any) => {
    try {
      await deviceSyncService.connectDevice(user!.uid, {
        id: `${marketItem.id}-${Date.now()}`,
        type: marketItem.type,
        brand: marketItem.brand,
        model: marketItem.name,
        capabilities: marketItem.capabilities
      });
      toast(`${marketItem.name} successfully bridged to ṚtuSyn.`, 'success');
      loadDevices();
      setShowAddModal(false);
    } catch (error) {
      toast("Bridging failed. Internal neural link error.", 'error');
    }
  };

  const handleToggleSync = async (deviceId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'connected';
      await deviceSyncService.toggleSync(user!.uid, deviceId, !newStatus);
      toast(`Sync status updated.`, 'success');
      loadDevices();
    } catch (error) {
      toast("Failed to update sync status.", 'error');
    }
  };

  const handleRemove = async (deviceId: string) => {
    if (!window.confirm("Disconnect this device and sever the neural link?")) return;
    try {
      await deviceSyncService.removeDevice(user!.uid, deviceId);
      toast("Device disconnected.", 'info');
      loadDevices();
    } catch (error) {
      toast("Failed to disconnect device.", 'error');
    }
  };

  return (
    <div className="space-y-10 py-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-[#5A5A40] dark:text-[#A8D5BA]">
            <Cpu size={32} />
            <h1 className="text-4xl font-serif font-bold tracking-tight">Connectivity Hub</h1>
          </div>
          <p className="text-[#2D3436] dark:text-[#E8E8E0] opacity-60 italic font-serif text-lg">
            Bridge your existing hardware into the bio-rhythmic sanctuary.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-8 py-4 bg-[#5A5A40] dark:bg-[#A8D5BA] text-white dark:text-[#1A1A15] rounded-3xl font-bold hover:scale-105 transition-all shadow-xl"
        >
          <Plus size={20} /> Bridge New Device
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA] flex items-center gap-2">
            <Bluetooth size={20} /> Currently Linked Artifacts
          </h2>
          
          {loading ? (
             <div className="h-64 bg-white/50 dark:bg-black/20 rounded-[40px] flex items-center justify-center animate-pulse border border-[#D1D1C1]/30">
                <RefreshCw className="animate-spin text-[#5A5A40] dark:text-[#A8D5BA]" />
             </div>
          ) : devices.length > 0 ? (
            <div className="space-y-4">
               {devices.map((device) => (
                 <motion.div 
                   key={device.id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="bg-white dark:bg-[#252520] p-6 rounded-[30px] border border-[#D1D1C1] dark:border-[#3D3D35] flex items-center justify-between group"
                 >
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-[#F5F5F0] dark:bg-[#1A1A15] rounded-2xl flex items-center justify-center text-[#5A5A40] dark:text-[#A8D5BA]">
                           {device.type === 'glasses' ? <Glasses size={32} /> : device.type === 'watch' ? <Watch size={32} /> : device.type === 'voice-assistant' ? <Mic size={32} /> : <Smartphone size={32} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h4 className="font-bold text-[#5A5A40] dark:text-[#A8D5BA]">{device.brand} {device.model}</h4>
                                <span className={cn(
                                   "px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-widest",
                                   device.status === 'connected' ? "bg-emerald-500/10 text-emerald-500" : "bg-stone-500/10 text-stone-500"
                                )}>
                                   {device.status === 'connected' ? 'Bridged' : 'Paused'}
                                </span>
                            </div>
                            <div className="flex gap-2 mt-2">
                                {device.capabilities.map(cap => (
                                    <span key={cap} className="text-[10px] bg-[#F5F5F0] dark:bg-[#1A1A15] px-2 py-0.5 rounded-full opacity-60">
                                        {cap}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                           <span className="text-[8px] font-bold opacity-40 uppercase tracking-widest hidden sm:block">Sync</span>
                           <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={device.status === 'connected'}
                                onChange={() => handleToggleSync(device.id, device.status)}
                                className="sr-only peer" 
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5A5A40] dark:peer-checked:bg-[#A8D5BA]"></div>
                           </label>
                        </div>
                        <div className="text-right hidden sm:block">
                            <div className="text-[10px] uppercase tracking-wider opacity-40">Last Neural Sync</div>
                            <div className="text-xs font-mono">{new Date(device.lastSync?.seconds * 1000 || device.lastSync || Date.now()).toLocaleTimeString()}</div>
                        </div>
                        <button 
                          onClick={() => handleRemove(device.id)}
                          className="p-3 text-red-500/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                 </motion.div>
               ))}
            </div>
          ) : (
            <div className="py-20 bg-white/50 dark:bg-black/20 rounded-[40px] border border-dashed border-[#D1D1C1]/50 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-[#F5F5F0] dark:bg-[#1A1A15] rounded-full flex items-center justify-center text-[#5A5A40]/30 dark:text-[#A8D5BA]/30 mb-4">
                    <Wifi size={40} />
                </div>
                <h3 className="font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA] text-xl">No Devices Bridged</h3>
                <p className="max-w-xs text-sm opacity-60 italic mt-2 font-serif">Connect your wearables to allow ṚtuSyn to feed off real-time biometric telemetry.</p>
            </div>
          )}
        </div>

        <div className="space-y-8">
            {/* YouTube Integration Section */}
            <div className="bg-white dark:bg-[#252520] p-8 rounded-[40px] border border-[#D1D1C1] dark:border-[#3D3D35] space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#5A5A40] dark:text-[#A8D5BA] flex items-center gap-3">
                        <Youtube className="text-red-600" size={24} /> Neural Media Sync
                    </h3>
                    {!ytTokens ? (
                        <button 
                            onClick={handleYtConnect}
                            className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all flex items-center gap-2"
                        >
                            Connect Google
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Active</span>
                        </div>
                    )}
                </div>

                {!ytTokens ? (
                    <p className="text-sm opacity-60 italic font-serif leading-relaxed">
                        Bridge your content creation cycle. Synchronize your YouTube metadata with your creative rhythms.
                    </p>
                ) : (
                    <div className="space-y-6">
                        {ytProfile && (
                            <div className="flex items-center gap-4 bg-[#F5F5F0] dark:bg-[#1A1A15] p-4 rounded-3xl">
                                <img 
                                    src={ytProfile.snippet.thumbnails.default.url} 
                                    alt="YT Profile" 
                                    className="w-12 h-12 rounded-full border-2 border-white dark:border-[#3D3D35]"
                                    referrerPolicy="no-referrer"
                                />
                                <div>
                                    <h4 className="font-bold text-sm text-[#5A5A40] dark:text-[#A8D5BA]">{ytProfile.snippet.title}</h4>
                                    <p className="text-[10px] opacity-60">{ytProfile.statistics.subscriberCount} Subscribers • {ytProfile.statistics.videoCount} Videos</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Recent Artifacts</span>
                                <button onClick={loadYoutubeData} className="p-1 hover:bg-[#F5F5F0] dark:hover:bg-[#1A1A15] rounded-lg transition-all">
                                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                                </button>
                            </div>
                            
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {ytVideos.map(video => (
                                    <div key={video.id} className="p-3 bg-white dark:bg-[#252520] border border-[#D1D1C1]/50 dark:border-[#3D3D35] rounded-2xl flex gap-3 group">
                                        <div className="w-20 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                                            <img src={video.snippet.thumbnails.default.url} alt="Thumb" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="text-[11px] font-bold text-[#5A5A40] dark:text-[#A8D5BA] truncate">{video.snippet.title}</h5>
                                            <p className="text-[9px] opacity-60 truncate">{video.snippet.description}</p>
                                        </div>
                                        <button 
                                            onClick={() => setEditingVideo({ id: video.contentDetails?.videoId || video.id, title: video.snippet.title, description: video.snippet.description })}
                                            className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-[#5A5A40] dark:bg-[#A8D5BA] p-8 rounded-[40px] text-white dark:text-[#1A1A15] shadow-2xl relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={24} />
                        <h3 className="font-bold uppercase tracking-widest text-xs">Security Protocol</h3>
                    </div>
                    <h2 className="text-3xl font-serif font-bold italic leading-tight">Neural Link Security</h2>
                    <p className="text-sm opacity-80 leading-relaxed font-serif">
                        ṚtuSyn utilizes end-to-end decentralized biometrics. Your device data is processed locally before being synced with your Neural Hub.
                    </p>
                    <button className="w-full py-4 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                         Review Encryption Vault <ChevronRight size={18} />
                    </button>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <CheckCircle2 size={120} />
                </div>
            </div>

            <div className="bg-white dark:bg-[#252520] p-8 rounded-[40px] border border-[#D1D1C1] dark:border-[#3D3D35] space-y-6">
                <h3 className="font-bold text-[#5A5A40] dark:text-[#A8D5BA] flex items-center gap-2">
                    <Mic size={18} /> Voice Intelligence Nodes
                </h3>
                <div className="space-y-4">
                    {devices.filter(d => d.type === 'voice-assistant').length > 0 ? (
                        devices.filter(d => d.type === 'voice-assistant').map(d => (
                            <div key={d.id} className="flex items-center justify-between p-4 bg-[#F5F5F0] dark:bg-[#1A1A15] rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center animate-pulse">
                                        <Speaker size={14} />
                                    </div>
                                    <span className="text-sm font-bold">{d.brand} Node</span>
                                </div>
                                <span className="text-[10px] font-mono text-emerald-500 uppercase">Listening</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs opacity-50 italic">No voice nodes coupled. Bridge an Echo or Google Home to enable ambient feedback.</p>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-[#252520] p-8 rounded-[40px] border border-[#D1D1C1] dark:border-[#3D3D35] space-y-6">
                <h3 className="font-bold text-[#5A5A40] dark:text-[#A8D5BA] flex items-center gap-2">
                    <Info size={18} /> Sync Analytics
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm border-b border-[#F5F5F0] dark:border-[#3D3D35] pb-4">
                        <span className="opacity-60">Avg. Sync Intervals</span>
                        <span className="font-mono">14.2s</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-[#F5F5F0] dark:border-[#3D3D35] pb-4">
                        <span className="opacity-60">Active Telemetry Streams</span>
                        <span className="font-mono">8</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-[#F5F5F0] dark:border-[#3D3D35] pb-4">
                        <span className="opacity-60">Bridge Stability</span>
                        <span className="font-mono text-emerald-500">99.9%</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Video Edit Modal */}
      <AnimatePresence>
        {editingVideo && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                 <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setEditingVideo(null)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-white dark:bg-[#1A1A15] w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl p-10 space-y-6"
                >
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA]">Refine Artifact</h3>
                        <button onClick={() => setEditingVideo(null)} className="p-2 hover:bg-[#F5F5F0] dark:hover:bg-[#252520] rounded-full transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Title</label>
                            <input 
                                type="text"
                                value={editingVideo.title}
                                onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                                className="w-full p-4 bg-[#F5F5F0] dark:bg-[#252520] border border-[#D1D1C1] dark:border-[#3D3D35] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Description</label>
                            <textarea 
                                value={editingVideo.description}
                                onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                                className="w-full p-4 bg-[#F5F5F0] dark:bg-[#252520] border border-[#D1D1C1] dark:border-[#3D3D35] rounded-2xl text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => setEditingVideo(null)}
                            className="flex-1 py-4 bg-[#F5F5F0] dark:bg-[#252520] text-[#5A5A40] dark:text-[#A8D5BA] rounded-2xl font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleUpdateVideo}
                            disabled={isUpdatingYt}
                            className="flex-1 py-4 bg-[#5A5A40] dark:bg-[#A8D5BA] text-white dark:text-[#1A1A15] rounded-2xl font-bold shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
                        >
                            {isUpdatingYt ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Synchronize Metadata
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Add Device Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowAddModal(false)}
               className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-[#F5F5F0] dark:bg-[#1A1A15] w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl p-10 flex flex-col gap-8 max-h-[90vh]"
            >
                <div>
                   <h2 className="text-3xl font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA]">Bridge External Artifacts</h2>
                   <p className="text-[#2D3436] dark:text-[#E8E8E0] opacity-60 italic font-serif mt-1">Select the hardware you wish to merge with your ṚtuSyn profile.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                    {INTEGRATION_MARKET.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleConnect(item)}
                            className="bg-white dark:bg-[#252520] p-6 rounded-3xl border border-[#D1D1C1] dark:border-[#3D3D35] text-left hover:border-[#5A5A40] dark:hover:border-[#A8D5BA] transition-all group flex items-center gap-4"
                        >
                            <div className="w-16 h-16 bg-[#F5F5F0] dark:bg-[#1A1A15] rounded-2xl flex items-center justify-center text-[#5A5A40] dark:text-[#A8D5BA] group-hover:bg-[#5A5A40] dark:group-hover:bg-[#A8D5BA] group-hover:text-white dark:group-hover:text-[#1A1A15] transition-colors">
                                <item.icon size={28} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-[#5A5A40] dark:text-[#A8D5BA]">{item.name}</h4>
                                <p className="text-xs opacity-60 mt-1 line-clamp-1">{item.desc}</p>
                                <div className="flex gap-2 mt-2">
                                    {item.capabilities.slice(0, 2).map(c => (
                                        <span key={c} className="text-[8px] bg-[#F5F5F0] dark:bg-[#1A1A15] px-2 py-0.5 rounded-full opacity-40 uppercase font-bold tracking-widest">{c}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight size={20} className="text-[#5A5A40] dark:text-[#A8D5BA]" />
                            </div>
                        </button>
                    ))}
                </div>

                <div className="bg-[#5A5A40]/5 dark:bg-[#A8D5BA]/5 p-6 rounded-3xl border border-[#5A5A40]/10 flex items-center gap-4">
                    <div className="p-3 bg-white dark:bg-black/40 rounded-full">
                        <AlertCircle className="text-[#5A5A40] dark:text-[#A8D5BA]" size={20} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-sm text-[#5A5A40] dark:text-[#A8D5BA]">Custom WebHook Bridge</h4>
                        <p className="text-xs opacity-60">Developing custom hardware? Use our public MQTT or REST bridge to stream data directly into the neural hub.</p>
                    </div>
                    <button className="px-4 py-2 bg-[#5A5A40] dark:bg-[#A8D5BA] text-white dark:text-[#1A1A15] rounded-xl text-xs font-bold whitespace-nowrap">
                        View API Docs
                    </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
