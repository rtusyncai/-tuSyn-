import { db } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface MealPlanEntry {
  id?: string;
  userId: string;
  day: DayOfWeek;
  mealType: MealType;
  recipeTitle: string;
  recipeData: any;
  createdAt: any;
}

export const mealService = {
  saveMealPlan: async (userId: string, day: DayOfWeek, mealType: MealType, recipeTitle: string, recipeData: any) => {
    try {
      const docRef = await addDoc(collection(db, 'profiles', userId, 'meal_plan'), {
        userId,
        day,
        mealType,
        recipeTitle,
        recipeData,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error saving to meal plan:", error);
      throw error;
    }
  },

  getMealPlan: async (userId: string) => {
    try {
      const q = query(
        collection(db, 'profiles', userId, 'meal_plan'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MealPlanEntry));
    } catch (error) {
      console.error("Error fetching meal plan:", error);
      throw error;
    }
  },

  deleteMealPlanEntry: async (userId: string, entryId: string) => {
    try {
      await deleteDoc(doc(db, 'profiles', userId, 'meal_plan', entryId));
    } catch (error) {
      console.error("Error deleting meal plan entry:", error);
      throw error;
    }
  }
};
