import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Lock, 
  UserPlus, 
  LogIn, 
  Check, 
  Copy, 
  X, 
  Key, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Crown, 
  FileText, 
  Image as ImageIcon,
  Camera,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Player } from '../types';
import { AvatarSelectorModal } from '../components/AvatarSelectorModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'admin-login' | 'admin-register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'register'
}) => {
  const { 
    registerPlayer, 
    loginAsPlayer, 
    bootstrapFirstAdmin, 
    requestAdminAccess, 
    loginAsAdmin, 
    adminStatus, 
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'player' | 'admin'>(
    initialMode.startsWith('admin') ? 'admin' : 'player'
  );
  
  const [playerMode, setPlayerMode] = useState<'login' | 'register' | 'success'>(
    initialMode === 'login' ? 'login' : 'register'
  );

  const [adminMode, setAdminMode] = useState<'login' | 'request' | 'bootstrap' | 'request-success'>('login');

  const [createdPlayer, setCreatedPlayer] = useState<Player | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  // Player Auth state
  const [playerIdentifier, setPlayerIdentifier] = useState('');
  const [playerPassword, setPlayerPassword] = useState('');

  // Player Register state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regIgn, setRegIgn] = useState('');
  const [regRole, setRegRole] = useState<Player['role']>('Rusher');
  const [regCountry, setRegCountry] = useState('');
  const [regBio, setRegBio] = useState('');
  const [regAvatarUrl, setRegAvatarUrl] = useState('');

  // Admin Auth state
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Admin Bootstrap / Request state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminRegPassword, setAdminRegPassword] = useState('');
  const [adminDisplayName, setAdminDisplayName] = useState('');
  const [adminReason, setAdminReason] = useState('');

  // Set default admin mode based on whether initial admin exists
  useEffect(() => {
    if (initialMode.startsWith('admin')) {
      setActiveTab('admin');
      if (!adminStatus.hasInitialAdmin) {
        setAdminMode('bootstrap');
      } else {
        setAdminMode(initialMode === 'admin-register' ? 'request' : 'login');
      }
    } else {
      setActiveTab('player');
      setPlayerMode(initialMode === 'login' ? 'login' : 'register');
    }
  }, [initialMode, adminStatus.hasInitialAdmin]);

  if (!isOpen) return null;

  // --- Handlers ---
  const handlePlayerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerIdentifier) return;
    setIsSubmitting(true);
    const success = await loginAsPlayer(playerIdentifier, playerPassword);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const handlePlayerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newP = await registerPlayer({
        username: regUsername,
        email: regEmail,
        password: regPassword,
        displayName: regDisplayName,
        ign: regIgn,
        role: regRole,
        country: regCountry,
        bio: regBio,
        avatarUrl: regAvatarUrl || undefined
      });
      setCreatedPlayer(newP);
      setPlayerMode('success');
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminIdentifier || !adminPassword) return;
    setIsSubmitting(true);
    const success = await loginAsAdmin(adminIdentifier, adminPassword);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const handleAdminBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await bootstrapFirstAdmin({
        username: adminUsername,
        email: adminEmail,
        password: adminRegPassword,
        displayName: adminDisplayName
      });
      onClose();
    } catch (err) {
      // toast handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await requestAdminAccess({
        username: adminUsername,
        email: adminEmail,
        password: adminRegPassword,
        displayName: adminDisplayName,
        reason: adminReason
      });
      setAdminMode('request-success');
    } catch (err) {
      // toast handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!createdPlayer) return;
    navigator.clipboard.writeText(createdPlayer.xnId);
    setCopied(true);
    showToast('Permanent XN-ID copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-lg bg-[#0c1016] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative my-auto space-y-5"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Portal Switcher Tabs: Operative vs Staff Command */}
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('player')}
              className={`flex-1 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'player'
                  ? 'bg-gradient-to-r from-orange-500/20 to-cyan-500/20 border border-cyan-500/40 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              Operative Access
            </button>
            <button
              onClick={() => {
                setActiveTab('admin');
                if (!adminStatus.hasInitialAdmin) {
                  setAdminMode('bootstrap');
                }
              }}
              className={`flex-1 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              Staff Command
            </button>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 1: OPERATIVE ACCESS */}
          {/* ========================================================================= */}
          {activeTab === 'player' && (
            <div>
              {/* SUCCESS SCREEN */}
              {playerMode === 'success' && createdPlayer ? (
                <div className="text-center space-y-6 py-4">
                  <div className="w-16 h-16 rounded-2xl bg-black/80 border border-emerald-500/40 p-1 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)] overflow-hidden">
                    {createdPlayer.avatarUrl ? (
                      <img 
                        src={createdPlayer.avatarUrl} 
                        alt={createdPlayer.displayName} 
                        className="w-full h-full object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <img 
                        src="/logo.jpg" 
                        alt="XN Academy Crest" 
                        className="w-full h-full object-contain rounded"
                        referrerPolicy="no-referrer"
                      />
                    )}
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
                    <p className="font-mono text-[11px] text-slate-400">
                      {createdPlayer.displayName} · IGN: {createdPlayer.ign} ({createdPlayer.role})
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
              ) : playerMode === 'register' ? (
                /* REGISTRATION FORM */
                <form onSubmit={handlePlayerRegister} className="space-y-4 font-mono text-xs">
                  <div className="flex items-center gap-3">
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
                    </div>
                  </div>

                  {/* Profile Picture Chooser Button */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-cyan-500/40 p-0.5 overflow-hidden flex items-center justify-center shrink-0">
                      {regAvatarUrl ? (
                        <img 
                          src={regAvatarUrl} 
                          alt="Selected Avatar" 
                          className="w-full h-full object-cover rounded-lg"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Camera className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-white block">Profile Picture (Optional)</span>
                      <p className="text-[10px] text-slate-400 truncate">
                        {regAvatarUrl ? 'Custom operative picture attached' : 'Upload device photo or pick avatar preset'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAvatarModalOpen(true)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] uppercase font-bold rounded border border-slate-700 cursor-pointer shrink-0"
                    >
                      {regAvatarUrl ? 'Change' : 'Choose'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 uppercase mb-1">Username *</label>
                      <input
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="e.g. ghost_hunter"
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 uppercase mb-1">Email *</label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="name@email.com"
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Account Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Set account login password"
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 uppercase mb-1">Display Name *</label>
                      <input
                        type="text"
                        value={regDisplayName}
                        onChange={(e) => setRegDisplayName(e.target.value)}
                        placeholder="e.g. Ghost Hunter"
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 uppercase mb-1">In-Game Name (IGN) *</label>
                      <input
                        type="text"
                        value={regIgn}
                        onChange={(e) => setRegIgn(e.target.value)}
                        placeholder="e.g. GHOST"
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 uppercase mb-1">Combat Role *</label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as any)}
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
                        value={regCountry}
                        onChange={(e) => setRegCountry(e.target.value)}
                        placeholder="e.g. United Kingdom"
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Operative Bio</label>
                    <textarea
                      rows={2}
                      value={regBio}
                      onChange={(e) => setRegBio(e.target.value)}
                      placeholder="Competitive background or academy goals..."
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-[#f4a261] hover:bg-[#ffb378] text-[#2b1400] font-display font-black text-xs uppercase tracking-wider chamfer-btn transition-colors mt-2 cursor-pointer shadow-[0_0_20px_rgba(244,162,97,0.3)] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Provisioning ID...' : 'Generate Permanent XN-ID →'}
                  </button>

                  <p className="text-center text-slate-400 text-[11px] pt-1">
                    Already an operative?{' '}
                    <button
                      type="button"
                      onClick={() => setPlayerMode('login')}
                      className="text-cyan-400 hover:underline font-bold cursor-pointer"
                    >
                      Sign In
                    </button>
                  </p>
                </form>
              ) : (
                /* LOGIN FORM */
                <form onSubmit={handlePlayerLogin} className="space-y-4 font-mono text-xs">
                  <div className="flex items-center gap-3">
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
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase mb-1">XN-ID / Username / Email</label>
                    <input
                      type="text"
                      value={playerIdentifier}
                      onChange={(e) => setPlayerIdentifier(e.target.value)}
                      placeholder="e.g. XN-001 or ghost_hunter"
                      className="w-full p-3 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={playerPassword}
                        onChange={(e) => setPlayerPassword(e.target.value)}
                        placeholder="Enter your operative password"
                        className="w-full p-3 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider chamfer-btn transition-colors mt-2 cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.3)] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Authenticating...' : 'Authenticate Operative →'}
                  </button>

                  <p className="text-center text-slate-400 text-[11px] pt-1">
                    Need a new XN-ID?{' '}
                    <button
                      type="button"
                      onClick={() => setPlayerMode('register')}
                      className="text-orange-400 hover:underline font-bold cursor-pointer"
                    >
                      Create Operative Account
                    </button>
                  </p>
                </form>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: STAFF COMMAND PORTAL & APPROVAL SYSTEM */}
          {/* ========================================================================= */}
          {activeTab === 'admin' && (
            <div className="space-y-4">
              {/* HEAD OF COMMAND BOOTSTRAP (WHEN NO ADMIN EXISTS) */}
              {adminMode === 'bootstrap' ? (
                <form onSubmit={handleAdminBootstrap} className="space-y-4 font-mono text-xs">
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold uppercase text-[11px]">
                      <Crown className="w-4 h-4 text-amber-400" />
                      Initial Command Slot Open
                    </div>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed font-body">
                      No administrator has been initialized yet. As the project creator, you are claiming the founding <strong>Head of Command</strong> account. Once created, direct admin registration will automatically lock, and any future applicants must be approved by you.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 uppercase mb-1">Admin Username *</label>
                      <input
                        type="text"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="e.g. Commander"
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded text-white outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 uppercase mb-1">Display Name *</label>
                      <input
                        type="text"
                        value={adminDisplayName}
                        onChange={(e) => setAdminDisplayName(e.target.value)}
                        placeholder="e.g. Lead Commander"
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded text-white outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Command Email *</label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@xn-academy.gg"
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded text-white outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Head of Command Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={adminRegPassword}
                        onChange={(e) => setAdminRegPassword(e.target.value)}
                        placeholder="Set strong command passkey"
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded text-white outline-none pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider chamfer-btn transition-colors mt-2 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Provisioning...' : 'Initialize Head of Command Account →'}
                  </button>
                </form>
              ) : adminMode === 'request' ? (
                /* REQUEST CLEARANCE FORM (WHEN INITIAL ADMIN EXISTS) */
                <form onSubmit={handleAdminRequest} className="space-y-4 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold uppercase text-[11px] text-cyan-400">
                      <FileText className="w-4 h-4" />
                      Staff Clearance Application
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-body">
                      The Head of Command has locked direct access. Submit your credentials and justification to request staff review permissions.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 uppercase mb-1">Username *</label>
                      <input
                        type="text"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="e.g. Officer_Viper"
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 uppercase mb-1">Display Name *</label>
                      <input
                        type="text"
                        value={adminDisplayName}
                        onChange={(e) => setAdminDisplayName(e.target.value)}
                        placeholder="e.g. Officer Viper"
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Email *</label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="officer@email.com"
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Proposed Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={adminRegPassword}
                        onChange={(e) => setAdminRegPassword(e.target.value)}
                        placeholder="Set account password"
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Clearance Reason / Qualifications</label>
                    <textarea
                      rows={2}
                      value={adminReason}
                      onChange={(e) => setAdminReason(e.target.value)}
                      placeholder="Explain your role in XN Academy competitive telemetry auditing..."
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider chamfer-btn transition-colors mt-2 cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.3)] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting Application...' : 'Submit Clearance Request →'}
                  </button>

                  <p className="text-center text-slate-400 text-[11px]">
                    Already have an approved staff account?{' '}
                    <button
                      type="button"
                      onClick={() => setAdminMode('login')}
                      className="text-amber-400 hover:underline font-bold cursor-pointer"
                    >
                      Admin Sign In
                    </button>
                  </p>
                </form>
              ) : adminMode === 'request-success' ? (
                /* REQUEST PENDING NOTICE */
                <div className="text-center space-y-5 py-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                    <Key className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-display text-2xl font-black text-white uppercase">
                      Application Submitted
                    </h3>
                    <p className="font-body text-xs text-slate-400 max-w-sm mx-auto">
                      Your staff access request is now in the Head of Command review queue. You will be able to log in as soon as the Head of Command approves your application in the Admin Portal.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs uppercase rounded transition-colors"
                  >
                    Understood
                  </button>
                </div>
              ) : (
                /* STANDARD ADMIN LOGIN FORM */
                <form onSubmit={handleAdminLogin} className="space-y-4 font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                      <Crown className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                        COMMAND ACCESS ONLY
                      </span>
                      <h2 className="font-display text-2xl font-black text-white uppercase">
                        Admin Sign In
                      </h2>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Staff Username / Email</label>
                    <input
                      type="text"
                      value={adminIdentifier}
                      onChange={(e) => setAdminIdentifier(e.target.value)}
                      placeholder="Username or admin email"
                      className="w-full p-3 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded text-white outline-none text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Passkey Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Security passkey"
                        className="w-full p-3 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded text-white outline-none text-sm pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider chamfer-btn transition-colors mt-2 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Validating Clearance...' : 'Verify Staff Clearance →'}
                  </button>

                  <p className="text-center text-slate-400 text-[11px] pt-1">
                    Need new staff clearance?{' '}
                    <button
                      type="button"
                      onClick={() => setAdminMode('request')}
                      className="text-cyan-400 hover:underline font-bold cursor-pointer"
                    >
                      Request Admin Access
                    </button>
                  </p>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Avatar Chooser Modal */}
      <AvatarSelectorModal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        displayName={regDisplayName || 'Operative'}
        currentAvatarUrl={regAvatarUrl}
        onSaveAvatar={(url) => setRegAvatarUrl(url)}
      />
    </>
  );
};
