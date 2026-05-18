import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, RefreshCw, Trash2, LogOut, Loader2, Heart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export const DeactivatedPage = () => {
  const { user, refreshAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleRestore = async () => {
    if (!user) return;
    setLoading(true);
    const path = `profiles/${user.uid}`;
    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        status: 'active',
        restoredAt: new Date().toISOString()
      });
      await refreshAuth();
      navigate('/');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setLoading(false);
    }
  };

  const handleHardDelete = async () => {
    if (!user || !window.confirm("CRITICAL: This will permanently erase all your data from our servers. This action cannot be undone. Are you absolutely sure?")) return;
    setIsDeleting(true);
    const path = `profiles/${user.uid}`;
    try {
      // Delete profile
      await deleteDoc(doc(db, 'profiles', user.uid));
      // Delete Auth user
      await user.delete();
      navigate('/login');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <div className="max-w-2xl mx-auto py-20 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-12 rounded-[40px] border border-[#D1D1C1] shadow-2xl space-y-10 text-center"
      >
        <div className="w-24 h-24 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert size={48} />
        </div>

        <div className="space-y-4">
          <h2 className="text-4xl font-bold text-[#5A5A40]">Account Deactivated</h2>
          <p className="text-lg text-[#2D3436] opacity-70 leading-relaxed">
            Your account is currently in a "Soft Deleted" state. We've preserved your data according to our retrieval policy. 
            You can restore your account now or choose to permanently erase your data.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={handleRestore}
            disabled={loading || isDeleting}
            className="w-full bg-[#5A5A40] text-white py-5 rounded-2xl font-bold text-lg hover:bg-[#4A4A30] transition-all shadow-lg flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" /> : <RefreshCw size={24} />}
            Restore My Account
          </button>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 py-4 rounded-xl border border-[#D1D1C1] text-[#5A5A40] font-bold hover:bg-[#F5F5F0] transition-all"
            >
              <LogOut size={18} /> Sign Out
            </button>
            <button
              onClick={handleHardDelete}
              disabled={loading || isDeleting}
              className="flex items-center justify-center gap-2 py-4 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-all"
            >
              {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 size={18} />}
              Permanent Delete
            </button>
          </div>
        </div>

        <div className="pt-8 border-t border-[#D1D1C1] flex items-center justify-center gap-2 text-sm text-[#2D3436] opacity-40">
          <Heart size={14} />
          <span>We're here if you decide to stay.</span>
        </div>
      </motion.div>
    </div>
  );
};
