import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export type RevenueModel = 'subscription' | 'marketplace' | 'hybrid';

export interface UserWealthProfile {
  suggestedModel: RevenueModel;
  reasoning: string;
  activityMetrics: {
    vaultCount: number;
    marketplaceListings: number;
    designsCreated: number;
  };
}

export const monetizationService = {
  async analyzeUserPath(userId: string): Promise<UserWealthProfile> {
    let vaultCount = 0;
    let designsCreated = 0;
    let marketplaceListings = 0;
    let dropshipCount = 0;

    try {
      // Fetch activity across different sectors
      try {
        const vaultSnap = await getDocs(query(collection(db, 'vault'), where('userId', '==', userId), limit(1)));
        vaultCount = vaultSnap.size;
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'vault');
      }

      try {
        const dropshipSnap = await getDocs(query(collection(db, 'dropship_orders'), where('vendorId', '==', userId), limit(1)));
        dropshipCount = dropshipSnap.size;
      } catch (e) {
        console.error("Dropship check failed:", e);
      }

      try {
        const designSnap = await getDocs(query(collection(db, `profiles/${userId}/ayurwear`), limit(1)));
        designsCreated = designSnap.size;
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, `profiles/${userId}/ayurwear`);
      }

      try {
        // Check all marketplace sectors
        const [mealsSnap, produceSnap, servicesSnap] = await Promise.all([
          getDocs(query(collection(db, 'marketplace_meals'), where('userId', '==', userId), limit(1))),
          getDocs(query(collection(db, 'marketplace_produce'), where('userId', '==', userId), limit(1))),
          getDocs(query(collection(db, 'marketplace_services'), where('userId', '==', userId), limit(1)))
        ]);
        marketplaceListings = mealsSnap.size + produceSnap.size + servicesSnap.size;
      } catch (e) {
        console.error("Marketplace check failed:", e);
        // We don't want to block the whole analysis if one marketplace sector fails, but we log it
      }

      // Intelligence Logic
      if (dropshipCount > 0) {
        return {
          suggestedModel: 'marketplace',
          reasoning: 'Your participation in the Hyper-Dropship network positions you as a key Node Operator. We suggest the Merchant Path to scale your proxy logistics.',
          activityMetrics: { vaultCount, marketplaceListings, designsCreated }
        };
      }

      if (marketplaceListings > 0) {
        return {
          suggestedModel: 'marketplace',
          reasoning: 'As an active Artisan, the Merchant Path provides the tools to scale your sacred commerce.',
          activityMetrics: { vaultCount, marketplaceListings, designsCreated }
        };
      }

      if (vaultCount > 0 || designsCreated > 0) {
        return {
          suggestedModel: 'subscription',
          reasoning: 'Your deep engagement with AI insights suggests the Seeker Path for unlimited wisdom storage.',
          activityMetrics: { vaultCount, marketplaceListings, designsCreated }
        };
      }

      return {
        suggestedModel: 'hybrid',
        reasoning: 'Welcome to Aiveda. Explore all paths to find your unique balance of growth and commerce.',
        activityMetrics: { vaultCount, marketplaceListings, designsCreated }
      };
    } catch (error) {
      console.error("Monetization analysis error:", error);
      return {
        suggestedModel: 'subscription',
        reasoning: 'Begin your journey with the Path of Wisdom.',
        activityMetrics: { vaultCount, marketplaceListings, designsCreated }
      };
    }
  },

  async createCheckoutSession(items: any[]) {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }
    
    return response.json();
  }
};
