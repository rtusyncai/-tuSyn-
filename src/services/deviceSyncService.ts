import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, setDoc, arrayUnion } from 'firebase/firestore';

export interface ConnectedDevice {
  id: string;
  type: 'glasses' | 'watch' | 'ring' | 'car' | 'voice-assistant';
  brand: string;
  model: string;
  status: 'connected' | 'disconnected' | 'syncing';
  lastSync: any;
  capabilities: string[];
}

export const deviceSyncService = {
  async getUserDevices(userId: string): Promise<ConnectedDevice[]> {
    const docRef = doc(db, 'devices', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().devices || [];
    }
    return [];
  },

  async connectDevice(userId: string, device: Omit<ConnectedDevice, 'status' | 'lastSync'>) {
    const docRef = doc(db, 'devices', userId);
    const newDevice: ConnectedDevice = {
      ...device,
      status: 'connected',
      lastSync: new Date()
    };

    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, {
        devices: arrayUnion(newDevice)
      });
    } else {
      await setDoc(docRef, {
        devices: [newDevice]
      });
    }
    return newDevice;
  },

  async toggleSync(userId: string, deviceId: string, isActive: boolean) {
    const docRef = doc(db, 'devices', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const devices = docSnap.data().devices as ConnectedDevice[];
      const updatedDevices = devices.map(d => 
        d.id === deviceId ? { ...d, status: isActive ? 'connected' : 'disconnected' } : d
      );
      await updateDoc(docRef, { devices: updatedDevices });
    }
  },

  async removeDevice(userId: string, deviceId: string) {
    const docRef = doc(db, 'devices', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const devices = docSnap.data().devices as ConnectedDevice[];
      const updatedDevices = devices.filter(d => d.id !== deviceId);
      await updateDoc(docRef, { devices: updatedDevices });
    }
  },

  /**
   * Simulates a live stream of biometric data
   * In a production app, this would use WebSockets or Firebase onSnapshot
   */
  subscribeToLiveBiometrics(userId: string, callback: (data: { heartRate: number; stressLevel: number; ambientTemperature: number; timestamp: number }) => void) {
    let heartRate = 72;
    let stressLevel = 0.45;
    let ambientTemperature = 22.5;

    const interval = setInterval(() => {
      // Add random fluctuations
      heartRate += (Math.random() - 0.5) * 4;
      stressLevel += (Math.random() - 0.5) * 0.05;
      ambientTemperature += (Math.random() - 0.5) * 0.2;

      // Keep within realistic bounds
      heartRate = Math.max(50, Math.min(180, heartRate));
      stressLevel = Math.max(0, Math.min(1.0, stressLevel));
      ambientTemperature = Math.max(15, Math.min(35, ambientTemperature));

      callback({
        heartRate: Math.round(heartRate),
        stressLevel: parseFloat(stressLevel.toFixed(2)),
        ambientTemperature: parseFloat(ambientTemperature.toFixed(1)),
        timestamp: Date.now()
      });
    }, 2000);

    return () => clearInterval(interval);
  }
};
