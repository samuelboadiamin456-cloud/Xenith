import React, { useState } from 'react';
import { motion } from 'motion/react';
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
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AdminPortalView: React.FC = () => {
  const { 
    isAdmin, 
    loginAsAdmin, 
    logout, 
    submissions, 
    approveSubmission, 
    flagSubmission, 
    rejectSubmission, 
    adminStats, 
    auditLogs,
    showToast 
  } = useApp();

  const [rejectingSubId, setRejectingSubId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Screenshot resolution invalid or stats mismatched');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [inspectImage, setInspectImage] = useState<string | null>(null);

  // If not logged in as admin, show security authentication prompt
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 space-y-6">
        <div className="bg-[#0b0f15] border border-red-500/30 rounded-2xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 rounded-2xl bg-black/80 border border-red-500/40 p-2 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(239,68,68,0.3)]">
            <img 
              src="/logo.jpg" 
              alt="XN Academy Crest" 
              className="w-full h-full object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="space-y-2">
            <span className="font-mono text-xs font-bold text-red-400 uppercase tracking-widest block">
              RESTRICTED SECURITY SECTOR
            </span>
            <h2 className="font-display text-2xl font-black text-white uppercase">
              Vanguard Administration
            </h2>
            <p className="font-body text-xs text-slate-400">
              Only authorized staff officers can verify match performance telemetry, review flagged anomalies, and award rank XP.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <button
              onClick={loginAsAdmin}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-display font-black text-xs uppercase tracking-wider chamfer-btn transition-colors shadow-[0_0_20px_rgba(239,68,68,0.4)] cursor-pointer"
            >
              Authorize As Staff Administrator →
            </button>
            <p className="font-mono text-[10px] text-slate-500">
              One-click security demo clearance
            </p>
          </div>
        </div>
      </div>
    );
  }

  const filteredSubmissions = submissions.filter(s => {
    if (filterStatus === 'ALL') return true;
    return s.status === filterStatus;
  });

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingSubId) return;
    rejectSubmission(rejectingSubId, rejectReason);
    setRejectingSubId(null);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Controls */}
      <div className="border-b border-slate-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-bold text-red-400 tracking-[0.2em] uppercase block mb-1">
            COMMAND ADMINISTRATION / REVIEW QUEUE
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            SYSTEM <span className="text-red-400">DASHBOARD.</span>
          </h1>
          <p className="font-body text-sm text-slate-400 mt-1">
            Review match evidence, audit anomalous telemetry, and award competitive rank XP.
          </p>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-bold uppercase rounded transition-colors cursor-pointer"
        >
          Exit Admin Mode
        </button>
      </div>

      {/* Admin Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-[#0b0f15] border border-slate-800">
          <span className="font-mono text-[10px] text-slate-400 uppercase block">TOTAL OPERATIVES</span>
          <span className="font-display text-2xl font-black text-white">{adminStats.totalPlayers}</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0b0f15] border border-slate-800">
          <span className="font-mono text-[10px] text-slate-400 uppercase block">PENDING REVIEWS</span>
          <span className="font-display text-2xl font-black text-amber-400">{adminStats.pendingSubmissions}</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0b0f15] border border-slate-800">
          <span className="font-mono text-[10px] text-slate-400 uppercase block">FLAGGED ANOMALIES</span>
          <span className="font-display text-2xl font-black text-purple-400">{adminStats.flaggedSubmissions}</span>
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

      {/* Review Queue Desk */}
      <div className="bg-[#0b0f15] border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <span className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest block">
              VERIFICATION DESK
            </span>
            <h2 className="font-display text-xl font-bold text-white uppercase">
              SITREP Submissions Queue
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 font-mono text-xs">
            {['ALL', 'pending', 'flagged', 'approved', 'rejected'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded uppercase font-bold transition-colors cursor-pointer ${
                  filterStatus === status
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(56,189,248,0.4)]'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <div className="py-12 text-center font-mono text-xs text-slate-500">
            No submissions in this queue category.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((sub) => (
              <div
                key={sub.id}
                className={`p-5 rounded-xl border transition-all ${
                  sub.status === 'flagged'
                    ? 'bg-purple-950/20 border-purple-500/40'
                    : sub.status === 'approved'
                    ? 'bg-slate-900/30 border-slate-800/80'
                    : sub.status === 'rejected'
                    ? 'bg-red-950/20 border-red-500/30'
                    : 'bg-slate-900/70 border-slate-700'
                }`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  
                  {/* Evidence Thumbnail */}
                  <div className="lg:col-span-3">
                    {sub.evidenceUrl ? (
                      <div 
                        onClick={() => setInspectImage(sub.evidenceUrl!)}
                        className="relative rounded-lg overflow-hidden border border-slate-700 aspect-video group cursor-pointer"
                      >
                        <img
                          src={sub.evidenceUrl}
                          alt="Evidence"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-mono gap-1 transition-opacity">
                          <Eye className="w-4 h-4" /> Inspect Image
                        </div>
                      </div>
                    ) : (
                      <div className="h-24 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center text-slate-500 font-mono text-xs">
                        No Evidence Image
                      </div>
                    )}
                  </div>

                  {/* Submission Telemetry Info */}
                  <div className="lg:col-span-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white uppercase">
                        {sub.id}
                      </span>
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        {sub.xnId}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
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
                    </div>

                    <p className="font-mono text-xs text-slate-300">
                      Operative: <b className="text-white">{sub.playerName}</b> (IGN: {sub.playerIgn})
                    </p>

                    {/* Stats Pill Matrix */}
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-300 pt-1">
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

      {/* Audit Logs Stream */}
      <div className="bg-[#0b0f15] border border-slate-800 rounded-xl p-6 space-y-4">
        <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest block">
          SYSTEM AUDIT TRAIL
        </span>
        <div className="divide-y divide-slate-800/60 font-mono text-xs space-y-1">
          {auditLogs.slice(0, 8).map(log => (
            <div key={log.id} className="py-2.5 flex items-center justify-between text-slate-400 gap-4">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-cyan-400 font-bold">
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
    </div>
  );
};
