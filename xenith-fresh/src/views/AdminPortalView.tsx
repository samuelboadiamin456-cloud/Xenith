import React, { useState, useEffect } from 'react';
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
  X,
  Crown,
  Key,
  UserCheck,
  UserX,
  FileText,
  Shield
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AdminPortalView: React.FC = () => {
  const { 
    isAdmin, 
    currentAdmin,
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
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'submissions' | 'admin-approvals' | 'audit'>('submissions');
  const [rejectingSubId, setRejectingSubId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Screenshot resolution invalid or stats mismatched');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [inspectImage, setInspectImage] = useState<string | null>(null);

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
              Admin & Command Portal
            </h2>
            <p className="font-body text-xs text-slate-400 leading-relaxed">
              {!adminStatus?.hasInitialAdmin 
                ? 'The initial Head of Command account is OPEN for registration. Claim the founding admin role to lock the system.'
                : 'Staff clearance required. Authorized officers can audit match telemetry, approve operative submissions, and manage staff clearance requests.'}
            </p>
          </div>

          <div className="pt-2 space-y-3">
            {!adminStatus?.hasInitialAdmin ? (
              <button
                onClick={() => openAuthModal('admin-register')}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider chamfer-btn transition-colors shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer"
              >
                Claim Head of Command Account →
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => openAuthModal('admin-login')}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider chamfer-btn transition-colors shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer"
                >
                  Sign In As Administrator →
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
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-amber-400 tracking-[0.2em] uppercase block">
              HEADQUARTERS COMMAND PORTAL
            </span>
            {currentAdmin?.isHeadOfCommand && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-black uppercase flex items-center gap-1">
                <Crown className="w-3 h-3" /> Head of Command
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            SYSTEM <span className="text-amber-400">DASHBOARD.</span>
          </h1>
          <p className="font-body text-sm text-slate-400 mt-1">
            Active Commander: <b className="text-white font-mono">{currentAdmin?.displayName || 'Administrator'}</b> (@{currentAdmin?.username || 'admin'})
          </p>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-bold uppercase rounded transition-colors cursor-pointer"
        >
          Exit Admin Console
        </button>
      </div>

      {/* Admin Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-[#0b0f15] border border-slate-800">
          <span className="font-mono text-[10px] text-slate-400 uppercase block">TOTAL OPERATIVES</span>
          <span className="font-display text-2xl font-black text-white">{adminStats.totalPlayers}</span>
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
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`pb-3 px-4 font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'submissions'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Telemetry SITREPs ({submissions.length})
        </button>

        <button
          onClick={() => setActiveTab('admin-approvals')}
          className={`pb-3 px-4 font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'admin-approvals'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-4 h-4" />
          Staff Clearance Approvals
          {pendingAdminRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black">
              {pendingAdminRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-4 font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer border-b-2 ${
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
      {/* TAB 1: SUBMISSIONS REVIEW */}
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
                          Kills: <b className="text-white">{sub.stats?.kills ?? 0}</b>
                        </span>
                        <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                          Wins: <b className="text-emerald-400">{sub.stats?.wins ?? 0}</b>
                        </span>
                        <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                          K/D: <b className="text-cyan-400">{sub.stats?.kd ?? 0}</b>
                        </span>
                        <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                          HS: <b className="text-red-400">{sub.stats?.hs ?? 0}%</b>
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
                          +{sub.scoreBreakdown?.total ?? 0} XP
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
      {/* TAB 2: STAFF CLEARANCE APPROVALS WORKFLOW */}
      {/* ========================================================================= */}
      {activeTab === 'admin-approvals' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 space-y-1">
            <h3 className="font-display text-lg font-bold text-white uppercase flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              Staff Clearance Management
            </h3>
            <p className="font-body text-xs text-slate-400">
              As the Head of Command, all applicant requests to create or join as a Staff Officer require your manual authorization. Approved applicants can immediately log in and review match telemetry.
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
      {/* TAB 3: AUDIT TRAIL */}
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
