import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  Calendar, 
  Globe, 
  ArrowLeft, 
  Trophy,
  Award
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RankHexBadge } from '../components/RankHexBadge';
import { getRankProgress, RANK_CONFIGS } from '../data/rankConfigs';

export const PublicProfileView: React.FC = () => {
  const { 
    players, 
    selectedProfileXnId, 
    currentPlayer, 
    setActiveView, 
    triggerRankCelebration,
    showToast 
  } = useApp();

  const [copied, setCopied] = React.useState(false);

  const targetXnId = selectedProfileXnId || currentPlayer?.xnId || (players[0] ? players[0].xnId : null);
  const player = players.find(p => targetXnId && p.xnId.toLowerCase() === targetXnId.toLowerCase()) || players[0] || null;

  if (!player) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="p-8 rounded-2xl bg-[#0b0f15] border border-slate-800 space-y-4">
          <p className="font-mono text-xs text-slate-400">
            No operative profile found or registered yet.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setActiveView('dashboard')}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-black text-xs uppercase rounded transition-colors cursor-pointer"
            >
              Claim Your Operative ID
            </button>
            <button
              onClick={() => setActiveView('home')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs uppercase rounded transition-colors cursor-pointer"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = getRankProgress(player.totalXp);
  const config = RANK_CONFIGS[player.currentRank];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    showToast('Public profile link copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Back Button */}
      <button
        onClick={() => setActiveView('leaderboard')}
        className="inline-flex items-center gap-1.5 font-mono text-xs text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Leaderboard
      </button>

      {/* Main Profile Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#141b25] via-[#0d131a] to-[#12161f] border border-cyan-500/30 p-6 sm:p-10 shadow-2xl overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-4 right-6 hidden lg:block opacity-25 pointer-events-none">
          <img 
            src="/logo.jpg" 
            alt="XN Academy Emblem" 
            className="w-28 h-28 object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 text-slate-950 font-display font-black text-3xl sm:text-4xl flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.3)] shrink-0 overflow-hidden border-2 border-cyan-400/40">
              {player.avatarUrl ? (
                <img 
                  src={player.avatarUrl} 
                  alt={player.displayName} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                player.displayName.charAt(0)
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-cyan-400">
                  {player.xnId}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {player.verificationStatus}
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-black text-white">
                {player.displayName}
              </h1>

              <p className="font-mono text-xs text-slate-400">
                IGN: <b className="text-slate-200">{player.ign}</b> · Role: <b className="text-slate-200">{player.role}</b>
              </p>
            </div>
          </div>

          {/* Hexagonal Rank Badge */}
          <div 
            className="cursor-pointer flex flex-col items-center" 
            onClick={() => triggerRankCelebration(player.currentRank)}
            title="Launch Rank HUD"
          >
            <RankHexBadge rank={player.currentRank} size="lg" />
            <span className="font-mono text-[10px] text-amber-400 mt-1 uppercase font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> View HUD
            </span>
          </div>
        </div>

        {/* Profile Quick Spec Metadata */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-slate-400">
          <div className="flex flex-wrap gap-6">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              Region: <b className="text-white">{player.country || 'Global'}</b>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Joined: <b className="text-white">{new Date(player.joinedAt).toLocaleDateString()}</b>
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-orange-400" />
              Peak Rank: <b className="text-orange-400">{player.peakRank}</b>
            </span>
          </div>

          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            Copy Profile Link
          </button>
        </div>
      </div>

      {/* Grid: Official Statistics (Left) & About (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Statistics HUD */}
        <div className="md:col-span-7 bg-[#0b0f15] border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <span className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest block">
                AUTHENTICATED TELEMETRY
              </span>
              <h2 className="font-display text-xl font-bold text-white uppercase">
                Official Statistics
              </h2>
            </div>
            <span className="font-mono text-xs font-bold text-white bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
              {player.lifetimeStats?.matches ?? 0} Matches Verified
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
              <span className="font-mono text-[10px] text-slate-400 uppercase block">KILLS</span>
              <span className="font-display text-2xl font-black text-white">{player.lifetimeStats?.kills ?? 0}</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
              <span className="font-mono text-[10px] text-slate-400 uppercase block">WINS</span>
              <span className="font-display text-2xl font-black text-emerald-400">{player.lifetimeStats?.wins ?? 0}</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
              <span className="font-mono text-[10px] text-slate-400 uppercase block">K/D</span>
              <span className="font-display text-2xl font-black text-cyan-400">
                {(Number(player.lifetimeStats?.kd) || 0).toFixed(2)}
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
              <span className="font-mono text-[10px] text-slate-400 uppercase block">WIN RATE</span>
              <span className="font-display text-2xl font-black text-amber-400">
                {(Number(player.lifetimeStats?.winRate) || 0).toFixed(1)}%
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
              <span className="font-mono text-[10px] text-slate-400 uppercase block">TOTAL XP</span>
              <span className="font-display text-2xl font-black text-white">{player.totalXp ?? 0}</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
              <span className="font-mono text-[10px] text-slate-400 uppercase block">HS %</span>
              <span className="font-display text-2xl font-black text-red-400">
                {(Number(player.lifetimeStats?.hs) || 0).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Next Clearance Tier</span>
              <span className="text-cyan-400 font-bold">{progress.nextTier || 'MAX REACHED'} ({progress.percent}%)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 rounded-full"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* About Operative & Status Clearance */}
        <div className="md:col-span-5 bg-[#0b0f15] border border-slate-800 rounded-xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="font-mono text-xs font-bold text-orange-400 uppercase tracking-widest block">
                OPERATIVE BACKGROUND
              </span>
              <h2 className="font-display text-xl font-bold text-white uppercase">
                Vanguard Dossier
              </h2>
            </div>

            <p className="font-body text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-lg border border-slate-800">
              {player.bio || 'This operative has not yet published an unclassified biography.'}
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded bg-slate-900/40 border border-slate-800">
                <span className="text-slate-400">Clearance Level</span>
                <span className="font-bold text-white uppercase">{config.clearanceLevel}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-slate-900/40 border border-slate-800">
                <span className="text-slate-400">XP Multiplier</span>
                <span className="font-bold text-cyan-400">{config.multiplier}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-slate-900/40 border border-slate-800">
                <span className="text-slate-400">Tier Perk</span>
                <span className="font-bold text-slate-200 uppercase">{config.perkDescription}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => triggerRankCelebration(player.currentRank)}
            className="w-full py-3 bg-[#f4a261] hover:bg-[#ffb378] text-[#2b1400] font-display font-black text-xs uppercase tracking-wider chamfer-btn transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            <Sparkles className="w-4 h-4" />
            Launch Rank HUD Celebration
          </button>
        </div>
      </div>
    </div>
  );
};
