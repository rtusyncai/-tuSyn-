import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, updateDoc, increment, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore with explicit settings to bypass potential WebSocket blockages in sanboxed environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  experimentalAutoDetectLongPolling: false, // Prevents conflict if default is true in some versions
  useFetchStreams: false, // Often necessary in restricted network environments to prevent connection hangs
} as any, (firebaseConfig as any).firestoreDatabaseId);

// Validate Connection to Firestore (Per Critical Constraint)
async function testConnection() {
  try {
    // Attempt to fetch a non-existent document using server-only fetch to bypass cache
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection verified (Reachability Check).");
    
    // Check if user is signed in but potentially unverified (which causes permission errors)
    auth.onAuthStateChanged((user) => {
      if (user && !user.emailVerified) {
        console.warn("User is signed in but email is NOT verified. This may cause 'Missing or insufficient permissions' errors due to current firestore.rules.");
      }
    });
  } catch (error: any) {
    if (error?.message?.includes('the client is offline') || error?.code === 'unavailable') {
      console.error("Firestore connection failed (UNAVAILABLE). This usually indicates a networking issue or blocked WebSocket/long-polling.");
      console.error("Error specifics:", error);
    } else if (error?.code === 'permission-denied') {
       console.warn("Firestore reachable, but permission denied. Check if your email is verified or if rules allow access to '_connection_test'.");
    } else {
      console.error("Firestore test connection error:", error);
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function trackEngagement(page: 'nourish' | 'sanctuary' | 'habitat' | 'habitat_refine' | 'ayurwear' | 'prithvi' | 'yoga_flow' | 'meditation' | 'marketplace') {
  if (!auth.currentUser) return;
  const userRef = doc(db, 'profiles', auth.currentUser.uid);
  try {
    await updateDoc(userRef, {
      [`engagement.${page}`]: increment(1)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `profiles/${auth.currentUser.uid}`);
  }
}
