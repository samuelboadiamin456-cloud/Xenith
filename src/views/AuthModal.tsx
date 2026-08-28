import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, UserPlus, LogIn, Check, Copy, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Player } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'register'
}) => {
  const { registerPlayer, loginAsPlayer, showToast } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'success'>(initialMode);
  const [createdPlayer, setCreatedPlayer] = useState<Player | null>(null);
  const [copied, setCopied] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');

  // Register form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [ign, setIgn] = useState('');
  const [role, setRole] = useState<Player['role']>('Rusher');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAsPlayer(loginIdentifier)) {
      onClose();
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const newP = registerPlayer({
      username,
      email,
      displayName,
      ign,
      role,
      country,
      bio
    });
    setCreatedPlayer(newP);
    setMode('success');
  };

  const handleCopy = () => {
    if (!createdPlayer) return;
    navigator.clipboard.writeText(createdPlayer.xnId);
    setCopied(true);
    showToast('Permanent XN-ID copied', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-[#0c1016] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative my-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {mode === 'success' && createdPlayer ? (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 rounded-xl bg-black/80 border border-emerald-500/40 p-1 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <img 
                src="/logo.jpg" 
                alt="XN Academy Crest" 
                className="w-full h-full object-contain rounded"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-1">
              <span className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest block">
                SECURITY CLEARANCE GRANTED
              </span>
              <h2 className="font-display text-3xl font-black text-white uppercase">
                Welcome to XN Academy
              </h2>
              <p className="font-body text-xs text-slate-400">
                Your permanent verified identifier has been generated:
              </p>
            </div>

            {/* Big XN-ID Display */}
            <div className="p-5 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-center space-y-2">
              <span className="font-mono text-xs text-slate-400 uppercase">OFFICIAL PERMANENT IDENTIFIER</span>
              <div className="font-mono text-4xl font-black text-cyan-400 tracking-wider">
                {createdPlayer.xnId}
              </div>
              <p className="font-mono text-[11px] text-slate-500">
                {createdPlayer.displayName} · IGN: {createdPlayer.ign}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold uppercase rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                Copy XN-ID
              </button>

              <button
                onClick={onClose}
                className="flex-1 py-3 bg-[#f4a261] hover:bg-[#ffb378] text-[#2b1400] font-display font-black text-xs uppercase tracking-wider chamfer-btn transition-colors cursor-pointer"
              >
                Enter Dashboard →
              </button>
            </div>
          </div>
        ) : mode === 'register' ? (
          <form onSubmit={handleRegister} className="space-y-4 font-mono text-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-black/80 border border-orange-500/40 p-1 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(244,162,97,0.2)]">
                <img 
                  src="/logo.jpg" 
                  alt="XN Academy Logo" 
                  className="w-full h-full object-contain rounded"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-0.5">
                <span className="font-mono text-[10px] font-bold text-orange-400 uppercase tracking-widest block">
                  CREATE OPERATIVE ACCOUNT
                </span>
                <h2 className="font-display text-2xl font-black text-white uppercase">
                  Join XN Academy
                </h2>
                <p className="font-body text-xs text-slate-400">
                  Receive your permanent immutable XN-ID and track your climb.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 uppercase mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ghost_hunter"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 uppercase mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Ghost Hunter"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase mb-1">In-Game Name (IGN)</label>
                <input
                  type="text"
                  value={ign}
                  onChange={(e) => setIgn(e.target.value)}
                  placeholder="e.g. GHOST"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 uppercase mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none cursor-pointer"
                >
                  {['Rusher', 'Sniper', 'IGL', 'Support', 'Fragger', 'Flex'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 uppercase mb-1">Country / Region</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. United Kingdom"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 uppercase mb-1">Operative Bio</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the academy about your competitive goals..."
                className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#f4a261] hover:bg-[#ffb378] text-[#2b1400] font-display font-black text-xs uppercase tracking-wider chamfer-btn transition-colors mt-2 cursor-pointer shadow-[0_0_20px_rgba(244,162,97,0.3)]"
            >
              Generate Permanent XN-ID →
            </button>

            <p className="text-center text-slate-400 text-[11px] pt-2">
              Already an operative?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-cyan-400 hover:underline font-bold cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4 font-mono text-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-black/80 border border-cyan-500/40 p-1 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                <img 
                  src="/logo.jpg" 
                  alt="XN Academy Logo" 
                  className="w-full h-full object-contain rounded"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-0.5">
                <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">
                  OPERATIVE AUTHENTICATION
                </span>
                <h2 className="font-display text-2xl font-black text-white uppercase">
                  Welcome Back
                </h2>
                <p className="font-body text-xs text-slate-400">
                  Enter your permanent XN-ID, username, or IGN.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 uppercase mb-1">XN-ID / Username / IGN</label>
              <input
                type="text"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="e.g. XN-027 or phantom_igl"
                className="w-full p-3 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none text-sm"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider chamfer-btn transition-colors mt-2 cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.3)]"
            >
              Authenticate Operative →
            </button>

            <p className="text-center text-slate-400 text-[11px] pt-2">
              Need a new XN-ID?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-orange-400 hover:underline font-bold cursor-pointer"
              >
                Create Account
              </button>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
};
