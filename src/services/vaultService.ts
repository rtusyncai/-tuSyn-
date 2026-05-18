import { db } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export type VaultItemType = 'habitat' | 'prithvi' | 'sonic_meditation' | 'sonic_composition' | 'ayurwear' | 'ayurwear_clothing' | 'prescription' | 'neuro_snapshot' | 'journal' | 'mood';

export interface VaultItem {
  id?: string;
  userId: string;
  type: VaultItemType;
  title: string;
  description?: string;
  data: any;
  image?: string;
  createdAt: any;
}

export const vaultService = {
  saveItem: async (userId: string, type: VaultItemType, title: string, data: any, image?: string, description?: string) => {
    try {
      const docRef = await addDoc(collection(db, 'vault'), {
        userId,
        type,
        title,
        description: description || '',
        data,
        image: image || '',
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error saving to vault:", error);
      throw error;
    }
  },

  getUserItems: async (userId: string, type?: VaultItemType) => {
    try {
      let q = query(
        collection(db, 'vault'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (type) {
        q = query(q, where('type', '==', type));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as VaultItem));
    } catch (error) {
      console.error("Error fetching vault items:", error);
      throw error;
    }
  },

  deleteItem: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vault', id));
    } catch (error) {
      console.error("Error deleting vault item:", error);
      throw error;
    }
  }
};
