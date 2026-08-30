import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Sparkles, 
  Bell, 
  Calendar, 
  Shield, 
  Sliders, 
  Send, 
  Search, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Crown, 
  ArrowLeft,
  Smartphone,
  Trophy,
  Filter,
  RefreshCw,
  Zap,
  Info,
  Clock,
  Plus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Player, AcademyEvent, AppNotification, RankTier } from '../types';
import { RankHexBadge } from '../components/RankHexBadge';
import { RANK_CONFIGS } from '../data/rankConfigs';

export const AcademyOperationsView: React.FC = () => {
  const {
    players,
    events,
    notifications,
    currentAdmin,
    isAdmin,
    setActiveView,
    addPlayerToAcademy,
    removePlayerFromAcademy,
    calibratePlayerTelemetry,
    sendNotification,
    createEvent,
    deleteEvent,
    requestDeviceNotificationPermission,
    deviceNotificationPermission,
    showToast,
    refreshPlayers,
    refreshEvents,
    refreshNotifications
  } = useApp();

  const [activeTab, setActiveTab] = useState<'roster' | 'calibrate' | 'events' | 'broadcast'>('roster');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Add Operative Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    displayName: '',
    ign: '',
    role: 'Rusher' as Player['role'],
    email: '',
    username: '',
    country: '',
    bio: '',
    academyStatus: 'Cadet' as Player['academyStatus'],
    verificationStatus: 'Unverified' as Player['verificationStatus'],
    initialXp: 0,
    matches: 0,
    wins: 0,
    kills: 0,
    kd: 0.0
  });

  // Remove Operative Modal State
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [selectedPlayerForRemoval, setSelectedPlayerForRemoval] = useState<Player | null>(null);
  const [removalReason, setRemovalReason] = useState('');

  // Calibration Form State
  const [selectedPlayerForCalibration, setSelectedPlayerForCalibration] = useState<Player | null>(null);
  const [calibrationData, setCalibrationData] = useState({
    kills: 0,
    wins: 0,
    matches: 0,
    kd: 0,
    winRate: 0,
    reportTicket: '',
    reason: '',
    recalculateXp: true
  });

  // Event Creation State
  const [newEvent, setNewEvent] = useState({
    title: '',
    eventType: 'TOURNAMENT' as AcademyEvent['eventType'],
    description: '',
    rewardXp: 250,
    scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
    targetRank: 'ALL',
    targetRole: 'ALL',
    broadcastPush: true
  });

  // Broadcast Notification State
  const [broadcastData, setBroadcastData] = useState({
    recipientXnId: 'ALL',
    title: '',
    message: '',
    type: 'announcement' as AppNotification['type'],
    priority: 'normal' as AppNotification['priority'],
    linkView: 'leaderboard'
  });

  // Filter players
  const filteredPlayers = players.filter(p => {
    const matchesSearch = 
      p.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ign.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.xnId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.username && p.username.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Handle player selection for calibration
  const startCalibration = (player: Player) => {
    setSelectedPlayerForCalibration(player);
    setCalibrationData({
      kills: player.lifetimeStats.kills,
      wins: player.lifetimeStats.wins,
      matches: player.lifetimeStats.matches,
      kd: player.lifetimeStats.kd,
      winRate: player.lifetimeStats.winRate,
      reportTicket: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
      reason: 'Standard review of submitted match evidence & score reports.',
      recalculateXp: true
    });
    setActiveTab('calibrate');
  };

  const handleAddPlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayer.displayName || !newPlayer.ign) {
      showToast('Display Name and IGN are required', 'error');
      return;
    }

    try {
      const winRate = newPlayer.matches > 0 ? parseFloat(((newPlayer.wins / newPlayer.matches) * 100).toFixed(1)) : 0;
      await addPlayerToAcademy({
        displayName: newPlayer.displayName,
        ign: newPlayer.ign.toUpperCase(),
        role: newPlayer.role,
        email: newPlayer.email || undefined,
        username: newPlayer.username || undefined,
        country: newPlayer.country || undefined,
        bio: newPlayer.bio || undefined,
        academyStatus: newPlayer.academyStatus,
        verificationStatus: newPlayer.verificationStatus,
        initialXp: newPlayer.initialXp,
        lifetimeStats: {
          kills: newPlayer.kills,
          wins: newPlayer.wins,
          matches: newPlayer.matches,
          kd: newPlayer.kd,
          winRate,
          hs: 0
        }
      });
      setAddModalOpen(false);
      setNewPlayer({
        displayName: '',
        ign: '',
        role: 'Rusher',
        email: '',
        username: '',
        country: '',
        bio: '',
        academyStatus: 'Cadet',
        verificationStatus: 'Unverified',
        initialXp: 0,
        matches: 0,
        wins: 0,
        kills: 0,
        kd: 0.0
      });
    } catch {
      // Handled in context
    }
  };

  const handleRemovePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerForRemoval) return;
    if (!removalReason.trim()) {
      showToast('Please provide a mandatory reason for removal', 'error');
      return;
    }

    try {
      await removePlayerFromAcademy(selectedPlayerForRemoval.xnId, removalReason);
      setRemoveModalOpen(false);
      setSelectedPlayerForRemoval(null);
      setRemovalReason('');
    } catch {
      // Handled in context
    }
  };

  const handleCalibrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerForCalibration) {
      showToast('Please select a player to calibrate', 'error');
      return;
    }

    try {
      await calibratePlayerTelemetry(selectedPlayerForCalibration.xnId, calibrationData);
      setSelectedPlayerForCalibration(null);
      setActiveTab('roster');
    } catch {
      // Handled in context
    }
  };

  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.description) {
      showToast('Event title and description are required', 'error');
      return;
    }

    try {
      await createEvent({
        title: newEvent.title,
        eventType: newEvent.eventType,
        description: newEvent.description,
        rewardXp: Number(newEvent.rewardXp),
        scheduledDate: new Date(newEvent.scheduledDate).toISOString(),
        targetRank: newEvent.targetRank,
        targetRole: newEvent.targetRole,
        broadcastPush: newEvent.broadcastPush
      });
      setNewEvent({
        title: '',
        eventType: 'TOURNAMENT',
        description: '',
        rewardXp: 250,
        scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
        targetRank: 'ALL',
        targetRole: 'ALL',
        broadcastPush: true
      });
    } catch {
      // Handled in context
    }
  };

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastData.title || !broadcastData.message) {
      showToast('Title and message are required', 'error');
      return;
    }

    try {
      await sendNotification({
        recipientXnId: broadcastData.recipientXnId === 'ALL' ? undefined : broadcastData.recipientXnId,
        title: broadcastData.title,
        message: broadcastData.message,
        type: broadcastData.type,
        priority: broadcastData.priority,
        linkView: broadcastData.linkView
      });
      setBroadcastData({
        recipientXnId: 'ALL',
        title: '',
        message: '',
        type: 'announcement',
        priority: 'normal',
        linkView: 'leaderboard'
      });
    } catch {
      // Handled in context
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24">
      {/* Top Header & Clearance Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <button
            onClick={() => setActiveView('admin')}
            className="inline-flex items-center gap-1.5 font-mono text-xs text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Admin Portal
          </button>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
              ACADEMY <span className="text-orange-400">OPERATIONS.</span>
            </h1>
            <span className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-xs font-bold uppercase">
              {currentAdmin?.isHeadOfCommand ? 'HEAD OF COMMAND' : 'STAFF OFFICER'}
            </span>
          </div>
          <p className="font-body text-sm text-slate-400 mt-1">
            Player enrollment, lifetime telemetry calibration, event generation & direct device push broadcasts.
          </p>
        </div>

        {/* Global Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refreshPlayers();
              refreshEvents();
              refreshNotifications();
              showToast('Operations data synchronized', 'success');
            }}
            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh All"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2.5 bg-[#f4a261] hover:bg-[#ffb378] text-[#2b1400] font-display font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(244,162,97,0.3)]"
          >
            <UserPlus className="w-4 h-4" />
            Enroll Operative
          </button>
        </div>
      </div>

      {/* Operations Navigation Tabs */}
      <div className="flex border-b border-slate-800/80 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'roster'
              ? 'bg-slate-900 text-cyan-400 border-t-2 border-t-cyan-400 border-x border-slate-800'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <Users className="w-4 h-4" />
          Operative Roster ({players.length})
        </button>

        <button
          onClick={() => setActiveTab('calibrate')}
          className={`px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'calibrate'
              ? 'bg-slate-900 text-orange-400 border-t-2 border-t-orange-400 border-x border-slate-800'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Telemetry Calibration
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'events'
              ? 'bg-slate-900 text-purple-400 border-t-2 border-t-purple-400 border-x border-slate-800'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Academy Events ({events.length})
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'broadcast'
              ? 'bg-slate-900 text-amber-400 border-t-2 border-t-amber-400 border-x border-slate-800'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <Bell className="w-4 h-4" />
          Direct Push & Broadcasts
        </button>
      </div>

      {/* TAB 1: OPERATIVE ROSTER (ADD / REMOVE / INSPECT) */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          {/* Top Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#0b0f15] border border-slate-800 p-4 rounded-xl">
              <span className="font-mono text-[10px] text-slate-500 uppercase block">TOTAL OPERATIVES</span>
              <span className="font-display font-black text-2xl text-white">{players.length}</span>
            </div>
            <div className="bg-[#0b0f15] border border-slate-800 p-4 rounded-xl">
              <span className="font-mono text-[10px] text-slate-500 uppercase block">VERIFIED OFFICERS</span>
              <span className="font-display font-black text-2xl text-cyan-400">
                {players.filter(p => p.verificationStatus !== 'Unverified').length}
              </span>
            </div>
            <div className="bg-[#0b0f15] border border-slate-800 p-4 rounded-xl">
              <span className="font-mono text-[10px] text-slate-500 uppercase block">S-RANK & S-MAX</span>
              <span className="font-display font-black text-2xl text-orange-400">
                {players.filter(p => p.currentRank === 'S' || p.currentRank === 'S-MAX').length}
              </span>
            </div>
            <div className="bg-[#0b0f15] border border-slate-800 p-4 rounded-xl">
              <span className="font-mono text-[10px] text-slate-500 uppercase block">ACTIVE COMBATANTS</span>
              <span className="font-display font-black text-2xl text-emerald-400">
                {players.filter(p => p.lifetimeStats.matches > 0).length}
              </span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="p-4 bg-[#0b0f15] border border-slate-800 rounded-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, IGN, or XN-ID..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs font-mono text-white outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-mono text-slate-400">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-800 text-xs font-mono text-white rounded-lg outline-none cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="Rusher">Rusher</option>
                <option value="Sniper">Sniper</option>
                <option value="IGL">IGL</option>
                <option value="Support">Support</option>
                <option value="Fragger">Fragger</option>
                <option value="Flex">Flex</option>
              </select>
            </div>
          </div>

          {/* Operatives Table */}
          <div className="bg-[#0b0f15] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Operative</th>
                    <th className="p-4">Rank / XP</th>
                    <th className="p-4">Role / Status</th>
                    <th className="p-4">Lifetime Telemetry (Locked)</th>
                    <th className="p-4 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPlayers.map((player) => (
                    <tr key={player.xnId} className="hover:bg-slate-900/40 transition-colors">
                      {/* Identity Column */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                            {player.avatarUrl ? (
                              <img src={player.avatarUrl} alt={player.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <span className="font-display font-black text-cyan-400 text-sm">{player.displayName.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-sm">{player.displayName}</span>
                              <span className="text-cyan-400 text-[11px]">({player.ign})</span>
                            </div>
                            <span className="text-slate-400 text-[10px] block">{player.xnId} · {player.email || 'No email registered'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Rank / XP Column */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <RankHexBadge rank={player.currentRank} size="sm" />
                          <div>
                            <span className="font-bold text-orange-400 block">{player.currentRank} RANK</span>
                            <span className="text-slate-400 text-[11px]">{player.totalXp.toLocaleString()} XP</span>
                          </div>
                        </div>
                      </td>

                      {/* Role & Verification */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 text-[10px] font-bold uppercase inline-block">
                            {player.role}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {player.verificationStatus}
                          </span>
                        </div>
                      </td>

                      {/* Telemetry Column */}
                      <td className="p-4">
                        <div className="grid grid-cols-4 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-500 block text-[9px]">MATCHES</span>
                            <span className="font-bold text-white">{player.lifetimeStats.matches}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[9px]">WINS</span>
                            <span className="font-bold text-emerald-400">{player.lifetimeStats.wins}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[9px]">KILLS</span>
                            <span className="font-bold text-white">{player.lifetimeStats.kills}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[9px]">WIN %</span>
                            <span className="font-bold text-amber-400">{player.lifetimeStats.winRate}%</span>
                          </div>
                        </div>
                      </td>

                      {/* Operations Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => startCalibration(player)}
                            className="px-2.5 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded text-[11px] font-bold uppercase transition-colors cursor-pointer"
                            title="Calibrate Locked Telemetry"
                          >
                            Calibrate
                          </button>

                          <button
                            onClick={() => {
                              setBroadcastData(prev => ({
                                ...prev,
                                recipientXnId: player.xnId,
                                title: `DIRECT COMMENDATION: ${player.displayName}`,
                                message: `Academy Command has updated your record. Keep up the high standard in combat trials.`
                              }));
                              setActiveTab('broadcast');
                            }}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700 rounded transition-colors cursor-pointer"
                            title="Send Direct Notification"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedPlayerForRemoval(player);
                              setRemoveModalOpen(true);
                            }}
                            className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 rounded transition-colors cursor-pointer"
                            title="Expel / Remove from Academy"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TELEMETRY CALIBRATION CONSOLE */}
      {activeTab === 'calibrate' && (
        <div className="bg-[#0b0f15] border border-slate-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-xl max-w-3xl mx-auto">
          <div className="border-b border-slate-800/80 pb-4">
            <span className="font-mono text-xs font-bold text-orange-400 uppercase tracking-widest block mb-1">
              COMBAT TELEMETRY CALIBRATION CONSOLE
            </span>
            <h2 className="font-display text-2xl font-black text-white uppercase tracking-tight">
              CALIBRATE & VERIFY <span className="text-orange-400">PLAYER STATS.</span>
            </h2>
            <p className="font-body text-xs text-slate-400 mt-1">
              Update locked metrics based on officially filed player reports or verified match review.
            </p>
          </div>

          <form onSubmit={handleCalibrationSubmit} className="space-y-6 font-mono text-xs">
            {/* Player Selection */}
            <div>
              <label className="block text-slate-300 uppercase font-bold mb-2">Select Target Operative</label>
              <select
                value={selectedPlayerForCalibration?.xnId || ''}
                onChange={(e) => {
                  const p = players.find(x => x.xnId === e.target.value);
                  if (p) startCalibration(p);
                }}
                className="w-full p-3 bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-lg text-white outline-none cursor-pointer"
                required
              >
                <option value="">-- Choose Operative --</option>
                {players.map(p => (
                  <option key={p.xnId} value={p.xnId}>
                    {p.displayName} ({p.ign}) · {p.xnId} · {p.currentRank} Rank ({p.totalXp} XP)
                  </option>
                ))}
              </select>
            </div>

            {selectedPlayerForCalibration && (
              <div className="p-4 bg-slate-950 border border-orange-500/30 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <RankHexBadge rank={selectedPlayerForCalibration.currentRank} size="sm" />
                    <div>
                      <p className="text-white font-bold">{selectedPlayerForCalibration.displayName} ({selectedPlayerForCalibration.xnId})</p>
                      <p className="text-slate-400 text-[11px]">Current XP: {selectedPlayerForCalibration.totalXp}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">
                    CALIBRATION READY
                  </span>
                </div>

                {/* Telemetry Metric Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Lifetime Matches</label>
                    <input
                      type="number"
                      min="0"
                      value={calibrationData.matches}
                      onChange={(e) => {
                        const m = parseInt(e.target.value) || 0;
                        const wr = m > 0 ? parseFloat(((calibrationData.wins / m) * 100).toFixed(1)) : 0;
                        setCalibrationData({ ...calibrationData, matches: m, winRate: wr });
                      }}
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 rounded text-white outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Lifetime Wins</label>
                    <input
                      type="number"
                      min="0"
                      value={calibrationData.wins}
                      onChange={(e) => {
                        const w = parseInt(e.target.value) || 0;
                        const wr = calibrationData.matches > 0 ? parseFloat(((w / calibrationData.matches) * 100).toFixed(1)) : 0;
                        setCalibrationData({ ...calibrationData, wins: w, winRate: wr });
                      }}
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 rounded text-emerald-400 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Lifetime Kills</label>
                    <input
                      type="number"
                      min="0"
                      value={calibrationData.kills}
                      onChange={(e) => setCalibrationData({ ...calibrationData, kills: parseInt(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 rounded text-white outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase mb-1">K/D Ratio</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={calibrationData.kd}
                      onChange={(e) => setCalibrationData({ ...calibrationData, kd: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 rounded text-cyan-400 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Win Rate % (Calculated)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={calibrationData.winRate}
                      onChange={(e) => setCalibrationData({ ...calibrationData, winRate: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 rounded text-amber-400 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Report / Ticket #</label>
                    <input
                      type="text"
                      value={calibrationData.reportTicket}
                      onChange={(e) => setCalibrationData({ ...calibrationData, reportTicket: e.target.value })}
                      placeholder="e.g. REP-4921"
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 rounded text-white outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase mb-1">Calibration Reason & Officer Notes</label>
                  <textarea
                    rows={2}
                    value={calibrationData.reason}
                    onChange={(e) => setCalibrationData({ ...calibrationData, reason: e.target.value })}
                    placeholder="Document justification for adjusting verified telemetry..."
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 rounded text-white outline-none"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="recalcXp"
                    checked={calibrationData.recalculateXp}
                    onChange={(e) => setCalibrationData({ ...calibrationData, recalculateXp: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="recalcXp" className="text-slate-300 select-none cursor-pointer">
                    Recalculate cumulative XP and rank tier based on new verified telemetry metrics
                  </label>
                </div>
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="submit"
                disabled={!selectedPlayerForCalibration}
                className="flex-1 py-3.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-slate-950 font-display font-black text-sm uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.3)]"
              >
                <CheckCircle className="w-4 h-4" />
                Commit Telemetry Calibration
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedPlayerForCalibration(null);
                  setActiveTab('roster');
                }}
                className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs uppercase rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: ACADEMY EVENTS GENERATOR */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Creation Form */}
          <div className="lg:col-span-1 bg-[#0b0f15] border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl h-fit">
            <div className="border-b border-slate-800 pb-3">
              <span className="font-mono text-xs font-bold text-purple-400 uppercase tracking-widest block mb-1">
                EVENT AUTHORING
              </span>
              <h3 className="font-display text-xl font-black text-white uppercase">
                GENERATE <span className="text-purple-400">EVENT.</span>
              </h3>
            </div>

            <form onSubmit={handleCreateEventSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-400 uppercase mb-1">Event Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g. Apex Vanguard Trial #4"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded text-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase mb-1">Event Category</label>
                  <select
                    value={newEvent.eventType}
                    onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded text-white outline-none cursor-pointer"
                  >
                    <option value="TOURNAMENT">Tournament</option>
                    <option value="SCRIMMAGE">Scrimmage</option>
                    <option value="DOUBLE_XP">Double XP</option>
                    <option value="WAR_ROOM">War Room</option>
                    <option value="DRILL">Drill</option>
                    <option value="TRIALS">Trials</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase mb-1">XP Reward</label>
                  <input
                    type="number"
                    step="50"
                    min="50"
                    max="5000"
                    value={newEvent.rewardXp}
                    onChange={(e) => setNewEvent({ ...newEvent, rewardXp: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded text-purple-300 font-bold outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase mb-1">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  value={newEvent.scheduledDate}
                  onChange={(e) => setNewEvent({ ...newEvent, scheduledDate: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded text-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase mb-1">Target Rank</label>
                  <select
                    value={newEvent.targetRank}
                    onChange={(e) => setNewEvent({ ...newEvent, targetRank: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded text-white outline-none cursor-pointer"
                  >
                    <option value="ALL">All Ranks</option>
                    <option value="B+">B Rank & Above</option>
                    <option value="A+">A Rank & Above</option>
                    <option value="S">S-Rank Legends</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase mb-1">Target Role</label>
                  <select
                    value={newEvent.targetRole}
                    onChange={(e) => setNewEvent({ ...newEvent, targetRole: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded text-white outline-none cursor-pointer"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="Rusher">Rusher</option>
                    <option value="Sniper">Sniper</option>
                    <option value="IGL">IGL</option>
                    <option value="Support">Support</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase mb-1">Event Briefing & Rules</label>
                <textarea
                  rows={3}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Outline requirements, map pool, and competitive stakes..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded text-white outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="broadcastPush"
                  checked={newEvent.broadcastPush}
                  onChange={(e) => setNewEvent({ ...newEvent, broadcastPush: e.target.checked })}
                  className="w-4 h-4 text-purple-500 rounded bg-slate-900 border-slate-700"
                />
                <label htmlFor="broadcastPush" className="text-slate-300 select-none cursor-pointer">
                  Send instant device push notification to all players
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-display font-black text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.3)]"
              >
                <Zap className="w-4 h-4" />
                Publish Academy Event
              </button>
            </form>
          </div>

          {/* Active Events Directory */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-300 uppercase">
                SCHEDULED ACADEMY EVENTS ({events.length})
              </span>
              <span className="font-mono text-[11px] text-purple-400">
                Live Broadcasts Synced to Operative Inboxes
              </span>
            </div>

            {events.length === 0 ? (
              <div className="p-12 text-center bg-[#0b0f15] border border-slate-800 rounded-xl space-y-2">
                <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-mono text-xs text-slate-400 uppercase">No active events scheduled</p>
                <p className="font-body text-xs text-slate-500">Use the event authoring form to launch tournaments and drills.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-5 bg-[#0b0f15] border border-slate-800 rounded-xl hover:border-purple-500/40 transition-all space-y-3 shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold uppercase">
                            {ev.eventType}
                          </span>
                          <h4 className="font-display font-black text-base text-white uppercase">
                            {ev.title}
                          </h4>
                        </div>
                        <p className="font-body text-xs text-slate-300 mt-1 leading-relaxed">
                          {ev.description}
                        </p>
                      </div>

                      <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-black shrink-0">
                        +{ev.rewardXp} XP
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          {new Date(ev.scheduledDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        <span>·</span>
                        <span>Clearance: <b className="text-white">{ev.targetRank}</b></span>
                        <span>·</span>
                        <span>Role: <b className="text-white">{ev.targetRole}</b></span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            sendNotification({
                              title: `EVENT REMINDER: ${ev.title}`,
                              message: `The ${ev.title} event is approaching. XP Bounty: +${ev.rewardXp} XP. Prepare loadouts.`,
                              type: 'event',
                              priority: 'normal'
                            });
                          }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 rounded text-[10px] font-bold uppercase cursor-pointer"
                        >
                          Broadcast Push
                        </button>
                        <button
                          onClick={() => deleteEvent(ev.id)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition-colors"
                          title="Cancel Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DIRECT PUSH & BROADCASTS */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Dispatcher Form */}
          <div className="lg:col-span-1 bg-[#0b0f15] border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl h-fit">
            <div className="border-b border-slate-800 pb-3">
              <span className="font-mono text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
                TACTICAL BROADCASTER
              </span>
              <h3 className="font-display text-xl font-black text-white uppercase">
                SEND <span className="text-amber-400">NOTIFICATION.</span>
              </h3>
            </div>

            {/* Device Permission Helper */}
            {deviceNotificationPermission !== 'granted' && (
              <div className="p-3.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono text-xs font-bold text-white uppercase">
                    Device Push Inactive
                  </span>
                </div>
                <p className="font-mono text-[11px] text-slate-300 leading-normal">
                  Enable device permissions so notifications ping directly to your phone/desktop.
                </p>
                <button
                  type="button"
                  onClick={requestDeviceNotificationPermission}
                  className="w-full py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-[11px] font-bold uppercase rounded cursor-pointer transition-colors"
                >
                  Enable Device Push
                </button>
              </div>
            )}

            <form onSubmit={handleBroadcastSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-400 uppercase mb-1">Recipient Audience</label>
                <select
                  value={broadcastData.recipientXnId}
                  onChange={(e) => setBroadcastData({ ...broadcastData, recipientXnId: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded text-white outline-none cursor-pointer"
                >
                  <option value="ALL">🌐 Broadcast to ALL Operatives</option>
                  {players.map(p => (
                    <option key={p.xnId} value={p.xnId}>
                      👤 {p.displayName} ({p.ign}) · {p.xnId}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 uppercase mb-1">Notification Title</label>
                <input
                  type="text"
                  value={broadcastData.title}
                  onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
                  placeholder="e.g. FLASH COMMAND: Scrimmage Registration Live"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded text-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase mb-1">Category</label>
                  <select
                    value={broadcastData.type}
                    onChange={(e) => setBroadcastData({ ...broadcastData, type: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded text-white outline-none cursor-pointer"
                  >
                    <option value="announcement">Announcement</option>
                    <option value="event">Event Alert</option>
                    <option value="reward">XP Commendation</option>
                    <option value="sitrep">SITREP Status</option>
                    <option value="telemetry">Telemetry Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase mb-1">Priority</label>
                  <select
                    value={broadcastData.priority}
                    onChange={(e) => setBroadcastData({ ...broadcastData, priority: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded text-white outline-none cursor-pointer"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent / Flash</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase mb-1">Message Content</label>
                <textarea
                  rows={4}
                  value={broadcastData.message}
                  onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                  placeholder="Transmit official directive or feedback..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase mb-1">Destination Action View</label>
                <select
                  value={broadcastData.linkView}
                  onChange={(e) => setBroadcastData({ ...broadcastData, linkView: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded text-white outline-none cursor-pointer"
                >
                  <option value="leaderboard">Leaderboard</option>
                  <option value="dashboard">Operative Dashboard</option>
                  <option value="submit">Submit SITREP</option>
                  <option value="rank-journey">Rank Journey</option>
                  <option value="home">Hall of Fame Home</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              >
                <Send className="w-4 h-4" />
                Dispatch To Device
              </button>
            </form>
          </div>

          {/* Broadcast Transmission History */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-300 uppercase">
                TRANSMISSION LOG ({notifications.length})
              </span>
              <span className="font-mono text-[11px] text-cyan-400">
                Push Alerts Synced to Connected Devices
              </span>
            </div>

            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-4 bg-[#0b0f15] border border-slate-800 rounded-xl flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-700 text-[10px] font-mono font-bold uppercase">
                        {notif.type}
                      </span>
                      <h5 className="font-mono text-xs font-bold text-white">
                        {notif.title}
                      </h5>
                      {notif.priority === 'urgent' && (
                        <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[9px] font-mono font-bold uppercase">
                          FLASH
                        </span>
                      )}
                    </div>
                    <p className="font-body text-xs text-slate-300 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-slate-400">
                      <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>·</span>
                      <span>Target: <b className="text-white">{notif.recipientXnId || 'ALL OPERATIVES'}</b></span>
                      <span>·</span>
                      <span>Sender: <b className="text-amber-400">{notif.sender}</b></span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                    DELIVERED
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ENROLL OPERATIVE MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0b0f15] border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-800 pb-3">
              <span className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-1">
                ACADEMY RECRUITMENT PROTOCOL
              </span>
              <h3 className="font-display text-2xl font-black text-white uppercase">
                ENROLL <span className="text-cyan-400">OPERATIVE.</span>
              </h3>
              <p className="font-body text-xs text-slate-400 mt-1">
                Allocate a permanent XN-ID and register candidate into the official academy system.
              </p>
            </div>

            <form onSubmit={handleAddPlayerSubmit} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase mb-1">Display Name</label>
                  <input
                    type="text"
                    value={newPlayer.displayName}
                    onChange={(e) => setNewPlayer({ ...newPlayer, displayName: e.target.value })}
                    placeholder="e.g. Marcus Vance"
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase mb-1">In-Game Name (IGN)</label>
                  <input
                    type="text"
                    value={newPlayer.ign}
                    onChange={(e) => setNewPlayer({ ...newPlayer, ign: e.target.value })}
                    placeholder="e.g. VORTEX"
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase mb-1">Tactical Role</label>
                  <select
                    value={newPlayer.role}
                    onChange={(e) => setNewPlayer({ ...newPlayer, role: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none cursor-pointer"
                  >
                    <option value="Rusher">Rusher</option>
                    <option value="Sniper">Sniper</option>
                    <option value="IGL">IGL</option>
                    <option value="Support">Support</option>
                    <option value="Fragger">Fragger</option>
                    <option value="Flex">Flex</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase mb-1">Country / Region</label>
                  <input
                    type="text"
                    value={newPlayer.country}
                    onChange={(e) => setNewPlayer({ ...newPlayer, country: e.target.value })}
                    placeholder="e.g. Ghana / UK"
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newPlayer.email}
                    onChange={(e) => setNewPlayer({ ...newPlayer, email: e.target.value })}
                    placeholder="operative@domain.com"
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase mb-1">Initial XP</label>
                  <input
                    type="number"
                    min="0"
                    value={newPlayer.initialXp}
                    onChange={(e) => setNewPlayer({ ...newPlayer, initialXp: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-orange-400 outline-none"
                  />
                </div>
              </div>

              {/* Initial Telemetry Fields */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="font-mono text-[10px] font-bold text-slate-400 uppercase block">
                  INITIAL VERIFIED TELEMETRY (LOCKED)
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase">Matches</label>
                    <input
                      type="number"
                      min="0"
                      value={newPlayer.matches}
                      onChange={(e) => setNewPlayer({ ...newPlayer, matches: parseInt(e.target.value) || 0 })}
                      className="w-full p-1.5 bg-slate-900 border border-slate-800 rounded text-white text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase">Wins</label>
                    <input
                      type="number"
                      min="0"
                      value={newPlayer.wins}
                      onChange={(e) => setNewPlayer({ ...newPlayer, wins: parseInt(e.target.value) || 0 })}
                      className="w-full p-1.5 bg-slate-900 border border-slate-800 rounded text-emerald-400 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase">Kills</label>
                    <input
                      type="number"
                      min="0"
                      value={newPlayer.kills}
                      onChange={(e) => setNewPlayer({ ...newPlayer, kills: parseInt(e.target.value) || 0 })}
                      className="w-full p-1.5 bg-slate-900 border border-slate-800 rounded text-white text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase">K/D</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={newPlayer.kd}
                      onChange={(e) => setNewPlayer({ ...newPlayer, kd: parseFloat(e.target.value) || 0 })}
                      className="w-full p-1.5 bg-slate-900 border border-slate-800 rounded text-cyan-400 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#f4a261] hover:bg-[#ffb378] text-[#2b1400] font-display font-black text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  Complete Enrollment
                </button>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded font-mono text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REMOVE OPERATIVE CONFIRMATION MODAL */}
      {removeModalOpen && selectedPlayerForRemoval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0b0f15] border border-red-500/40 rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-white uppercase">
                  EXPEL OPERATIVE
                </h3>
                <span className="font-mono text-xs text-red-400">
                  {selectedPlayerForRemoval.displayName} ({selectedPlayerForRemoval.xnId})
                </span>
              </div>
            </div>

            <p className="font-body text-xs text-slate-300">
              This action will permanently remove <b className="text-white">{selectedPlayerForRemoval.displayName}</b> from the official academy roster and revoke all active permissions.
            </p>

            <form onSubmit={handleRemovePlayerSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-400 uppercase mb-1">Reason for Removal (Mandatory)</label>
                <textarea
                  rows={3}
                  value={removalReason}
                  onChange={(e) => setRemovalReason(e.target.value)}
                  placeholder="e.g. Code of conduct breach, inactivity, or player transfer..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-red-500 rounded text-white outline-none"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-display font-black text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  Confirm Expulsion
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRemoveModalOpen(false);
                    setSelectedPlayerForRemoval(null);
                  }}
                  className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded font-mono text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
