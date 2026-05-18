import { GoogleGenAI } from "@google/genai";
import { db } from "../lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  serverTimestamp,
  doc,
  updateDoc
} from "firebase/firestore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AppManifestation {
  id?: string;
  type: 'feature' | 'insight' | 'page' | 'ornament' | 'musical_pattern';
  title: string;
  description: string;
  status: 'draft' | 'deployed' | 'deprecated';
  aiReasoning: string;
  config: any;
  createdAt: any;
}

export class NeuralGrowthService {
  private static collectionName = 'manifestations';
  private static telemetryCollection = 'telemetry';

  static async logInteraction(userId: string, type: string, metadata: any = {}) {
    try {
      await addDoc(collection(db, this.telemetryCollection), {
        userId,
        type,
        metadata,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("Telemetry error:", err);
    }
  }

  static async triggerEvolution(userId: string, userProfile: any) {
    // 1. Fetch recent interactions
    const q = query(
      collection(db, this.telemetryCollection),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const snapshot = await getDocs(q);
    const interactions = snapshot.docs.map(d => d.data());

    // 2. Ask Gemini to "evolve" the app based on these interactions and web trends
    const prompt = `
      You are the ṚtuSyn Neural Architect.
      User Profile: ${JSON.stringify(userProfile)}
      Recent Interactions: ${JSON.stringify(interactions)}
      
      Task: Propose an autonomous evolution for the ṚtuSyn application. 
      This could be:
      - A new 'Ornament of Balance' design.
      - A new specific meditation frequency or sonic pattern.
      - A new insight about their current lifestyle trends.
      - A suggestion for a new UI micro-interaction that would help them.
      
      Return a JSON object with:
      {
        "type": "feature" | "insight" | "ornament" | "musical_pattern",
        "title": "Creative Title",
        "description": "User-facing description",
        "aiReasoning": "Why this evolution is happening now (based on user data and seasonal trends)",
        "config": { ... specific details for the feature ... }
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true }
        }
      });

      const manifestation = JSON.parse(response.text);
      
      // 3. Save as a new manifestation
      await addDoc(collection(db, this.collectionName), {
        ...manifestation,
        userId,
        status: 'deployed',
        createdAt: serverTimestamp(),
      });

      return manifestation;
    } catch (err) {
      console.error("Evolution trigger failed:", err);
      return null;
    }
  }

  static async getManifestations(userId: string) {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as AppManifestation[];
  }
}
