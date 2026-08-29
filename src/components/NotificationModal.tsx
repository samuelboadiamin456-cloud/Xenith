import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  Sparkles, 
  Trophy, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle, 
  Info, 
  Smartphone,
  Check,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppNotification } from '../types';

export const NotificationModal: React.FC = () => {
  const {
    notifications,
    unreadNotificationsCount,
    notificationModalOpen,
    closeNotificationModal,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    requestDeviceNotificationPermission,
    deviceNotificationPermission,
    setActiveView,
    currentPlayer,
    isAdmin
  } = useApp();

  if (!notificationModalOpen) return null;

  // Filter notifications relevant to this user or global
  const relevantNotifications = notifications.filter(n => {
    if (!n.recipientXnId) return true;
    if (n.recipientXnId === 'ALL') return true;
    return currentPlayer?.xnId === n.recipientXnId || isAdmin;
  });

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'event':
        return <Calendar className="w-4 h-4 text-purple-400" />;
      case 'reward':
      case 'rank':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'sitrep':
        return <ShieldCheck className="w-4 h-4 text-cyan-400" />;
      case 'telemetry':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'announcement':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      default:
        return <Info className="w-4 h-4 text-cyan-400" />;
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.read) {
      markNotificationAsRead(notif.id);
    }
    if (notif.linkView) {
      setActiveView(notif.linkView);
      closeNotificationModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-[#0b0f15] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-base text-white uppercase tracking-wider">
                  TACTICAL NOTIFICATIONS
                </h2>
                {unreadNotificationsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-500 text-slate-950 font-mono text-[10px] font-bold">
                    {unreadNotificationsCount} NEW
                  </span>
                )}
              </div>
              <p className="font-mono text-[11px] text-slate-400">
                Academy alerts, rank promotions & event broadcasts
              </p>
            </div>
          </div>

          <button
            onClick={closeNotificationModal}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Push Permission Prompt Banner */}
        {deviceNotificationPermission !== 'granted' && (
          <div className="px-5 py-3 bg-gradient-to-r from-cyan-950/40 to-slate-900 border-b border-cyan-500/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
              <p className="font-mono text-xs text-slate-300">
                Enable device notifications to receive instant match updates and event alerts.
              </p>
            </div>
            <button
              onClick={requestDeviceNotificationPermission}
              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-[11px] font-bold uppercase rounded cursor-pointer whitespace-nowrap transition-colors"
            >
              Enable
            </button>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 text-[11px]">
            {relevantNotifications.length} TOTAL INBOX NOTIFICATIONS
          </span>

          {relevantNotifications.length > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/40">
          {relevantNotifications.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Bell className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-mono text-xs text-slate-400 uppercase tracking-wider">
                No notifications in your tactical inbox
              </p>
              <p className="font-body text-xs text-slate-500">
                You will receive alerts here when events are published or match SITREPs are verified.
              </p>
            </div>
          ) : (
            relevantNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`pt-2.5 first:pt-0 p-3 rounded-xl transition-all cursor-pointer border ${
                  notif.read
                    ? 'bg-slate-900/30 border-slate-800/60 text-slate-400 hover:border-slate-700'
                    : 'bg-slate-900/90 border-cyan-500/40 text-slate-100 shadow-[0_0_12px_rgba(56,189,248,0.1)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-mono text-xs font-bold text-white">
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        )}
                        {notif.priority === 'urgent' && (
                          <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[9px] font-mono font-bold uppercase">
                            Flash
                          </span>
                        )}
                      </div>
                      <p className="font-body text-xs text-slate-300 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-slate-400">
                        <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>·</span>
                        <span>From: <b className="text-cyan-400">{notif.sender}</b></span>
                        {notif.recipientXnId && notif.recipientXnId !== 'ALL' && (
                          <>
                            <span>·</span>
                            <span className="text-amber-400">Direct Message</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {notif.linkView && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotificationClick(notif);
                        }}
                        className="p-1 text-cyan-400 hover:text-cyan-300 rounded hover:bg-slate-800"
                        title={`Open ${notif.linkView}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Live Device Notification Sync
          </span>

          <button
            onClick={closeNotificationModal}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded font-mono text-xs uppercase cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
