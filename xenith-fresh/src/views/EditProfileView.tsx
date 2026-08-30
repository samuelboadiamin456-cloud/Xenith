import React, { useState } from 'react';
import { User, Shield, ArrowLeft, Save, Camera, Sparkles, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Player } from '../types';
import { AvatarSelectorModal } from '../components/AvatarSelectorModal';

export const EditProfileView: React.FC = () => {
  const { currentPlayer, updateProfile, setActiveView } = useApp();

  if (!currentPlayer) {
    return (
      <div className="py-20 text-center font-mono text-xs text-slate-400">
        Please sign in to edit profile.
      </div>
    );
  }

  const [displayName, setDisplayName] = useState(currentPlayer.displayName);
  const [ign, setIgn] = useState(currentPlayer.ign);
  const [role, setRole] = useState<Player['role']>(currentPlayer.role);
  const [country, setCountry] = useState(currentPlayer.country || '');
  const [bio, setBio] = useState(currentPlayer.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentPlayer.avatarUrl || '');
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      displayName,
      ign: ign.toUpperCase(),
      role,
      country,
      bio,
      avatarUrl: avatarUrl || undefined
    });
    setActiveView('dashboard');
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      <button
        onClick={() => setActiveView('dashboard')}
        className="inline-flex items-center gap-1.5 font-mono text-xs text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Dashboard
      </button>

      <div className="bg-[#0b0f15] border border-slate-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="border-b border-slate-800/80 pb-4">
          <span className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-1">
            PLAYER SPECIFICATIONS
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            EDIT YOUR <span className="text-orange-400">PROFILE.</span>
          </h1>
          <p className="font-body text-xs text-slate-400 mt-1">
            Permanent Identifier: <b className="text-cyan-400 font-mono">{currentPlayer.xnId}</b> (Immutable)
          </p>
        </div>

        {/* Profile Picture Change Section */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-2xl border-2 border-cyan-500/50 bg-slate-950 p-0.5 overflow-hidden flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 text-slate-950 font-display font-black text-3xl flex items-center justify-center">
                {(displayName || 'P').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1">
            <span className="font-mono text-xs font-bold text-white uppercase block">
              Operative Visual Avatar
            </span>
            <p className="font-mono text-[11px] text-slate-400">
              Upload any image from your computer, phone, or link from the web.
            </p>
            <button
              type="button"
              onClick={() => setAvatarModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 rounded font-mono text-[11px] uppercase font-bold cursor-pointer transition-colors mt-1"
            >
              <Camera className="w-3.5 h-3.5" />
              Change Picture
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-slate-400 uppercase mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
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
              className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 uppercase mb-1">Primary Role</label>
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
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share your competitive background and achievements..."
              className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
            />
          </div>

          {/* Locked Telemetry Notice */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                Lifetime Combat Telemetry (Locked)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                Staff Calibration Only
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-[11px] font-mono text-center pt-1">
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">MATCHES</span>
                <span className="font-bold text-white">{currentPlayer.lifetimeStats.matches}</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">WINS</span>
                <span className="font-bold text-emerald-400">{currentPlayer.lifetimeStats.wins}</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">KILLS</span>
                <span className="font-bold text-white">{currentPlayer.lifetimeStats.kills}</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">WIN RATE</span>
                <span className="font-bold text-amber-400">{currentPlayer.lifetimeStats.winRate}%</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Note: Telemetry metrics cannot be modified directly. If you need stat adjustments, file a verification report with Academy Command for manual calibration.
            </p>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="submit"
              className="flex-1 py-3 bg-[#f4a261] hover:bg-[#ffb378] text-[#2b1400] font-display font-black text-xs uppercase tracking-wider chamfer-btn transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(244,162,97,0.3)]"
            >
              <Save className="w-4 h-4" /> Save Specifications
            </button>
            <button
              type="button"
              onClick={() => setActiveView('dashboard')}
              className="px-5 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs uppercase rounded transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <AvatarSelectorModal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        displayName={displayName}
        currentAvatarUrl={avatarUrl}
        onSaveAvatar={(url) => setAvatarUrl(url)}
      />
    </div>
  );
};
