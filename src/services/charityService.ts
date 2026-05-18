import { db } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, limit, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { geminiService } from './geminiService';

export interface Charity {
  id?: string;
  name: string;
  mission: string;
  selectionLogic: string;
  donationPercentage: number;
  active: boolean;
  selectedAt: any;
}

export const charityService = {
  getCurrentCharity: async () => {
    try {
      const q = query(
        collection(db, 'charities'),
        where('active', '==', true),
        orderBy('selectedAt', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // AI Select a new one if none active/found
        const aiCharity = await geminiService.selectWeeklyCharity();
        const newCharity: Charity = {
          name: aiCharity.name,
          mission: aiCharity.mission,
          selectionLogic: aiCharity.selectionLogic,
          donationPercentage: aiCharity.suggestedDonationPercentage || 2,
          active: true,
          selectedAt: serverTimestamp()
        };
        try {
          const docRef = await addDoc(collection(db, 'charities'), newCharity);
          return { id: docRef.id, ...newCharity };
        } catch (writeError) {
          console.warn("Unable to save new charity to marketplace manifestation. Using transient sync.", writeError);
          return { ...newCharity, id: 'transient' };
        }
      }
      
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Charity;
    } catch (error) {
      console.error("Error getting current charity:", error);
      // Fallback
      return {
        name: "World Central Kitchen",
        mission: "Providing meals in response to humanitarian, climate, and community crises.",
        selectionLogic: "Static fallback mechanism.",
        donationPercentage: 2,
        active: true,
        selectedAt: new Date()
      } as Charity;
    }
  },

  trackDonation: async (orderId: string, amount: number, charityId: string, charityName: string) => {
    try {
      await addDoc(collection(db, 'donations'), {
        orderId,
        amount,
        charityId,
        charityName,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error tracking donation:", error);
    }
  }
};
