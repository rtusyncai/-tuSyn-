import React, { useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Mail, Lock, Loader2 } from 'lucide-react';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create profile for new user
        const path = `profiles/${userCredential.user.uid}`;
        try {
          await setDoc(doc(db, 'profiles', userCredential.user.uid), {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            role: 'user',
            onboardingCompleted: false,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
        navigate('/onboarding');
        return;
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if profile exists, if not create it
      const docRef = doc(db, 'profiles', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        try {
          await setDoc(docRef, {
            uid: user.uid,
            email: user.email,
            role: 'user',
            onboardingCompleted: false,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `profiles/${user.uid}`);
        }
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-10 rounded-3xl border border-[#D1D1C1] shadow-2xl space-y-8"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-[#5A5A40]">{isLogin ? 'Welcome Back' : 'Join ṚtuSyn'}</h2>
          <p className="text-[#2D3436] opacity-60">Your journey to holistic wellness starts here.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#5A5A40] flex items-center gap-2">
              <Mail size={16} /> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#5A5A40] flex items-center gap-2">
              <Lock size={16} /> Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm italic">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5A5A40] text-white py-4 rounded-xl font-bold hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#D1D1C1]"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-[#2D3436] opacity-40">Or continue with</span></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full border border-[#D1D1C1] py-4 rounded-xl font-bold hover:bg-[#F5F5F0] transition-all flex items-center justify-center gap-2"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" loading="lazy" />
          Google
        </button>

        <p className="text-center text-sm text-[#2D3436]">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[#5A5A40] font-bold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};
