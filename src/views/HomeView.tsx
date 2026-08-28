import React from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Trophy, 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  Flame, 
  Target, 
  Award, 
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RankHexBadge } from '../components/RankHexBadge';
import { getRankProgress } from '../data/rankConfigs';

export const HomeView: React.FC = () => {
  const { 
    players, 
    currentPlayer, 
    setActiveView, 
    viewPlayerProfile, 
    triggerRankCelebration 
  } = useApp();

  const topPlayers = [...players].sort((a, b) => b.totalXp - a.totalXp).slice(0, 3);
  const featured = currentPlayer || topPlayers[0] || null;
  const featuredProgress = featured ? getRankProgress(featured.totalXp) : null;

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Mission Statement & CTAs */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              COMPETE · PROGRESS · BELONG
            </div>

            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase leading-[0.95]">
              YOUR OFFICIAL <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-cyan-400">
                XN IDENTITY.
              </span>
            </h1>

            <p className="font-body text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
              Create your permanent XN-ID, submit verified match performance SITREPs, and build an immutable competitive record of your tournament legacy.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => setActiveView('submit')}
                className="px-6 py-3.5 bg-[#f4a261] hover:bg-[#ffb378] text-[#2b1400] font-display font-black text-sm uppercase tracking-wider chamfer-btn transition-all duration-150 shadow-[0_0_20px_rgba(244,162,97,0.35)] flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                Submit SITREP →
              </button>

              <button
                onClick={() => setActiveView('leaderboard')}
                className="px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40 font-mono text-sm font-bold uppercase tracking-wider chamfer-btn transition-all flex items-center gap-2 cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                View Leaderboard
              </button>
            </div>

            {/* Quick Live Stats Pill */}
            <div className="flex items-center gap-6 pt-4 text-xs font-mono text-slate-400 border-t border-slate-800/80">
              <div>
                <span className="block text-slate-500 text-[10px]">NETWORK SIZE</span>
                <span className="font-bold text-slate-200">{players.length} Operatives</span>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div>
                <span className="block text-slate-500 text-[10px]">CURRENT SEASON</span>
                <span className="font-bold text-cyan-400">APEX VANGUARD</span>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div>
                <span className="block text-slate-500 text-[10px]">VERIFICATION STATUS</span>
                <span className="font-bold text-emerald-400">ONLINE · ACTIVE</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Tactical Player Identity Card (Matching the HUD design) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5"
          >
            {featured ? (
              <div className="relative rounded-2xl bg-gradient-to-b from-[#111822] to-[#0a0f16] border border-cyan-500/30 p-6 sm:p-8 shadow-[0_0_35px_rgba(56,189,248,0.15)] overflow-hidden">
                {/* Scanline line overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.4)_51%)] bg-[length:100%_4px] pointer-events-none opacity-40" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl" />

                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> PLAYER IDENTITY SYSTEM
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      VERIFIED
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block font-mono text-xs text-slate-400">PERMANENT XN-ID</span>
                      <h2 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-white">
                        {featured.xnId}
                      </h2>
                      <p className="font-mono text-sm text-cyan-400 mt-1">
                        {featured.displayName} · <span className="text-slate-400">IGN: {featured.ign}</span>
                      </p>
                    </div>

                    <div className="cursor-pointer" onClick={() => triggerRankCelebration(featured.currentRank)}>
                      <RankHexBadge rank={featured.currentRank} size="lg" />
                    </div>
                  </div>

                  {/* Tactical Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-center">
                      <span className="block font-mono text-[10px] text-slate-400 uppercase">RANK</span>
                      <span className="font-mono text-lg font-black text-amber-400">{featured.currentRank}</span>
                    </div>
                    <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-center">
                      <span className="block font-mono text-[10px] text-slate-400 uppercase">TOTAL XP</span>
                      <span className="font-mono text-lg font-black text-cyan-400">{featured.totalXp}</span>
                    </div>
                    <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-center">
                      <span className="block font-mono text-[10px] text-slate-400 uppercase">K/D</span>
                      <span className="font-mono text-lg font-black text-white">{featured.lifetimeStats.kd.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Progress bar to next clearance */}
                  {featuredProgress && (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">
                          Progress to {featuredProgress.nextTier || 'MAX RANK'}
                        </span>
                        <span className="text-cyan-400 font-bold">{featuredProgress.percent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${featuredProgress.percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => viewPlayerProfile(featured.xnId)}
                      className="flex-1 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Public Record →
                    </button>
                    <button
                      onClick={() => triggerRankCelebration(featured.currentRank)}
                      className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-xs font-bold rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      title="Launch Rank HUD"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl bg-gradient-to-b from-[#111822] to-[#0a0f16] border border-cyan-500/30 p-6 sm:p-8 shadow-[0_0_35px_rgba(56,189,248,0.15)] overflow-hidden text-center space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-black/60 border border-cyan-500/30 p-2 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                  <img 
                    src="/logo.jpg" 
                    alt="XN Academy Crest" 
                    className="w-full h-full object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em] block mb-1">
                    OPERATIVE REGISTRATION OPEN
                  </span>
                  <h3 className="font-display text-2xl font-black text-white uppercase">
                    Claim Your XN-ID
                  </h3>
                  <p className="font-body text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Register your competitive in-game alias, receive your immutable permanent ID, and begin logging verified SITREPs.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveView('dashboard')}
                    className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-slate-950 font-display font-black text-xs uppercase tracking-wider chamfer-btn transition-all shadow-[0_0_20px_rgba(244,162,97,0.35)] cursor-pointer"
                  >
                    Register New Operative Profile →
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Featured Top Players Section */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-slate-800/80 pb-4">
          <div>
            <span className="font-mono text-xs text-orange-400 font-bold tracking-widest uppercase block">
              OFFICIAL LEADERBOARD
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Top Ranked Operatives
            </h2>
          </div>
          <button
            onClick={() => setActiveView('leaderboard')}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
          >
            Full Leaderboard <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {topPlayers.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#0c1016]/90 border border-slate-800 text-center space-y-3">
            <p className="font-mono text-xs text-slate-400">
              No operatives registered yet in the active season roster.
            </p>
            <button
              onClick={() => setActiveView('dashboard')}
              className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold uppercase rounded transition-colors cursor-pointer"
            >
              Be the First to Claim an XN-ID →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {topPlayers.map((p, idx) => {
              const progress = getRankProgress(p.totalXp);
              return (
                <motion.div
                  key={p.xnId}
                  whileHover={{ y: -4 }}
                  onClick={() => viewPlayerProfile(p.xnId)}
                  className="bg-[#0c1016]/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-5 cursor-pointer transition-all shadow-lg group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-400">
                          {p.xnId}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          #{idx + 1}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-lg text-white group-hover:text-cyan-400 transition-colors mt-1">
                        {p.displayName}
                      </h3>
                      <p className="font-mono text-xs text-slate-400">
                        IGN: {p.ign} · <span className="text-slate-300">{p.role}</span>
                      </p>
                    </div>

                    <RankHexBadge rank={p.currentRank} size="md" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-center">
                    <div>
                      <span className="block font-mono text-[9px] text-slate-500 uppercase">K/D</span>
                      <span className="font-mono text-xs font-bold text-slate-200">{p.lifetimeStats.kd.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="block font-mono text-[9px] text-slate-500 uppercase">WIN RATE</span>
                      <span className="font-mono text-xs font-bold text-emerald-400">{p.lifetimeStats.winRate.toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="block font-mono text-[9px] text-slate-500 uppercase">XP</span>
                      <span className="font-mono text-xs font-bold text-cyan-400">{p.totalXp}</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1">
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                    <p className="font-mono text-[10px] text-slate-500 text-right">
                      {progress.nextTier ? `${progress.remainingXp} XP to ${progress.nextTier}` : 'Peak Rank Reached'}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3-Step Tactical Protocol */}
      <section className="bg-gradient-to-b from-[#0e131b] to-[#080b0f] border border-slate-800/90 rounded-2xl p-6 sm:p-10 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold text-cyan-400 tracking-widest uppercase">
            HOW IT WORKS
          </span>
          <h2 className="font-display text-3xl font-black text-white uppercase tracking-tight">
            Tactical Clearance Protocol
          </h2>
          <p className="font-body text-sm text-slate-400">
            A three-step verified progression pipeline designed for high-level competitive integrity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3 relative">
            <span className="font-mono text-3xl font-black text-orange-500/40 block">
              01
            </span>
            <h3 className="font-display text-lg font-bold text-white uppercase">
              Claim Your Identity
            </h3>
            <p className="font-body text-xs text-slate-400 leading-relaxed">
              Every recruit is assigned a permanent, verifiable XN-ID that tracks their career accomplishments forever.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3 relative">
            <span className="font-mono text-3xl font-black text-cyan-500/40 block">
              02
            </span>
            <h3 className="font-display text-lg font-bold text-white uppercase">
              Submit SITREP & Evidence
            </h3>
            <p className="font-body text-xs text-slate-400 leading-relaxed">
              Upload match screenshots. Our automated OCR scanner extracts your kills, wins, and assists into the review desk.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3 relative">
            <span className="font-mono text-3xl font-black text-amber-500/40 block">
              03
            </span>
            <h3 className="font-display text-lg font-bold text-white uppercase">
              Unlock Tier Clearances
            </h3>
            <p className="font-body text-xs text-slate-400 leading-relaxed">
              Ascend from E-Rank Cadet to S-MAX Supreme Vanguard, unlocking elite multipliers and hall of fame honors.
            </p>
          </div>
        </div>
      </section>

      {/* Hall of Fame Banner */}
      <section className="relative rounded-2xl bg-gradient-to-r from-[#18111e] via-[#0e1620] to-[#1a1111] border border-slate-800 p-8 sm:p-12 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-mono font-bold uppercase">
              <img 
                src="/logo.jpg" 
                alt="XN Academy Crest" 
                className="w-4 h-4 object-contain rounded"
                referrerPolicy="no-referrer"
              />
              XN ACADEMY HALL OF FAME
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
              HONOR. LEGACY. GREATNESS.
            </h2>
            <p className="font-body text-sm text-slate-300 max-w-xl leading-relaxed">
              Only verified S-Rank and S-MAX operatives with demonstrated competitive mastery earn permanent seats in the Vanguard Vault.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setActiveView('leaderboard')}
                className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 hover:brightness-110 text-white font-mono text-xs font-bold uppercase tracking-wider chamfer-btn-sm transition-all cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                Inspect Vanguard Legends →
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 flex justify-center">
            <div className="relative flex items-center justify-center p-3 rounded-2xl bg-black/60 border border-cyan-500/30 shadow-[0_0_30px_rgba(56,189,248,0.25)]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-red-500/20 to-amber-500/20 blur-xl animate-pulse" />
              <img 
                src="/logo.jpg" 
                alt="XN Academy Hall of Fame Official Logo" 
                className="relative z-10 w-44 h-44 sm:w-52 sm:h-52 object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
