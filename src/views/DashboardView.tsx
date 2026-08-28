import React from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Upload, 
  ExternalLink, 
  Edit3, 
  Sparkles, 
  Copy, 
  Check, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Award,
  Zap,
  Target
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RankHexBadge } from '../components/RankHexBadge';
import { getRankProgress, RANK_CONFIGS } from '../data/rankConfigs';

export const DashboardView: React.FC = () => {
  const { 
    currentPlayer, 
    submissions, 
    setActiveView, 
    viewPlayerProfile, 
    triggerRankCelebration,
    showToast,
    openAuthModal
  } = useApp();

  const [copied, setCopied] = React.useState(false);

  if (!currentPlayer) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-6">
        <div className="p-8 rounded-2xl bg-[#0c1016] border border-cyan-500/30 shadow-[0_0_30px_rgba(56,189,248,0.15)] space-y-5">
          <div className="w-16 h-16 rounded-xl bg-black/80 border border-cyan-500/40 p-1 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(56,189,248,0.25)]">
            <img 
              src="/logo.jpg" 
              alt="XN Academy Crest" 
              className="w-full h-full object-contain rounded"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-widest block mb-1">
              OPERATIVE ACCESS REQUIRED
            </span>
            <h2 className="font-display text-2xl font-black text-white uppercase">
              Operative Dashboard
            </h2>
            <p className="font-body text-xs text-slate-400 mt-1">
              Sign in with your verified permanent XN-ID or register your profile to view your personal dashboard, submission history, and clearance trajectory.
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => openAuthModal('login')}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider chamfer-btn transition-colors cursor-pointer"
            >
              Sign In with Permanent XN-ID →
            </button>
            <button
              onClick={() => openAuthModal('register')}
              className="w-full py-3 bg-[#f4a261] hover:bg-[#ffb378] text-[#2b1400] font-display font-black text-xs uppercase tracking-wider chamfer-btn transition-all cursor-pointer shadow-[0_0_15px_rgba(244,162,97,0.25)]"
            >
              Claim New Operative Identity →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const p = currentPlayer;
  const progress = getRankProgress(p.totalXp);
  const playerSubmissions = submissions.filter(s => s.xnId === p.xnId);
  const config = RANK_CONFIGS[p.currentRank];

  const handleCopyXnId = () => {
    navigator.clipboard.writeText(p.xnId);
    setCopied(true);
    showToast(`Copied ${p.xnId} to clipboard`, 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Dashboard Top Header */}
      <div className="border-b border-slate-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-bold text-cyan-400 tracking-[0.2em] uppercase block mb-1">
            PLAYER COMMAND DASHBOARD
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            WELCOME, <span className="text-cyan-400">{p.displayName}.</span>
          </h1>
          <p className="font-body text-sm text-slate-400 mt-1">
            Manage your competitive specifications, submit verified SITREPs, and track your climb to S-MAX.
          </p>
        </div>

        {/* Permanent XN-ID Chip */}
        <div 
          onClick={handleCopyXnId}
          className="bg-slate-900/90 border border-cyan-500/50 hover:border-cyan-400 rounded-xl p-3.5 px-5 flex items-center gap-4 cursor-pointer transition-all shadow-[0_0_15px_rgba(56,189,248,0.15)] group"
        >
          <div>
            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
              YOUR PERMANENT XN-ID
            </span>
            <span className="font-mono text-2xl font-black text-cyan-400 tracking-wider">
              {p.xnId}
            </span>
          </div>
          <div className="p-2 rounded bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Main Grid: Profile Panel (Left) & Performance HUD (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Profile Card (Left 4 cols) */}
        <div className="lg:col-span-4 bg-gradient-to-b from-[#121822] to-[#0c1016] border border-slate-800 rounded-xl p-6 space-y-6 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 text-slate-950 font-display font-black text-2xl flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.3)] overflow-hidden border border-cyan-400/40">
              {p.avatarUrl ? (
                <img 
                  src={p.avatarUrl} 
                  alt={p.displayName} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                p.displayName.charAt(0)
              )}
            </div>

            <div className="cursor-pointer" onClick={() => triggerRankCelebration(p.currentRank)}>
              <RankHexBadge rank={p.currentRank} size="md" />
            </div>
          </div>

          <div>
            <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">
              OPERATIVE PROFILE
            </span>
            <h2 className="font-display text-2xl font-black text-white">
              {p.displayName}
            </h2>
            <p className="font-mono text-xs text-slate-400 mt-0.5">
              IGN: <b className="text-slate-200">{p.ign}</b> · Role: <b className="text-slate-200">{p.role}</b>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 font-mono text-[11px] font-bold text-amber-400">
              {p.currentRank} RANK
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-[11px] text-slate-300">
              {p.academyStatus}
            </span>
            <span className="px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 font-mono text-[11px] text-cyan-400">
              {p.verificationStatus}
            </span>
          </div>

          {p.bio && (
            <p className="font-body text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded border border-slate-800/80">
              "{p.bio}"
            </p>
          )}

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <button
              onClick={() => setActiveView('submit')}
              className="w-full py-3 bg-[#f4a261] hover:bg-[#ffb378] text-[#2b1400] font-display font-black text-xs uppercase tracking-wider chamfer-btn transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Submit SITREP
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => viewPlayerProfile(p.xnId)}
                className="py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 font-mono text-[11px] font-bold uppercase rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Public Record
              </button>

              <button
                onClick={() => setActiveView('edit-profile')}
                className="py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px] font-bold uppercase rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Performance HUD (Right 8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Performance HUD Stats Box */}
          <div className="bg-[#0b0f15] border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-orange-400 uppercase tracking-wider block">
                  LIFETIME SPECIFICATIONS
                </span>
                <h3 className="font-display text-xl font-bold text-white uppercase">
                  Verified Performance
                </h3>
              </div>
              <span className="font-mono text-sm font-black text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded border border-cyan-500/30">
                {p.totalXp.toLocaleString()} XP
              </span>
            </div>

            {/* 6-Metric HUD Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-mono text-[10px] text-slate-400 uppercase block">KILLS</span>
                <span className="font-display text-2xl sm:text-3xl font-black text-white">
                  {p.lifetimeStats?.kills ?? 0}
                </span>
              </div>

              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-mono text-[10px] text-slate-400 uppercase block">WINS</span>
                <span className="font-display text-2xl sm:text-3xl font-black text-emerald-400">
                  {p.lifetimeStats?.wins ?? 0}
                </span>
              </div>

              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-mono text-[10px] text-slate-400 uppercase block">MATCHES</span>
                <span className="font-display text-2xl sm:text-3xl font-black text-slate-200">
                  {p.lifetimeStats?.matches ?? 0}
                </span>
              </div>

              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-mono text-[10px] text-slate-400 uppercase block">K/D RATIO</span>
                <span className="font-display text-2xl sm:text-3xl font-black text-cyan-400">
                  {(Number(p.lifetimeStats?.kd) || 0).toFixed(2)}
                </span>
              </div>

              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-mono text-[10px] text-slate-400 uppercase block">WIN RATE</span>
                <span className="font-display text-2xl sm:text-3xl font-black text-amber-400">
                  {(Number(p.lifetimeStats?.winRate) || 0).toFixed(1)}%
                </span>
              </div>

              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-mono text-[10px] text-slate-400 uppercase block">HEADSHOT %</span>
                <span className="font-display text-2xl sm:text-3xl font-black text-red-400">
                  {(Number(p.lifetimeStats?.hs) || 0).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Rank Journey Progress Bar */}
            <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-cyan-400" />
                  Progress to {progress.nextTier ? `${progress.nextTier} RANK` : 'APEX S-MAX'}
                </span>
                <span className="text-cyan-400 font-black text-sm">{progress.percent}%</span>
              </div>

              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-amber-400 to-orange-500 rounded-full transition-all duration-700"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 pt-1">
                <span>Peak Rank: <b className="text-white">{p.peakRank}</b></span>
                <button
                  onClick={() => triggerRankCelebration(p.currentRank)}
                  className="text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> View Rank HUD
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submission History Table */}
      <div className="bg-[#0b0f15] border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <span className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest block">
              VERIFICATION AUDIT
            </span>
            <h3 className="font-display text-xl font-bold text-white uppercase">
              Your SITREP Submissions
            </h3>
          </div>
          <button
            onClick={() => setActiveView('submit')}
            className="px-3.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono text-xs font-bold uppercase rounded transition-colors cursor-pointer"
          >
            + New SITREP
          </button>
        </div>

        {playerSubmissions.length === 0 ? (
          <div className="py-10 text-center font-mono text-xs text-slate-500">
            No submissions logged yet. Submit your match evidence to begin earning XP!
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 font-mono text-xs">
            {playerSubmissions.map((sub) => (
              <div key={sub.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white uppercase">{sub.id}</span>
                      <span className="text-slate-500 text-[10px]">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-slate-400 text-[11px] block mt-0.5">
                      Kills: <b className="text-white">{sub.stats.kills}</b> · Wins: <b className="text-white">{sub.stats.wins}</b> · K/D: <b className="text-cyan-400">{sub.stats.kd}</b>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      sub.status === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : sub.status === 'flagged'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        : sub.status === 'rejected'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {sub.status}
                  </span>

                  <span className="font-bold text-white text-right min-w-[70px]">
                    +{sub.scoreBreakdown.total} XP
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
