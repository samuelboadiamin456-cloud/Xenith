import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Flag, 
  Lock, 
  Users, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  ExternalLink,
  Eye,
  Check,
  X,
  Crown,
  Key,
  UserCheck,
  UserX,
  FileText,
  Shield,
  RotateCcw,
  MinusCircle,
  Gift,
  Search,
  Award,
  Zap,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RANK_CONFIGS, calculateRank } from '../data/rankConfigs';
import { Player, RankTier } from '../types';

export const AdminPortalView: React.FC = () => {
  const { 
    isAdmin, 
    currentAdmin,
    currentPlayer,
    players,
    adminRequests,
    adminStatus,
    approveAdminRequest,
    rejectAdminRequest,
    openAuthModal,
    logout, 
    submissions, 
    approveSubmission, 
    flagSubmission, 
    rejectSubmission, 
    adminStats, 
    auditLogs,
    resetAllRanks,
    resetPlayerRank,
    deductXp,
    rewardPlayer,
    viewPlayerProfile,
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'operatives' | 'submissions' | 'admin-approvals' | 'audit'>('operatives');
  const [rejectingSubId, setRejectingSubId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Screenshot resolution invalid or stats mismatched');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [inspectImage, setInspectImage] = useState<string | null>(null);

  // Operatives directory state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rankFilter, setRankFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Head of Command Modal States
  const [showResetAllModal, setShowResetAllModal] = useState<boolean>(false);
  const [resetAllConfirmText, setResetAllConfirmText] = useState<string>('');
  const [resetAllReason, setResetAllReason] = useState<string>('Seasonal rank calibration');

  const [targetPlayerForReset, setTargetPlayerForReset] = useState<Player | null>(null);
  const [resetPlayerReason, setResetPlayerReason] = useState<string>('Administrative reset');

  const [targetPlayerForDeduct, setTargetPlayerForDeduct] = useState<Player | null>(null);
  const [deductAmount, setDeductAmount] = useState<number>(100);
  const [deductReason, setDeductReason] = useState<string>('Conduct penalty / telemetry anomaly');

  const [targetPlayerForReward, setTargetPlayerForReward] = useState<Player | null>(null);
  const [rewardAmount, setRewardAmount] = useState<number>(50);
  const [rewardReason, setRewardReason] = useState<string>('Tactical excellence commendation');

  // Determine current user's authority and rank clearance
  const isHoC = currentAdmin?.isHeadOfCommand === true;
  
  // Find linked player profile or active player to determine admin's rank for reward eligibility
  const adminPlayerProfile = players.find(p => 
    (currentAdmin?.linkedXnId && p.xnId.toLowerCase() === currentAdmin.linkedXnId.toLowerCase()) ||
    (currentAdmin?.username && p.username.toLowerCase() === currentAdmin.username.toLowerCase()) ||
    (currentAdmin?.email && p.email.toLowerCase() === currentAdmin.email.toLowerCase())
  );

  const adminXp = adminPlayerProfile ? (adminPlayerProfile.totalXp ?? 0) : (currentPlayer?.totalXp ?? 0);
  const adminRank = adminPlayerProfile ? adminPlayerProfile.currentRank : (currentPlayer?.currentRank || calculateRank(adminXp));
  
  // User Rule: Admin can give out 50xp to any player as a reward ONLY when he crosses A rank (5000+ XP / Rank A, S, S-MAX).
  // Head of command can reward at any time.
  const hasCrossedARank = adminXp >= 5000 || ['A', 'S', 'S-MAX'].includes(adminRank);
  const canRewardPlayers = isHoC || hasCrossedARank;

  // If not logged in as admin, show security authentication prompt
  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 space-y-6">
        <div className="bg-[#0b0f15] border border-amber-500/30 rounded-2xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 rounded-2xl bg-black/80 border border-amber-500/40 p-2 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(245,158,11,0.3)]">
            <Crown className="w-10 h-10 text-amber-400" />
          </div>

          <div className="space-y-2">
            <span className="font-mono text-xs font-bold text-amber-400 uppercase tracking-widest block">
              RESTRICTED COMMAND SECTOR
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-white uppercase">
              Headquarters Command Portal
            </h2>
            <p className="font-body text-xs text-slate-400 leading-relaxed">
              {!adminStatus?.hasInitialAdmin 
                ? 'The initial Head of Command account is OPEN for registration. Claim the supreme executive command seat to initialize the academy network.'
                : 'Staff clearance required. Authorized officers can audit match telemetry, approve submissions, and inspect the registered operatives directory.'}
            </p>
          </div>

          <div className="pt-2 space-y-3">
            {!adminStatus?.hasInitialAdmin ? (
              <button
                onClick={() => openAuthModal('admin-register')}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider chamfer-btn transition-colors shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer"
              >
                Register as Head of Command →
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => openAuthModal('admin-login')}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider chamfer-btn transition-colors shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer"
                >
                  Sign In with Staff / Command Clearance →
                </button>
                <button
                  onClick={() => openAuthModal('admin-register')}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs uppercase font-bold rounded transition-colors cursor-pointer"
                >
                  Request Staff Clearance
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const filteredSubmissions = submissions.filter(s => {
    if (filterStatus === 'ALL') return true;
    return s.status === filterStatus;
  });

  const pendingAdminRequests = adminRequests.filter(r => r.status === 'pending');

  const filteredOperatives = players.filter(p => {
    const matchesSearch = 
      (p.displayName && p.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.ign && p.ign.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.xnId && p.xnId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.username && p.username.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRank = rankFilter === 'ALL' || p.currentRank === rankFilter;
    const matchesRole = roleFilter === 'ALL' || p.role === roleFilter;

    return matchesSearch && matchesRank && matchesRole;
  });

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingSubId) return;
    rejectSubmission(rejectingSubId, rejectReason);
    setRejectingSubId(null);
  };

  const handleExecuteResetAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetAllConfirmText.trim().toUpperCase() !== 'RESET') {
      showToast('Please type RESET to confirm network-wide rank reset.', 'error');
      return;
    }
    await resetAllRanks(resetAllReason);
    setShowResetAllModal(false);
    setResetAllConfirmText('');
  };

  const handleExecuteResetPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPlayerForReset) return;
    await resetPlayerRank(targetPlayerForReset.xnId, resetPlayerReason);
    setTargetPlayerForReset(null);
  };

  const handleExecuteDeductXp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPlayerForDeduct) return;
    await deductXp(targetPlayerForDeduct.xnId, deductAmount, deductReason);
    setTargetPlayerForDeduct(null);
  };

  const handleExecuteRewardPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPlayerForReward) return;
    await rewardPlayer(targetPlayerForReward.xnId, rewardAmount, rewardReason);
    setTargetPlayerForReward(null);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Clearance Status Banner */}
      <div className="border-b border-slate-800/80 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-amber-400 tracking-[0.2em] uppercase block">
              HEADQUARTERS COMMAND & OPERATIVE MANAGEMENT
            </span>
            {isHoC ? (
              <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[10px] font-mono font-black uppercase flex items-center gap-1 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                <Crown className="w-3.5 h-3.5 text-amber-400" /> Head of Command (Supreme Authority)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-cyan-400" /> Staff Officer
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            COMMAND <span className="text-amber-400">CONSOLE.</span>
          </h1>
          <p className="font-body text-xs text-slate-400 mt-1">
            Logged in as: <b className="text-white font-mono">{currentAdmin?.displayName || 'Administrator'}</b> (@{currentAdmin?.username || 'admin'})
            {' · '}
            Role Hierarchy: <span className="text-amber-300 font-semibold">{isHoC ? 'Above Admin (Supreme Executive)' : 'Staff Officer (Audit & Review)'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin Reward Clearance Indicator */}
          <div className={`px-3 py-1.5 rounded-lg border font-mono text-xs flex items-center gap-2 ${
            canRewardPlayers 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
              : 'bg-slate-900 border-slate-700 text-slate-400'
          }`}>
            <Gift className={`w-3.5 h-3.5 ${canRewardPlayers ? 'text-emerald-400' : 'text-slate-500'}`} />
            <div>
              <span className="font-bold text-[11px] block">
                {isHoC ? 'HoC Reward Power: ACTIVE' : canRewardPlayers ? 'Reward Power: UNLOCKED (+50 XP)' : 'Reward Power: LOCKED'}
              </span>
              <span className="text-[10px] text-slate-400">
                {isHoC ? 'Unconditional Reward Authority' : `Standing: ${adminRank} (${adminXp} XP) · Req: A-Rank (5,000+ XP)`}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-bold uppercase rounded transition-colors cursor-pointer shrink-0"
          >
            Exit Console
          </button>
        </div>
      </div>

      {/* Head of Command Supreme Actions Banner (HoC Exclusive) */}
      {isHoC && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-[#0f141c] to-amber-950/20 border border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400 animate-pulse" />
              <h3 className="font-display text-lg font-black text-white uppercase tracking-wide">
                Head of Command Supreme Controls
              </h3>
            </div>
            <p className="font-body text-xs text-slate-300">
              You are recognized as the <b>Head of Command</b>, standing above all administrative staff. You have full executive authority to reset individual ranks, deduct XP penalties, or trigger a full network rank reset.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowResetAllModal(true)}
              className="px-4 py-2.5 bg-red-900/60 hover:bg-red-700 border border-red-500/60 text-white font-mono text-xs font-black uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-red-300" />
              Reset All Operative Ranks
            </button>
          </div>
        </div>
      )}

      {/* Admin Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-[#0b0f15] border border-slate-800">
          <span className="font-mono text-[10px] text-slate-400 uppercase block">TOTAL REGISTERED</span>
          <span className="font-display text-2xl font-black text-white">{players.length}</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0b0f15] border border-slate-800">
          <span className="font-mono text-[10px] text-slate-400 uppercase block">PENDING SITREPS</span>
          <span className="font-display text-2xl font-black text-amber-400">{adminStats.pendingSubmissions}</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0b0f15] border border-slate-800">
          <span className="font-mono text-[10px] text-slate-400 uppercase block">STAFF REQUESTS</span>
          <span className="font-display text-2xl font-black text-cyan-400">{pendingAdminRequests.length}</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0b0f15] border border-slate-800">
          <span className="font-mono text-[10px] text-slate-400 uppercase block">APPROVED SITREPS</span>
          <span className="font-display text-2xl font-black text-emerald-400">{adminStats.approvedSubmissions}</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0b0f15] border border-slate-800 col-span-2 sm:col-span-1">
          <span className="font-mono text-[10px] text-slate-400 uppercase block">XP AWARDED</span>
          <span className="font-display text-2xl font-black text-cyan-400">+{adminStats.totalXpAwarded}</span>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab('operatives')}
          className={`pb-3 px-4 font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'operatives'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Operatives Directory ({players.length})
        </button>

        <button
          onClick={() => setActiveTab('submissions')}
          className={`pb-3 px-4 font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'submissions'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Telemetry SITREPs ({submissions.length})
        </button>

        <button
          onClick={() => setActiveTab('admin-approvals')}
          className={`pb-3 px-4 font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'admin-approvals'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-4 h-4" />
          Staff Clearances
          {pendingAdminRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black">
              {pendingAdminRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-4 font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'audit'
              ? 'border-slate-300 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Audit Trail
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OPERATIVES DIRECTORY (ALL REGISTERED PLAYERS + HOC / ADMIN ACTIONS) */}
      {/* ========================================================================= */}
      {activeTab === 'operatives' && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="p-4 rounded-xl bg-[#0b0f15] border border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search operatives by IGN, display name, XN-ID..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Rank Filter */}
              <select
                value={rankFilter}
                onChange={(e) => setRankFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="ALL">All Ranks</option>
                <option value="S-MAX">S-MAX (16,000+ XP)</option>
                <option value="S">S Rank (10,000+ XP)</option>
                <option value="A">A Rank (5,000+ XP)</option>
                <option value="B">B Rank (3,100+ XP)</option>
                <option value="C">C Rank (2,000+ XP)</option>
                <option value="D">D Rank (1,000+ XP)</option>
                <option value="E">E Rank (0 - 999 XP)</option>
              </select>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="Fragger">Fragger</option>
                <option value="Rusher">Rusher</option>
                <option value="Sniper">Sniper</option>
                <option value="IGL">IGL</option>
                <option value="Support">Support</option>
                <option value="Flex">Flex</option>
              </select>
            </div>
          </div>

          {/* Operatives Table / Grid */}
          {filteredOperatives.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-[#0b0f15] border border-slate-800 font-mono text-xs text-slate-500">
              No registered operatives found matching current filter query.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOperatives.map(player => {
                const config = RANK_CONFIGS[player.currentRank] || RANK_CONFIGS['E'];
                const stats = player.lifetimeStats || { kills: 0, wins: 0, matches: 0, kd: 0, winRate: 0, hs: 0 };
                const totalMatches = stats.matches || 0;
                const winRate = Number(stats.winRate) || 0;
                const lossRate = Math.max(0, Math.min(100, parseFloat((100 - winRate).toFixed(1))));

                return (
                  <div
                    key={player.id || player.xnId}
                    className="p-4 sm:p-5 rounded-xl bg-[#0b0f15] border border-slate-800 hover:border-slate-700 transition-all space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Player Profile & Identity */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          {player.avatarUrl ? (
                            <img 
                              src={player.avatarUrl} 
                              alt={player.displayName}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-700" 
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-display text-base font-bold text-slate-400">
                              {player.displayName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span 
                            className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded font-mono text-[9px] font-black border uppercase"
                            style={{ 
                              backgroundColor: `${config.themeColor}25`,
                              borderColor: config.themeColor,
                              color: config.themeColor 
                            }}
                          >
                            {player.currentRank}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-cyan-400">{player.xnId}</span>
                            <span className="text-slate-600">·</span>
                            <span className="font-mono text-[10px] text-slate-400 uppercase bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                              {player.role}
                            </span>
                            {player.country && (
                              <span className="text-[11px] text-slate-400">({player.country})</span>
                            )}
                          </div>
                          <h3 className="font-display text-base sm:text-lg font-bold text-white uppercase truncate">
                            {player.displayName} <span className="text-slate-400 text-xs font-mono font-normal">[{player.ign}]</span>
                          </h3>
                        </div>
                      </div>

                      {/* Rank & Stats Telemetry Bar */}
                      <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-slate-500 uppercase block">RANK STANDING</span>
                          <span 
                            className="font-display font-black text-sm uppercase"
                            style={{ color: config.themeColor }}
                          >
                            {config.title}
                          </span>
                          <span className="text-[11px] text-cyan-300 font-bold block">{player.totalXp ?? 0} XP</span>
                        </div>

                        <div className="h-8 w-px bg-slate-800 hidden sm:block" />

                        {/* Cumulative Win Rate Breakdown (Sum = 100%) */}
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px] space-y-1">
                          <div className="flex items-center justify-between gap-3 text-slate-400">
                            <span>Matches: <b className="text-white">{totalMatches}</b></span>
                            <span>K/D: <b className="text-cyan-400">{stats.kd ?? 0}</b></span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-emerald-400 font-bold">{winRate.toFixed(1)}% Win</span>
                            <span className="text-slate-600">/</span>
                            <span className="text-red-400 font-bold">{lossRate.toFixed(1)}% Loss</span>
                            <span className="text-slate-500">(100%)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewPlayerProfile(player.xnId)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs rounded transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Profile
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* 1. Reward +50 XP (Admin crossing A rank or HoC) */}
                        <button
                          onClick={() => {
                            if (canRewardPlayers) {
                              setTargetPlayerForReward(player);
                              setRewardAmount(50);
                            } else {
                              showToast(`Reward power locked: You must cross A-Rank (5,000+ XP) to distribute rewards. Current standing: ${adminRank} (${adminXp} XP)`, 'error');
                            }
                          }}
                          disabled={!canRewardPlayers}
                          className={`px-3 py-1.5 rounded font-mono text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                            canRewardPlayers
                              ? 'bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                              : 'bg-slate-900 border border-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
                          }`}
                          title={!canRewardPlayers ? 'Requires A-Rank clearance' : 'Grant +50 XP Reward'}
                        >
                          <Gift className="w-3.5 h-3.5 text-emerald-400" />
                          Reward +50 XP
                        </button>

                        {/* 2. Deduct XP (HoC Exclusive) */}
                        {isHoC && (
                          <button
                            onClick={() => {
                              setTargetPlayerForDeduct(player);
                              setDeductAmount(100);
                            }}
                            className="px-3 py-1.5 bg-amber-950/50 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold uppercase rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <MinusCircle className="w-3.5 h-3.5 text-amber-400" />
                            Deduct XP
                          </button>
                        )}

                        {/* 3. Reset Rank (HoC Exclusive) */}
                        {isHoC && (
                          <button
                            onClick={() => setTargetPlayerForReset(player)}
                            className="px-3 py-1.5 bg-red-950/50 hover:bg-red-900/80 border border-red-500/40 text-red-300 font-mono text-xs font-bold uppercase rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                            Reset Rank
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SUBMISSIONS REVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="font-mono text-xs font-bold text-slate-400 uppercase">
              Filter By Status:
            </span>
            <div className="flex flex-wrap gap-2">
              {['ALL', 'pending', 'flagged', 'approved', 'rejected'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded font-mono text-xs uppercase font-bold cursor-pointer transition-colors ${
                    filterStatus === status
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-[#0b0f15] border border-slate-800 font-mono text-xs text-slate-500">
              No performance reports found under this filter.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map(sub => (
                <div 
                  key={sub.id}
                  className={`p-5 rounded-xl border transition-all ${
                    sub.status === 'flagged' 
                      ? 'bg-purple-950/20 border-purple-500/40' 
                      : sub.status === 'approved'
                      ? 'bg-emerald-950/10 border-emerald-500/30'
                      : sub.status === 'rejected'
                      ? 'bg-red-950/10 border-red-500/30'
                      : 'bg-[#0b0f15] border-slate-800'
                  }`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* Operative Header & Evidence Thumbnail */}
                    <div className="lg:col-span-3 flex items-center gap-3">
                      <div 
                        onClick={() => sub.evidenceUrl && setInspectImage(sub.evidenceUrl)}
                        className="w-16 h-16 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden cursor-pointer shrink-0 relative group"
                      >
                        {sub.evidenceUrl ? (
                          <>
                            <img src={sub.evidenceUrl} alt="Evidence" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-mono text-[9px] text-slate-500">
                            NO IMG
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <span className="font-mono text-[10px] text-cyan-400 font-bold block">{sub.xnId}</span>
                        <h3 className="font-display text-base font-bold text-white uppercase truncate">{sub.playerName}</h3>
                        <span className="font-mono text-[11px] text-slate-400 block">IGN: {sub.playerIgn}</span>
                      </div>
                    </div>

                    {/* Stats Telemetry */}
                    <div className="lg:col-span-5 space-y-1.5 font-mono text-xs">
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                          Kills: <b className="text-white">{sub.stats.kills}</b>
                        </span>
                        <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                          Wins: <b className="text-emerald-400">{sub.stats.wins}</b>
                        </span>
                        <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                          K/D: <b className="text-cyan-400">{sub.stats.kd}</b>
                        </span>
                        <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                          HS: <b className="text-red-400">{sub.stats.hs}%</b>
                        </span>
                      </div>

                      {/* Fraud Flags Alert */}
                      {sub.fraudFlags && sub.fraudFlags.length > 0 && (
                        <div className="p-2 rounded bg-purple-950/60 border border-purple-500/40 text-[11px] font-mono text-purple-300 flex items-start gap-1.5 mt-2">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-purple-400 mt-0.5" />
                          <div>
                            <span className="font-bold">Fraud Anomaly:</span> {sub.fraudFlags.join(', ')}
                          </div>
                        </div>
                      )}

                      {sub.rejectionReason && (
                        <p className="text-[11px] font-mono text-red-400">
                          Rejection Reason: {sub.rejectionReason}
                        </p>
                      )}
                    </div>

                    {/* Score Breakdown & Action Buttons */}
                    <div className="lg:col-span-4 flex flex-col items-end justify-between gap-4">
                      <div className="text-right">
                        <span className="font-mono text-[10px] text-slate-400 uppercase block">
                          AWARD VALUE
                        </span>
                        <span className="font-mono text-xl font-black text-cyan-400">
                          +{sub.scoreBreakdown.total} XP
                        </span>
                      </div>

                      {/* Review Actions */}
                      {sub.status !== 'approved' && sub.status !== 'rejected' && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => approveSubmission(sub.id)}
                            className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>

                          <button
                            onClick={() => flagSubmission(sub.id)}
                            className="flex-1 sm:flex-none px-3 py-2 bg-purple-900/60 hover:bg-purple-800 text-purple-300 border border-purple-600/40 font-mono text-xs font-bold uppercase rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Flag className="w-3.5 h-3.5" /> Flag
                          </button>

                          <button
                            onClick={() => setRejectingSubId(sub.id)}
                            className="flex-1 sm:flex-none px-3 py-2 bg-red-900/40 hover:bg-red-800 text-red-300 border border-red-700/40 font-mono text-xs font-bold uppercase rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STAFF CLEARANCE APPROVALS WORKFLOW */}
      {/* ========================================================================= */}
      {activeTab === 'admin-approvals' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 space-y-1">
            <h3 className="font-display text-lg font-bold text-white uppercase flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              Staff Clearance Management
            </h3>
            <p className="font-body text-xs text-slate-400">
              All applicant requests to join as a Staff Officer require authorization. Approved applicants can immediately review match telemetry and audit operative performances.
            </p>
          </div>

          <div className="space-y-4">
            <span className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider block">
              Pending Clearance Applications ({pendingAdminRequests.length})
            </span>

            {pendingAdminRequests.length === 0 ? (
              <div className="p-10 text-center rounded-xl bg-[#0b0f15] border border-slate-800 font-mono text-xs text-slate-500">
                No pending staff clearance requests at this time.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAdminRequests.map(req => (
                  <div 
                    key={req.id}
                    className="p-5 rounded-xl bg-[#0b0f15] border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold uppercase">
                          APPLICANT
                        </span>
                        <h4 className="font-display text-lg font-bold text-white uppercase">
                          {req.displayName} (@{req.username})
                        </h4>
                      </div>
                      <p className="font-mono text-xs text-slate-400">Email: {req.email}</p>
                      <p className="font-body text-xs text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800 mt-2">
                        <strong>Reason:</strong> {req.reason}
                      </p>
                      <span className="font-mono text-[10px] text-slate-500 block pt-1">
                        Requested on {new Date(req.requestedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => approveAdminRequest(req.id)}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      >
                        <UserCheck className="w-4 h-4" /> Approve Officer
                      </button>

                      <button
                        onClick={() => rejectAdminRequest(req.id)}
                        className="px-4 py-2.5 bg-red-900/40 hover:bg-red-800 text-red-300 border border-red-700/40 font-mono text-xs font-bold uppercase rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserX className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Past/Reviewed Admin Requests */}
            {adminRequests.some(r => r.status !== 'pending') && (
              <div className="pt-6 space-y-3">
                <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Past Clearance History
                </span>
                <div className="divide-y divide-slate-800/80 bg-[#0b0f15] border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
                  {adminRequests.filter(r => r.status !== 'pending').map(req => (
                    <div key={req.id} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-white font-bold">{req.displayName} (@{req.username})</span>
                        <p className="text-[11px] text-slate-500">{req.email}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          req.status === 'approved' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/40'
                        }`}>
                          {req.status}
                        </span>
                        {req.reviewedAt && (
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {new Date(req.reviewedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-[#0b0f15] border border-slate-800 rounded-xl p-6 space-y-4">
          <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest block">
            IMMUTABLE AUDIT TRAIL
          </span>
          <div className="divide-y divide-slate-800/60 font-mono text-xs space-y-1">
            {auditLogs.map(log => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-slate-400 gap-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                    log.actorType === 'hoc'
                      ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                      : log.actorType === 'admin'
                      ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    {log.action}
                  </span>
                  <span className="text-slate-200">{log.details}</span>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: RESET ALL RANKS (HoC ONLY) */}
      {/* ========================================================================= */}
      {showResetAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <form onSubmit={handleExecuteResetAll} className="w-full max-w-lg bg-[#0d1218] border border-red-500/60 rounded-2xl p-6 space-y-5 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-display text-xl font-black text-white uppercase">
                  Reset All Operative Ranks
                </h3>
                <span className="font-mono text-xs text-red-400 font-bold">SUPREME COMMAND OVERRIDE</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 font-body text-xs text-slate-300 leading-relaxed space-y-1">
              <p>
                This action will reset <b>ALL {players.length} registered operatives</b> across the entire XN Academy network back to <b>Rank E (0 XP)</b>.
              </p>
              <p className="text-slate-400 text-[11px]">
                Operative identity matrix, match logs, and verified registrations will be preserved.
              </p>
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs text-slate-300 block">
                Reset Calibration Reason:
              </label>
              <input
                type="text"
                value={resetAllReason}
                onChange={(e) => setResetAllReason(e.target.value)}
                placeholder="e.g. Apex Vanguard Season calibration reset"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-white outline-none focus:border-red-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs text-red-300 block font-bold">
                Type "RESET" to confirm:
              </label>
              <input
                type="text"
                value={resetAllConfirmText}
                onChange={(e) => setResetAllConfirmText(e.target.value)}
                placeholder="Type RESET"
                className="w-full p-2.5 bg-slate-950 border border-red-500/50 rounded-lg font-mono text-xs text-white outline-none uppercase font-bold tracking-widest text-center"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-black uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] cursor-pointer"
              >
                Execute Network-Wide Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetAllModal(false);
                  setResetAllConfirmText('');
                }}
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RESET INDIVIDUAL OPERATIVE RANK (HoC ONLY) */}
      {/* ========================================================================= */}
      {targetPlayerForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <form onSubmit={handleExecuteResetPlayer} className="w-full max-w-md bg-[#0d1218] border border-red-500/50 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-display text-lg font-black text-white uppercase flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-red-400" />
              Reset Operative Rank
            </h3>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs space-y-1">
              <div className="text-white font-bold">{targetPlayerForReset.displayName} ({targetPlayerForReset.xnId})</div>
              <div className="text-slate-400">Current Standing: {targetPlayerForReset.currentRank} Rank ({targetPlayerForReset.totalXp} XP)</div>
              <div className="text-red-400 text-[11px] pt-1">Will be reset to: Rank E (0 XP)</div>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs text-slate-300 block">Reason for Reset:</label>
              <input
                type="text"
                value={resetPlayerReason}
                onChange={(e) => setResetPlayerReason(e.target.value)}
                placeholder="Reason..."
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-white outline-none focus:border-red-500"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
              >
                Confirm Rank Reset
              </button>
              <button
                type="button"
                onClick={() => setTargetPlayerForReset(null)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DEDUCT XP (HoC ONLY) */}
      {/* ========================================================================= */}
      {targetPlayerForDeduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <form onSubmit={handleExecuteDeductXp} className="w-full max-w-md bg-[#0d1218] border border-amber-500/50 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-display text-lg font-black text-white uppercase flex items-center gap-2">
              <MinusCircle className="w-5 h-5 text-amber-400" />
              Deduct Operative XP
            </h3>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs space-y-1">
              <div className="text-white font-bold">{targetPlayerForDeduct.displayName} ({targetPlayerForDeduct.xnId})</div>
              <div className="text-slate-400">Current Balance: <b className="text-cyan-400">{targetPlayerForDeduct.totalXp} XP</b> ({targetPlayerForDeduct.currentRank} Rank)</div>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs text-slate-300 block">XP Amount to Deduct:</label>
              <div className="flex gap-2 mb-2">
                {[50, 100, 250, 500, 1000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDeductAmount(amt)}
                    className={`flex-1 py-1.5 rounded font-mono text-xs font-bold border transition-colors cursor-pointer ${
                      deductAmount === amt
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    -{amt}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={1}
                max={50000}
                value={deductAmount}
                onChange={(e) => setDeductAmount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-white outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs text-slate-300 block">Penalty Reason / Notice:</label>
              <input
                type="text"
                value={deductReason}
                onChange={(e) => setDeductReason(e.target.value)}
                placeholder="Reason..."
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-white outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
              >
                Confirm Deduction (-{deductAmount} XP)
              </button>
              <button
                type="button"
                onClick={() => setTargetPlayerForDeduct(null)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADMIN / HOC REWARD PLAYER (+50 XP) */}
      {/* ========================================================================= */}
      {targetPlayerForReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <form onSubmit={handleExecuteRewardPlayer} className="w-full max-w-md bg-[#0d1218] border border-emerald-500/50 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-display text-lg font-black text-white uppercase flex items-center gap-2">
              <Gift className="w-5 h-5 text-emerald-400" />
              Award Operative Commendation
            </h3>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs space-y-1">
              <div className="text-white font-bold">{targetPlayerForReward.displayName} ({targetPlayerForReward.xnId})</div>
              <div className="text-slate-400">Current Balance: <b className="text-cyan-400">{targetPlayerForReward.totalXp} XP</b> ({targetPlayerForReward.currentRank} Rank)</div>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs text-slate-300 block">Reward Amount:</label>
              <div className="flex gap-2">
                {[50, 100, 150].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRewardAmount(amt)}
                    className={`flex-1 py-1.5 rounded font-mono text-xs font-bold border transition-colors cursor-pointer ${
                      rewardAmount === amt
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    +{amt} XP
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs text-slate-300 block">Commendation Reason / Commendation Log:</label>
              <input
                type="text"
                value={rewardReason}
                onChange={(e) => setRewardReason(e.target.value)}
                placeholder="Reason..."
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-white outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
              >
                Grant +{rewardAmount} XP Reward
              </button>
              <button
                type="button"
                onClick={() => setTargetPlayerForReward(null)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rejection Modal Dialog */}
      {rejectingSubId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form onSubmit={handleConfirmReject} className="w-full max-w-md bg-[#0d1218] border border-red-500/40 rounded-xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-white uppercase flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              Reject SITREP {rejectingSubId}
            </h3>
            
            <p className="font-body text-xs text-slate-400">
              Provide a clear reason for rejecting this performance telemetry.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 focus:border-red-500 rounded font-mono text-xs text-white outline-none"
              required
            />

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase rounded transition-colors cursor-pointer"
              >
                Confirm Rejection
              </button>
              <button
                type="button"
                onClick={() => setRejectingSubId(null)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Image Inspection Lightbox */}
      {inspectImage && (
        <div 
          onClick={() => setInspectImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 cursor-zoom-out"
        >
          <div className="max-w-4xl max-h-[85vh] rounded-xl overflow-hidden border border-slate-700 shadow-2xl relative">
            <img src={inspectImage} alt="Inspected Evidence" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
