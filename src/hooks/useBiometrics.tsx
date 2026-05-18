import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from './useAuth';
import { deviceSyncService } from '../services/deviceSyncService';

interface BiometricData {
  heartRate: number;
  stressLevel: number;
  ambientTemperature: number;
  timestamp: number;
}

const BiometricContext = createContext<{
  data: BiometricData;
  isSyncing: boolean;
}>({
  data: {
    heartRate: 72,
    stressLevel: 0.45,
    ambientTemperature: 22.5,
    timestamp: Date.now()
  },
  isSyncing: false
});

export const BiometricProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState<BiometricData>({
    heartRate: 72,
    stressLevel: 0.45,
    ambientTemperature: 22.5,
    timestamp: Date.now()
  });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsSyncing(false);
      return;
    }

    // Check if user has connected and active biometric devices
    const checkMembership = async () => {
      const devices = await deviceSyncService.getUserDevices(user.uid);
      const activeBiometricDevice = devices.find(d => 
        (d.type === 'watch' || d.type === 'ring') && d.status === 'connected'
      );
      
      if (activeBiometricDevice) {
        setIsSyncing(true);
        const unsubscribe = deviceSyncService.subscribeToLiveBiometrics(user.uid, (newData) => {
          setData(newData);
        });
        return unsubscribe;
      } else {
        setIsSyncing(false);
      }
    };

    let unsubscribe: (() => void) | undefined;
    checkMembership().then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  return (
    <BiometricContext.Provider value={{ data, isSyncing }}>
      {children}
    </BiometricContext.Provider>
  );
};

export const useBiometrics = () => useContext(BiometricContext);
