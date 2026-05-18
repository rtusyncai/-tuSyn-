import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface NeuroProfile {
  id: string;
  isNeuroSyncEnabled: boolean;
  preference: 'high-contrast' | 'sensory-friendly' | 'simplified' | 'standard';
  cognitiveLoadThreshold: number; // 0-100
  recentNeuralHarmony: number[]; // brainwave harmony history
  sensoryGuardEnabled: boolean;
  circadianStatus?: 'peak' | 'descending' | 'rest' | 'ascending';
  environmentalFactors?: {
    lightLevel: number; // lux
    temperature: number; // celsius
    airQuality: number; // AQI
  };
}

export const neuroSyncService = {
  async getNeuroProfile(userId: string): Promise<NeuroProfile | null> {
    const docRef = doc(db, 'neuro_profiles', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as NeuroProfile;
    }
    return null;
  },

  async updateNeuroProfile(userId: string, data: Partial<NeuroProfile>) {
    const docRef = doc(db, 'neuro_profiles', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, data);
    } else {
      await setDoc(docRef, {
        id: userId,
        isNeuroSyncEnabled: true,
        preference: 'standard',
        cognitiveLoadThreshold: 80,
        recentNeuralHarmony: [],
        sensoryGuardEnabled: true,
        circadianStatus: 'peak',
        environmentalFactors: {
          lightLevel: 450,
          temperature: 22,
          airQuality: 12
        },
        ...data
      });
    }
  },

  calculateHarmony(brainwaves: { alpha: number; beta: number; delta: number; theta: number }) {
    // Mock algorithm for neural synchrony
    const { alpha, beta, delta, theta } = brainwaves;
    const synchrony = (alpha + theta) / (beta + delta + 0.1);
    return Math.min(100, Math.max(0, synchrony * 20));
  },

  simulateRhythmChanges(current: NeuroProfile): Partial<NeuroProfile> {
    const hours = new Date().getHours();
    let status: NeuroProfile['circadianStatus'] = 'peak';
    
    if (hours >= 22 || hours < 5) status = 'rest';
    else if (hours >= 5 && hours < 10) status = 'ascending';
    else if (hours >= 17 && hours < 22) status = 'descending';

    return {
      circadianStatus: status,
      environmentalFactors: {
        lightLevel: Math.max(10, (current.environmentalFactors?.lightLevel || 450) + (Math.random() * 20 - 10)),
        temperature: Math.max(18, Math.min(30, (current.environmentalFactors?.temperature || 22) + (Math.random() * 0.4 - 0.2))),
        airQuality: Math.max(5, Math.min(100, (current.environmentalFactors?.airQuality || 12) + (Math.random() * 2 - 1))),
      },
      recentNeuralHarmony: [
        ...(current.recentNeuralHarmony || []).slice(-19),
        Math.min(100, Math.max(60, (current.recentNeuralHarmony?.[current.recentNeuralHarmony.length - 1] || 75) + (Math.random() * 6 - 3)))
      ]
    };
  }
};
