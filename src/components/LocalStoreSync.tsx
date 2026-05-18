import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Camera, 
  QrCode, 
  Search, 
  Store, 
  ArrowRight, 
  Loader2, 
  Check, 
  Navigation,
  X,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import QrScanner from 'qr-scanner';
import { geminiService } from '../services/geminiService';
import { cn } from '../lib/utils';

// Const from .env
const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

interface StoreSuggestion {
  name: string;
  category: string;
  doshaAlignment: string;
  reason: string;
  estimatedPrice: string;
}

interface LocalStoreSyncProps {
  onSync: (storeName: string, suggestions: StoreSuggestion[]) => void;
  userDosha: string;
}

export const LocalStoreSync = ({ onSync, userDosha }: LocalStoreSyncProps) => {
  const [mode, setMode] = useState<'selection' | 'map' | 'camera' | 'qr' | 'manual'>('selection');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [manualStoreName, setManualStoreName] = useState('');
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    if (mode === 'qr' && videoRef.current) {
      scannerRef.current = new QrScanner(
        videoRef.current,
        result => {
          setScannedResult(result.data);
          handleIdentifyStore(result.data);
          scannerRef.current?.stop();
        },
        { returnDetailedScanResult: true }
      );
      scannerRef.current.start();
    }
    return () => {
      scannerRef.current?.destroy();
    };
  }, [mode]);

  const handleIdentifyStore = async (name: string) => {
    setLoading(true);
    try {
      const suggestions = await geminiService.simulateStoreInventory(name, userDosha);
      onSync(name, suggestions);
      setMode('selection');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationDetection = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setMode('map');
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
  };

  const handleCaptureImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    try {
      // Convert to base64 for Gemini
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const storeInfo = await geminiService.identifyStoreFromImage(base64);
        if (storeInfo?.name) {
          handleIdentifyStore(storeInfo.name);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-[40px] border border-white/10 overflow-hidden shadow-2xl">
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
              <Store className="text-amber-400" /> Local Node Sync
            </h3>
            <p className="text-xs text-white/40 uppercase tracking-[0.2em] font-bold">
              Harmonize with proximal inventory
            </p>
          </div>
          {mode !== 'selection' && (
            <button 
              onClick={() => setMode('selection')}
              className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {mode === 'selection' && (
            <motion.div 
              key="selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              <SelectionCard 
                icon={Navigation} 
                label="Near Me" 
                onClick={handleLocationDetection} 
                loading={loading}
              />
              <SelectionCard 
                icon={Camera} 
                label="Photo Scan" 
                onClick={() => setMode('camera')} 
              />
              <SelectionCard 
                icon={QrCode} 
                label="QR Sync" 
                onClick={() => setMode('qr')} 
              />
              <SelectionCard 
                icon={Search} 
                label="Manual" 
                onClick={() => setMode('manual')} 
              />
            </motion.div>
          )}

          {mode === 'map' && location && (
            <motion.div 
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-[400px] rounded-3xl overflow-hidden border border-white/10 relative"
            >
              <APIProvider 
                apiKey={GOOGLE_MAPS_KEY}
                onLoad={() => setMapError(null)}
                // Note: APIProvider doesn't have a direct error handler that catches BillingNotEnabledMapError easily at the component level
                // but AdvancedMarker or Map might fail silently or show an overlay.
              >
                <div className="absolute inset-0 bg-[#1A1A15] flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <Navigation className="text-white/20" size={48} />
                  <div className="space-y-2">
                    <p className="text-white font-bold">Spatial Sync Active</p>
                    <p className="text-xs text-white/40">If map fails to load, ensure Google Maps Platform billing is active.</p>
                  </div>
                </div>
                <StoreLocatorMap 
                  center={location} 
                  onStoreSelect={handleIdentifyStore} 
                  mapError={mapError}
                  setMapError={setMapError}
                />
              </APIProvider>
              {loading && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                  <Loader2 className="animate-spin text-amber-400" size={40} />
                </div>
              )}
            </motion.div>
          )}

          {mode === 'qr' && (
             <motion.div 
              key="qr"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="aspect-square max-w-sm mx-auto rounded-3xl overflow-hidden border-4 border-white/10 relative bg-black"
             >
                <video ref={videoRef} className="w-full h-full object-cover" />
                <div className="absolute inset-0 border-[40px] border-black/60 pointer-events-none">
                  <div className="w-full h-full border-2 border-dashed border-amber-400 opacity-50" />
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/40 py-2 inline-block px-4 rounded-full">
                    Scan store-sync code
                  </p>
                </div>
             </motion.div>
          )}

          {mode === 'camera' && (
            <motion.div 
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center space-y-4"
            >
              <div className="p-6 bg-white/5 rounded-full text-white/40">
                <Camera size={48} />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-sm">Upload store storefront or signage</p>
                <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">Gemini will decode the identity</p>
              </div>
              <label className="px-8 py-3 bg-white text-black rounded-2xl font-bold text-xs uppercase tracking-widest cursor-pointer hover:scale-105 transition-all">
                Select Sacred Image
                <input type="file" className="hidden" accept="image/*" onChange={handleCaptureImage} />
              </label>
            </motion.div>
          )}

          {mode === 'manual' && (
            <motion.div 
              key="manual"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="relative">
                <Store className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" />
                <input 
                  type="text"
                  placeholder="Enter shop or marketplace name..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-serif"
                  value={manualStoreName}
                  onChange={(e) => setManualStoreName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && manualStoreName && handleIdentifyStore(manualStoreName)}
                />
              </div>
              <button 
                onClick={() => manualStoreName && handleIdentifyStore(manualStoreName)}
                disabled={!manualStoreName || loading}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <><Sparkles size={16} /> Initiate Sync</>}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const SelectionCard = ({ icon: Icon, label, onClick, loading }: any) => (
  <button 
    onClick={onClick}
    disabled={loading}
    className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group gap-3"
  >
    <div className={cn(
      "p-3 rounded-2xl bg-white/5 text-white/60 group-hover:bg-amber-400 group-hover:text-black transition-all",
      loading && "animate-pulse"
    )}>
      {loading ? <Loader2 className="animate-spin" /> : <Icon size={24} />}
    </div>
    <span className="text-[10px] font-bold text-white/60 group-hover:text-white uppercase tracking-widest transition-colors">
      {label}
    </span>
  </button>
);

const StoreLocatorMap = ({ 
  center, 
  onStoreSelect,
  mapError,
  setMapError
}: { 
  center: { lat: number; lng: number }; 
  onStoreSelect: (name: string) => void;
  mapError: string | null;
  setMapError: (err: string | null) => void;
}) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [stores, setStores] = useState<google.maps.places.Place[]>([]);

  useEffect(() => {
    if (!placesLib || !map) return;
    
    // Search for health/organic stores nearby
    placesLib.Place.searchNearby({
      locationRestriction: { center, radius: 5000 },
      fields: ['displayName', 'location', 'formattedAddress', 'types'],
      includedPrimaryTypes: ['grocery_store', 'pharmacy', 'health_food_store'],
      maxResultCount: 10,
    }).then(({ places }) => {
      setStores(places);
      if (places.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        places.forEach(p => bounds.extend(p.location!));
        map.fitBounds(bounds);
      }
    }).catch(error => {
      console.error("Store search error:", error);
      const msg = error?.message || String(error);
      if (msg.includes('PERMISSION_DENIED') || msg.includes('has not been used')) {
        setMapError('PLACES_API_V1_REQUIRED');
      } else if (msg.includes('BillingNotEnabledMapError')) {
        setMapError('BILLING_REQUIRED');
      }
    });
  }, [placesLib, map, center]);

  if (mapError) {
    return (
      <div className="absolute inset-0 bg-[#1A1A15] flex flex-col items-center justify-center p-8 text-center space-y-4 z-20">
        <div className="p-4 bg-rose-500/20 text-rose-500 rounded-full">
          <X size={32} />
        </div>
        <div className="space-y-2">
          <p className="text-white font-bold">
            {mapError === 'PLACES_API_V1_REQUIRED' ? 'Enable Places API (New)' : 'Billing Required'}
          </p>
          <p className="text-[10px] text-white/40 leading-relaxed max-w-[200px]">
            {mapError === 'PLACES_API_V1_REQUIRED' 
              ? 'Please enable "Places API (New)" in Google Cloud Console to sync local nodes.' 
              : 'Google Maps platform requires an active billing account.'}
          </p>
          <a 
            href={mapError === 'PLACES_API_V1_REQUIRED' 
              ? "https://console.cloud.google.com/apis/library/places.googleapis.com"
              : "https://console.cloud.google.com/billing"}
            target="_blank"
            rel="noopener"
            className="inline-block mt-4 text-[10px] text-blue-400 underline uppercase tracking-widest font-bold"
          >
            Go to Console
          </a>
        </div>
      </div>
    );
  }

  return (
    <Map
      defaultCenter={center}
      defaultZoom={14}
      mapId="STORE_SYNC_MAP"
      style={{ width: '100%', height: '100%' }}
      disableDefaultUI
      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
    >
      <AdvancedMarker position={center}>
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-25" />
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg relative z-10" />
        </div>
      </AdvancedMarker>

      {stores.map(store => (
        <AdvancedMarker 
          key={store.id} 
          position={store.location!}
          onClick={() => onStoreSelect(store.displayName || '')}
        >
          <Pin background="#f59e0b" glyphColor="#fff" />
        </AdvancedMarker>
      ))}
    </Map>
  );
};
