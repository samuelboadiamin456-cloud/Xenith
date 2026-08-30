import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Search, 
  Filter, 
  ChevronRight, 
  Sparkles, 
  ArrowUpDown,
  Shield,
  Zap,
  Target
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RankTier } from '../types';
import { RankHexBadge } from '../components/RankHexBadge';
import { RANK_CONFIGS } from '../data/rankConfigs';

export const LeaderboardView: React.FC = () => {
  const { players, viewPlayerProfile, triggerRankCelebration } = useApp();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [rankFilter, setRankFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'xp' | 'kd' | 'wins' | 'winRate'>('xp');

  const roles = ['ALL', 'Rusher', 'Sniper', 'IGL', 'Support', 'Fragger', 'Flex'];
  const rankTiers: ('ALL' | RankTier)[] = ['ALL', 'S-MAX', 'S', 'A', 'B', 'C', 'D', 'E'];

  const filteredAndSortedPlayers = useMemo(() => {
    return players
      .filter(p => {
        const matchesQuery = 
          (p.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.ign || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.xnId || '').toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesRole = roleFilter === 'ALL' || p.role === roleFilter;
        const matchesRank = rankFilter === 'ALL' || p.currentRank === rankFilter;

        return matchesQuery && matchesRole && matchesRank;
      })
      .sort((a, b) => {
        if (sortBy === 'xp') return (b.totalXp ?? 0) - (a.totalXp ?? 0);
        if (sortBy === 'kd') return (Number(b.lifetimeStats?.kd) || 0) - (Number(a.lifetimeStats?.kd) || 0);
        if (sortBy === 'wins') return (Number(b.lifetimeStats?.wins) || 0) - (Number(a.lifetimeStats?.wins) || 0);
        if (sortBy === 'winRate') return (Number(b.lifetimeStats?.winRate) || 0) - (Number(a.lifetimeStats?.winRate) || 0);
        return 0;
      });
  }, [players, searchQuery, roleFilter, rankFilter, sortBy]);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="font-mono text-xs font-bold text-cyan-400 tracking-[0.2em] uppercase block mb-1">
              OFFICIAL RANKINGS
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
              THE <span className="text-orange-400">LEADERBOARD.</span>
            </h1>
            <p className="font-body text-sm text-slate-400 mt-2 max-w-xl">
              Verified competitive standing across all seasonal matches and authenticated SITREP submissions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-400">
              Active Operatives: <b className="text-white">{players.length}</b>
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-[#0b0f15] border border-slate-800/80 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search IGN, display name, or XN-ID (e.g. XN-027)"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 focus:border-cyan-500 rounded-lg font-mono text-xs text-white placeholder:text-slate-500 outline-none transition-colors"
            />
          </div>

          {/* Role Filter */}
          <div className="md:col-span-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-800 focus:border-cyan-500 rounded-lg font-mono text-xs text-white outline-none cursor-pointer"
            >
              {roles.map(r => (
                <option key={r} value={r}>
                  {r === 'ALL' ? 'All Roles' : `Role: ${r}`}
                </option>
              ))}
            </select>
          </div>

          {/* Rank Filter */}
          <div className="md:col-span-3">
            <select
              value={rankFilter}
              onChange={(e) => setRankFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-800 focus:border-cyan-500 rounded-lg font-mono text-xs text-white outline-none cursor-pointer"
            >
              {rankTiers.map(tier => (
                <option key={tier} value={tier}>
                  {tier === 'ALL' ? 'All Ranks' : `Rank: ${tier}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/60 text-xs font-mono">
          <span className="text-slate-500 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" /> Sort by:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: 'xp', label: 'Total XP' },
              { key: 'kd', label: 'K/D Ratio' },
              { key: 'wins', label: 'Wins' },
              { key: 'winRate', label: 'Win Rate %' }
            ].map(s => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key as any)}
                className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
                  sortBy === s.key
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(56,189,248,0.4)]'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-[#0b0f15] border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-14 text-center">POS</th>
                <th className="py-3.5 px-4">OPERATIVE</th>
                <th className="py-3.5 px-4">ROLE</th>
                <th className="py-3.5 px-4 text-center">RANK</th>
                <th className="py-3.5 px-4 text-right">TOTAL XP</th>
                <th className="py-3.5 px-4 text-center">K/D</th>
                <th className="py-3.5 px-4 text-center">WINS</th>
                <th className="py-3.5 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
              {filteredAndSortedPlayers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-mono">
                    No operatives match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredAndSortedPlayers.map((player, idx) => {
                  const isTop3 = idx < 3;
                  return (
                    <tr
                      key={player.xnId}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => viewPlayerProfile(player.xnId)}
                    >
                      {/* Placement */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded font-display font-black text-sm ${
                            idx === 0
                              ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-950'
                              : idx === 2
                              ? 'bg-amber-700 text-white'
                              : 'text-slate-400'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                      </td>

                      {/* Operative Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-700 flex items-center justify-center font-display font-black text-white text-xs shrink-0 overflow-hidden">
                            {player.avatarUrl ? (
                              <img 
                                src={player.avatarUrl} 
                                alt={player.displayName} 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              (player.displayName || 'P').charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                                {player.displayName}
                              </span>
                              {player.verificationStatus === 'Official Vanguard' && (
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                                  VANGUARD
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-cyan-400 block font-semibold">
                              {player.xnId} · <span className="text-slate-400">IGN: {player.ign}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4 text-slate-300">
                        <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-semibold text-slate-300">
                          {player.role}
                        </span>
                      </td>

                      {/* Rank Hex Badge */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex justify-center">
                          <RankHexBadge rank={player.currentRank || 'E'} size="sm" showDottedRing={false} />
                        </div>
                      </td>

                      {/* Total XP */}
                      <td className="py-4 px-4 text-right">
                        <span className="font-bold text-white text-sm">
                          {(player.totalXp ?? 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 block">XP</span>
                      </td>

                      {/* K/D */}
                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-slate-200">
                          {(Number(player.lifetimeStats?.kd) || 0).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {player.lifetimeStats?.kills ?? 0} Kills
                        </span>
                      </td>

                      {/* Wins */}
                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-emerald-400">
                          {player.lifetimeStats?.wins ?? 0}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {(Number(player.lifetimeStats?.winRate) || 0).toFixed(0)}% WR
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => triggerRankCelebration(player.currentRank)}
                            className="p-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
                            title="Inspect Rank Clearance"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => viewPlayerProfile(player.xnId)}
                            className="px-2.5 py-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono text-[10px] font-bold uppercase transition-colors"
                          >
                            Record →
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
