import React, { useState } from 'react';
import { User, Shield, ArrowLeft, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Player } from '../types';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      displayName,
      ign: ign.toUpperCase(),
      role,
      country,
      bio
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
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share your competitive background and achievements..."
              className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="submit"
              className="flex-1 py-3 bg-[#f4a261] hover:bg-[#ffb378] text-[#2b1400] font-display font-black text-xs uppercase tracking-wider chamfer-btn transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
    </div>
  );
};
