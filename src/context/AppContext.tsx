import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Player, 
  Submission, 
  AuditLog, 
  ActiveView, 
  RankTier, 
  SubmissionStats, 
  AdminStats,
  AdminUser,
  AdminRequest,
  AppNotification,
  AcademyEvent
} from '../types';
import { INITIAL_PLAYERS, INITIAL_SUBMISSIONS, INITIAL_AUDIT_LOGS } from '../data/initialData';
import { calculateRank, calculateSubmissionScore, RANK_CONFIGS } from '../data/rankConfigs';
import { api, clearAdminToken } from '../services/api';
import { notificationService } from '../services/notificationService';
import {
  safeStorageGet,
  safeStorageGetString,
  safeStorageSet,
  safeStorageRemove,
  sanitizeSubmissionsForStorage,
  sanitizePlayersForStorage,
  sanitizeLogsForStorage,
  initializeStorageHealthCheck
} from '../utils/storage';

// Run storage cleanup immediately on app load to clear any previously clogged keys
initializeStorageHealthCheck();

interface AppContextType {
  players: Player[];
  submissions: Submission[];
  auditLogs: AuditLog[];
  currentPlayer: Player | null;
  currentAdmin: AdminUser | null;
  isAdmin: boolean;
  adminRequests: AdminRequest[];
  adminStatus: { hasInitialAdmin: boolean; totalAdmins: number; pendingRequestsCount: number };
  activeView: ActiveView;
  selectedProfileXnId: string | null;
  celebrationRank: RankTier | null;
  showCelebration: boolean;
  toastMessage: { text: string; type: 'success' | 'error' | 'info' } | null;
  adminStats: AdminStats;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register' | 'admin-login' | 'admin-register';
  openAuthModal: (mode?: 'login' | 'register' | 'admin-login' | 'admin-register') => void;
  closeAuthModal: () => void;
  
  // Notifications & Device Alerts
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  notificationModalOpen: boolean;
  openNotificationModal: () => void;
  closeNotificationModal: () => void;
  requestDeviceNotificationPermission: () => Promise<boolean>;
  deviceNotificationPermission: NotificationPermission | 'unsupported';
  sendNotification: (payload: {
    recipientXnId?: string;
    title: string;
    message: string;
    type?: AppNotification['type'];
    priority?: AppNotification['priority'];
    linkView?: string;
  }) => Promise<AppNotification>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;

  // Academy Events
  events: AcademyEvent[];
  createEvent: (eventData: {
    title: string;
    eventType: AcademyEvent['eventType'];
    description: string;
    rewardXp: number;
    scheduledDate: string;
    targetRank?: string;
    targetRole?: string;
    broadcastPush?: boolean;
  }) => Promise<AcademyEvent>;
  deleteEvent: (id: string) => Promise<void>;
  refreshEvents: () => Promise<void>;

  // Academy Operations: Player Enrollment & Removal
  addPlayerToAcademy: (playerData: {
    displayName: string;
    ign: string;
    role: Player['role'];
    email?: string;
    username?: string;
    country?: string;
    bio?: string;
    avatarUrl?: string;
    initialXp?: number;
    academyStatus?: Player['academyStatus'];
    verificationStatus?: Player['verificationStatus'];
    lifetimeStats?: Partial<Player['lifetimeStats']>;
  }) => Promise<Player>;
  removePlayerFromAcademy: (xnId: string, reason: string) => Promise<void>;

  // Locked Telemetry Calibration
  calibratePlayerTelemetry: (xnId: string, data: {
    kills?: number;
    wins?: number;
    matches?: number;
    kd?: number;
    winRate?: number;
    reportTicket?: string;
    reason?: string;
    recalculateXp?: boolean;
  }) => Promise<Player>;

  // PWA Homescreen Installation
  installModalOpen: boolean;
  isInstallable: boolean;
  isAppInstalled: boolean;
  deferredPrompt: any;
  openInstallModal: () => void;
  closeInstallModal: () => void;
  promptInstall: () => Promise<boolean>;
  
  // Navigation
  setActiveView: (view: ActiveView) => void;
  viewPlayerProfile: (xnId: string) => void;
  
  // Player Auth
  loginAsPlayer: (identifier: string, password?: string) => Promise<boolean>;
  logout: () => void;
  registerPlayer: (data: {
    username: string;
    email: string;
    password?: string;
    displayName: string;
    ign: string;
    role: Player['role'];
    country?: string;
    bio?: string;
    avatarUrl?: string;
  }) => Promise<Player>;
  updateProfile: (updatedData: Partial<Player>) => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;

  // Admin Auth & Clearance Workflow
  bootstrapFirstAdmin: (data: {
    username: string;
    email: string;
    password: string;
    displayName: string;
  }) => Promise<void>;
  requestAdminAccess: (data: {
    username: string;
    email: string;
    password: string;
    displayName: string;
    reason?: string;
  }) => Promise<void>;
  loginAsAdmin: (identifier: string, password: string) => Promise<boolean>;
  approveAdminRequest: (requestId: string) => Promise<void>;
  rejectAdminRequest: (requestId: string) => Promise<void>;
  refreshAdminData: () => Promise<void>;
  refreshPlayers: () => Promise<void>;
  refreshAllData: () => Promise<void>;

  // Head of Command & Admin Powers
  resetAllRanks: (reason?: string) => Promise<void>;
  resetPlayerRank: (xnId: string, reason?: string) => Promise<void>;
  deductXp: (xnId: string, amount: number, reason?: string) => Promise<void>;
  rewardPlayer: (xnId: string, amount?: number, reason?: string) => Promise<void>;
  
  // Submissions
  createSubmission: (stats: SubmissionStats, evidenceUrl?: string, discrepancyReport?: string) => Promise<Submission>;
  approveSubmission: (submissionId: string, editedStats?: SubmissionStats, reason?: string) => Promise<void>;
  editSubmissionTelemetry: (submissionId: string, stats: SubmissionStats, reason?: string) => Promise<void>;
  flagSubmission: (submissionId: string) => Promise<void>;
  rejectSubmission: (submissionId: string, reason: string) => Promise<void>;
  
  // Celebration
  triggerRankCelebration: (rank: RankTier) => void;
  closeCelebration: () => void;
  
  // Toast
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_PLAYERS = 'xn_academy_players_v1';
const STORAGE_KEY_SUBS = 'xn_academy_submissions_v1';
const STORAGE_KEY_LOGS = 'xn_academy_logs_v1';
const STORAGE_KEY_USER = 'xn_academy_current_user_v1';
const STORAGE_KEY_ADMIN_USER = 'xn_academy_admin_user_v1';
const STORAGE_KEY_ADMIN = 'xn_academy_is_admin_v1';
const STORAGE_KEY_ADMIN_REQUESTS = 'xn_academy_admin_requests_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDemoSeedPlayer = (p: Player) => {
    if (!p) return true;
    return p.id?.startsWith('p-seed-') || ['XN-001', 'XN-002', 'XN-003', 'XN-004', 'XN-005', 'XN-006'].includes(p.xnId) || ['vanguard_prime', 'cypher_99', 'apex_nova', 'ghost_pulse', 'aegis_core', 'strike_echo'].includes(p.username);
  };

  const [players, setPlayers] = useState<Player[]>(() => {
    const parsed = safeStorageGet<Player[]>(STORAGE_KEY_PLAYERS, []);
    return Array.isArray(parsed) ? parsed.filter(p => !isDemoSeedPlayer(p)) : [];
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const parsed = safeStorageGet<Submission[]>(STORAGE_KEY_SUBS, []);
    return Array.isArray(parsed)
      ? parsed.filter((s: Submission) => !s.id?.startsWith('sub-9021') && !s.id?.startsWith('sub-8842') && !s.id?.startsWith('sub-7612'))
      : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const parsed = safeStorageGet<AuditLog[]>(STORAGE_KEY_LOGS, []);
    return Array.isArray(parsed)
      ? parsed.filter((l: AuditLog) => !l.id?.startsWith('log-seed-'))
      : [];
  });

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(() => {
    const parsed = safeStorageGet<Player | null>(STORAGE_KEY_USER, null);
    if (parsed && isDemoSeedPlayer(parsed)) {
      safeStorageRemove(STORAGE_KEY_USER);
      return null;
    }
    return parsed;
  });

  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => {
    return safeStorageGet<AdminUser | null>(STORAGE_KEY_ADMIN_USER, null);
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return safeStorageGetString(STORAGE_KEY_ADMIN, 'false') === 'true';
  });

  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>(() => {
    return safeStorageGet<AdminRequest[]>(STORAGE_KEY_ADMIN_REQUESTS, []);
  });

  const [adminStatus, setAdminStatus] = useState<{
    hasInitialAdmin: boolean;
    totalAdmins: number;
    pendingRequestsCount: number;
  }>({
    hasInitialAdmin: false,
    totalAdmins: 0,
    pendingRequestsCount: 0
  });

  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [selectedProfileXnId, setSelectedProfileXnId] = useState<string | null>(null);
  const [celebrationRank, setCelebrationRank] = useState<RankTier | null>(null);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'admin-login' | 'admin-register'>('register');

  // Notifications and Events State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [events, setEvents] = useState<AcademyEvent[]>([]);
  const [notificationModalOpen, setNotificationModalOpen] = useState<boolean>(false);
  const [deviceNotificationPermission, setDeviceNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    return notificationService.getPermission();
  });

  const unreadNotificationsCount = notifications.filter(n => {
    if (n.read) return false;
    if (!n.recipientXnId) return true; // Global broadcast
    return currentPlayer?.xnId === n.recipientXnId;
  }).length;

  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [installModalOpen, setInstallModalOpen] = useState<boolean>(false);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      showToast('XN Academy app successfully installed to your homescreen!', 'success');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const openInstallModal = () => {
    setInstallModalOpen(true);
  };

  const closeInstallModal = () => {
    setInstallModalOpen(false);
  };

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      openInstallModal();
      return false;
    }
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsAppInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.error('PWA prompt error:', err);
    }
    return false;
  };

  const openAuthModal = (mode: 'login' | 'register' | 'admin-login' | 'admin-register' = 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  // Sync admin data from server
  const refreshAdminData = async () => {
    try {
      const [status, requests] = await Promise.all([
        api.getAdminStatus(),
        api.getAdminRequests()
      ]);
      if (status) setAdminStatus(status);
      if (requests && requests.length >= 0) {
        setAdminRequests(requests);
      }
    } catch (err) {
      console.warn('[Admin Sync Error]', err);
    }
  };

  // Full Database State Synchronization (across PC and Mobile)
  const refreshAllData = async () => {
    try {
      const state = await api.getFullState();
      if (state) {
        if (Array.isArray(state.players)) {
          setPlayers(state.players);
          // Keep current player profile synchronized with server authoritative state
          setCurrentPlayer(prev => {
            if (!prev) return null;
            const updated = state.players.find(
              p => p.xnId.toLowerCase() === prev.xnId.toLowerCase() || (p.username && prev.username && p.username.toLowerCase() === prev.username.toLowerCase())
            );
            return updated || prev;
          });
        }
        if (Array.isArray(state.submissions)) {
          setSubmissions(state.submissions);
        }
        if (Array.isArray(state.auditLogs)) {
          setAuditLogs(state.auditLogs);
        }
        if (state.adminStatus) {
          setAdminStatus(state.adminStatus);
        }
        if (Array.isArray(state.adminRequests)) {
          setAdminRequests(state.adminRequests);
        }
        if (Array.isArray(state.notifications)) {
          setNotifications(state.notifications);
        }
        if (Array.isArray(state.events)) {
          setEvents(state.events);
        }
      }
    } catch (err) {
      console.warn('[XN Sync] Real-time sync error:', err);
    }
  };

  // Continuous Real-Time Cross-Device Synchronization Engine
  useEffect(() => {
    let isMounted = true;
    let initialBootstrapDone = false;

    const performSync = async () => {
      try {
        const state = await api.getFullState();
        if (!isMounted) return;

        if (state) {
          // If this is the initial run, check if local storage had custom players not yet on server
          if (!initialBootstrapDone) {
            initialBootstrapDone = true;
            const rawPlayers = safeStorageGet<Player[]>(STORAGE_KEY_PLAYERS, []);
            const rawSubs = safeStorageGet<Submission[]>(STORAGE_KEY_SUBS, []);
            
            if (rawPlayers.length > 0 || rawSubs.length > 0) {
              try {
                const localPlayers = rawPlayers.filter(p => !isDemoSeedPlayer(p));
                const localSubs = rawSubs.filter(s => !s.id?.startsWith('sub-9021') && !s.id?.startsWith('sub-8842') && !s.id?.startsWith('sub-7612'));
                
                const hasNewPlayers = localPlayers.some(lp => lp.xnId && !state.players.some(sp => sp.xnId.toLowerCase() === lp.xnId.toLowerCase()));
                const hasNewSubs = localSubs.some(ls => ls.id && !state.submissions.some(ss => ss.id === ls.id));
                
                if (hasNewPlayers || hasNewSubs) {
                  const mergeResult = await api.clientMergeSync({
                    players: localPlayers,
                    submissions: localSubs
                  });
                  if (mergeResult && isMounted) {
                    setPlayers(mergeResult.players);
                    setSubmissions(mergeResult.submissions);
                    setAuditLogs(mergeResult.auditLogs);
                    setNotifications(mergeResult.notifications);
                    setEvents(mergeResult.events);
                    return;
                  }
                }
              } catch (e) {
                console.warn('[Storage Reconciliation]', e);
              }
            }
          }

          // Authoritative Server State Sync
          if (Array.isArray(state.players)) {
            setPlayers(state.players);
            setCurrentPlayer(prev => {
              if (!prev) return null;
              const updated = state.players.find(
                p => p.xnId.toLowerCase() === prev.xnId.toLowerCase() || (p.username && prev.username && p.username.toLowerCase() === prev.username.toLowerCase())
              );
              return updated || prev;
            });
          }
          if (Array.isArray(state.submissions)) {
            setSubmissions(state.submissions);
          }
          if (Array.isArray(state.auditLogs)) {
            setAuditLogs(state.auditLogs);
          }
          if (state.adminStatus) {
            setAdminStatus(state.adminStatus);
          }
          if (Array.isArray(state.adminRequests)) {
            setAdminRequests(state.adminRequests);
          }
          if (Array.isArray(state.notifications)) {
            setNotifications(state.notifications);
          }
          if (Array.isArray(state.events)) {
            setEvents(state.events);
          }
        }
      } catch (err) {
        console.warn('[XN Protocol] Backend sync note:', err);
      }
    };

    // Immediate initial fetch
    performSync();

    // Periodic fast background synchronization (every 3.5 seconds)
    const intervalId = setInterval(performSync, 3500);

    // Synchronize immediately when window or tab gains focus or becomes visible
    const handleFocus = () => {
      performSync();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        performSync();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Safe persistence to localStorage
  useEffect(() => {
    safeStorageSet(STORAGE_KEY_PLAYERS, sanitizePlayersForStorage(players));
  }, [players]);

  useEffect(() => {
    // Sanitizes submissions to strip oversized data:image URLs from localStorage
    safeStorageSet(STORAGE_KEY_SUBS, sanitizeSubmissionsForStorage(submissions));
  }, [submissions]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEY_LOGS, sanitizeLogsForStorage(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    if (currentPlayer) {
      safeStorageSet(STORAGE_KEY_USER, currentPlayer);
    } else {
      safeStorageRemove(STORAGE_KEY_USER);
    }
  }, [currentPlayer]);

  useEffect(() => {
    if (currentAdmin) {
      safeStorageSet(STORAGE_KEY_ADMIN_USER, currentAdmin);
    } else {
      safeStorageRemove(STORAGE_KEY_ADMIN_USER);
    }
  }, [currentAdmin]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEY_ADMIN, isAdmin ? 'true' : 'false');
  }, [isAdmin]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEY_ADMIN_REQUESTS, adminRequests);
  }, [adminRequests]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(prev => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const triggerRankCelebration = (rank: RankTier) => {
    setCelebrationRank(rank);
    setShowCelebration(true);

    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#f4a261', '#e76f51', '#3b82f6', '#10b981']
      });
    } catch {
      // Fallback gracefully
    }
  };

  const closeCelebration = () => {
    setShowCelebration(false);
  };

  const viewPlayerProfile = (xnId: string) => {
    setSelectedProfileXnId(xnId);
    setActiveView('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Player Login with Password Enforcement
  const loginAsPlayer = async (identifier: string, password?: string): Promise<boolean> => {
    const clean = identifier.trim().toLowerCase();

    // Try backend API login
    try {
      const response = await api.loginPlayer(identifier, password);
      if (response && response.player) {
        setCurrentPlayer(response.player);
        setIsAdmin(false);
        setCurrentAdmin(null);
        showToast(`Clearance verified. Welcome back, Operative ${response.player.displayName} (${response.player.xnId})`, 'success');
        return true;
      }
    } catch (err: any) {
      showToast(err.message || 'Invalid player credentials', 'error');
      return false;
    }

    // Local fallback
    const found = players.find(
      p => p.xnId.toLowerCase() === clean || 
           p.username.toLowerCase() === clean || 
           p.email.toLowerCase() === clean ||
           p.ign.toLowerCase() === clean
    );

    if (found) {
      if (found.password && password && found.password !== password) {
        showToast('Invalid operative password', 'error');
        return false;
      }
      setCurrentPlayer(found);
      setIsAdmin(false);
      setCurrentAdmin(null);
      showToast(`Welcome back, Operative ${found.displayName} (${found.xnId})`, 'success');
      return true;
    }

    showToast('Operative ID, username or email not recognized', 'error');
    return false;
  };

  // Admin Bootstrap (First Head of Command)
  const bootstrapFirstAdmin = async (data: {
    username: string;
    email: string;
    password: string;
    displayName: string;
  }) => {
    try {
      const res = await api.bootstrapFirstAdmin(data);
      setCurrentAdmin(res.admin);
      setIsAdmin(true);
      setCurrentPlayer(null);
      if (res.auditLog) {
        setAuditLogs(prev => [res.auditLog!, ...prev]);
      }
      await refreshAdminData();
      showToast(`Head of Command Clearance Activated! Welcome, ${res.admin.displayName}. Direct admin registration is now closed.`, 'success');
      setActiveView('admin');
    } catch (err: any) {
      showToast(err.message || 'Failed to initialize Head of Command account', 'error');
      throw err;
    }
  };

  // Admin Access Request
  const requestAdminAccess = async (data: {
    username: string;
    email: string;
    password: string;
    displayName: string;
    reason?: string;
  }) => {
    try {
      const res = await api.requestAdminAccess(data);
      await refreshAdminData();
      showToast(res.message || 'Clearance application submitted. Awaiting Head of Command review.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit clearance application', 'error');
      throw err;
    }
  };

  // Admin Login
  const loginAsAdmin = async (identifier: string, password: string): Promise<boolean> => {
    try {
      const res = await api.loginAdmin(identifier, password);
      if (res && res.admin) {
        setCurrentAdmin(res.admin);
        setIsAdmin(true);
        setCurrentPlayer(null);
        await refreshAdminData();
        showToast(`Staff Clearance Granted. Welcome ${res.admin.displayName} (${res.admin.role.replace('_', ' ')})`, 'success');
        setActiveView('admin');
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(err.message || 'Admin authentication failed', 'error');
      return false;
    }
  };

  // Approve Admin Request
  const approveAdminRequest = async (requestId: string) => {
    try {
      const res = await api.approveAdminRequest(requestId);
      await refreshAdminData();
      showToast(res.message || 'Clearance request approved! New officer provisioned.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to approve request', 'error');
    }
  };

  // Reject Admin Request
  const rejectAdminRequest = async (requestId: string) => {
    try {
      await api.rejectAdminRequest(requestId);
      await refreshAdminData();
      showToast('Clearance request rejected.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to reject request', 'error');
    }
  };

  const refreshPlayers = async () => {
    try {
      const serverPlayers = await api.getPlayers();
      if (serverPlayers && serverPlayers.length > 0) {
        setPlayers(serverPlayers);
      }
    } catch (err) {
      console.warn('[Refresh Players]', err);
    }
  };

  // Head of Command: Reset ALL Operative Ranks across network
  const resetAllRanks = async (reason?: string) => {
    try {
      const res = await api.resetAllRanks(currentAdmin?.username, reason);
      setPlayers(prev => prev.map(p => ({
        ...p,
        totalXp: 0,
        currentRank: 'E'
      })));
      if (currentPlayer) {
        setCurrentPlayer(prev => prev ? { ...prev, totalXp: 0, currentRank: 'E' } : null);
      }
      if (res.auditLog) {
        setAuditLogs(prev => [res.auditLog!, ...prev]);
      }
      showToast(res.message || 'All operative ranks successfully reset to Rank E (0 XP).', 'success');
      await refreshPlayers();
    } catch (err: any) {
      showToast(err.message || 'Failed to reset all ranks', 'error');
      throw err;
    }
  };

  // Head of Command: Reset Individual Operative Rank
  const resetPlayerRank = async (xnId: string, reason?: string) => {
    try {
      const res = await api.resetPlayerRank(xnId, currentAdmin?.username, reason);
      setPlayers(prev => prev.map(p => p.xnId.toLowerCase() === xnId.toLowerCase() ? res.player : p));
      if (currentPlayer?.xnId.toLowerCase() === xnId.toLowerCase()) {
        setCurrentPlayer(res.player);
      }
      if (res.auditLog) {
        setAuditLogs(prev => [res.auditLog!, ...prev]);
      }
      showToast(res.message || `Operative ${xnId} rank reset to Rank E (0 XP).`, 'success');
      await refreshPlayers();
    } catch (err: any) {
      showToast(err.message || 'Failed to reset player rank', 'error');
      throw err;
    }
  };

  // Head of Command: Deduct XP from Operative
  const deductXp = async (xnId: string, amount: number, reason?: string) => {
    try {
      const res = await api.deductXp(xnId, amount, currentAdmin?.username, reason);
      setPlayers(prev => prev.map(p => p.xnId.toLowerCase() === xnId.toLowerCase() ? res.player : p));
      if (currentPlayer?.xnId.toLowerCase() === xnId.toLowerCase()) {
        setCurrentPlayer(res.player);
      }
      if (res.auditLog) {
        setAuditLogs(prev => [res.auditLog!, ...prev]);
      }
      showToast(res.message || `Deducted ${amount} XP from ${xnId}.`, 'success');
      await refreshPlayers();
    } catch (err: any) {
      showToast(err.message || 'Failed to deduct XP', 'error');
      throw err;
    }
  };

  // Admin Reward (+50 XP) - Unlocked for Admins crossing A-Rank or HoC
  const rewardPlayer = async (xnId: string, amount: number = 50, reason?: string) => {
    try {
      const res = await api.rewardPlayer(xnId, currentAdmin?.username || 'Command', amount, reason);
      setPlayers(prev => prev.map(p => p.xnId.toLowerCase() === xnId.toLowerCase() ? res.player : p));
      if (currentPlayer?.xnId.toLowerCase() === xnId.toLowerCase()) {
        setCurrentPlayer(res.player);
      }
      if (res.auditLog) {
        setAuditLogs(prev => [res.auditLog!, ...prev]);
      }
      showToast(res.message || `Awarded +${amount} XP reward to ${xnId}!`, 'success');
      await refreshPlayers();
    } catch (err: any) {
      showToast(err.message || 'Failed to reward operative', 'error');
      throw err;
    }
  };

  const logout = () => {
    setCurrentPlayer(null);
    setCurrentAdmin(null);
    setIsAdmin(false);
    clearAdminToken();
    showToast('Logged out of session', 'info');
    setActiveView('home');
  };

  const registerPlayer = async (data: {
    username: string;
    email: string;
    password?: string;
    displayName: string;
    ign: string;
    role: Player['role'];
    country?: string;
    bio?: string;
    avatarUrl?: string;
  }): Promise<Player> => {
    try {
      const result = await api.registerPlayer(data);
      const newPlayer = result.player;
      setPlayers(prev => [newPlayer, ...prev]);
      setCurrentPlayer(newPlayer);
      if (result.auditLog) {
        setAuditLogs(prev => [result.auditLog!, ...prev]);
      }
      showToast(`Account created! Your permanent ID is ${newPlayer.xnId}`, 'success');
      return newPlayer;
    } catch (err: any) {
      // Local fallback
      const existingNumbers = players.map(p => {
        const match = p.xnId.match(/XN-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      });
      const maxNumber = Math.max(0, ...existingNumbers);
      const nextNumber = maxNumber + 1;
      const formattedId = `XN-${nextNumber.toString().padStart(3, '0')}`;

      const newPlayer: Player = {
        id: `p-${Date.now()}`,
        xnId: formattedId,
        username: data.username,
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        ign: data.ign.toUpperCase(),
        role: data.role,
        country: data.country || 'Global',
        bio: data.bio || 'New Academy operative undergoing verified performance clearance.',
        avatarUrl: data.avatarUrl,
        currentRank: 'E',
        peakRank: 'E',
        totalXp: 50,
        academyStatus: 'Cadet',
        verificationStatus: 'Verified',
        joinedAt: new Date().toISOString(),
        lifetimeStats: {
          kills: 0,
          wins: 0,
          matches: 0,
          kd: 0.0,
          winRate: 0.0,
          hs: 0.0
        }
      };

      setPlayers(prev => [newPlayer, ...prev]);
      setCurrentPlayer(newPlayer);

      const log: AuditLog = {
        id: `log-${Date.now()}`,
        action: 'OPERATIVE_REGISTERED',
        timestamp: new Date().toISOString(),
        actorType: 'system',
        details: `New account assigned official permanent identifier: ${formattedId} (${data.displayName})`
      };
      setAuditLogs(prev => [log, ...prev]);

      showToast(`Account created! Your permanent ID is ${formattedId}`, 'success');
      return newPlayer;
    }
  };

  const updateProfile = async (updatedData: Partial<Player>) => {
    if (!currentPlayer) return;

    try {
      const serverUpdated = await api.updatePlayer(currentPlayer.xnId, updatedData);
      setCurrentPlayer(serverUpdated);
      setPlayers(prev => prev.map(p => (p.xnId === serverUpdated.xnId ? serverUpdated : p)));
    } catch {
      const updated = { ...currentPlayer, ...updatedData };
      setCurrentPlayer(updated);
      setPlayers(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    }
    showToast('Profile specifications updated', 'success');
  };

  const updateAvatar = async (avatarUrl: string) => {
    if (!currentPlayer) return;
    await updateProfile({ avatarUrl });
    showToast('Operative profile visual avatar updated successfully', 'success');
  };

  const createSubmission = async (stats: SubmissionStats, evidenceUrl?: string, discrepancyReport?: string): Promise<Submission> => {
    const player = currentPlayer || players[0];
    const score = calculateSubmissionScore(stats);
    
    // Fraud checks
    const fraudFlags: string[] = [];
    if (stats.kd && stats.kd > 15.0) fraudFlags.push('Extreme K/D Anomaly (>15.0)');
    if (stats.kills && stats.kills > 35) fraudFlags.push('Unusually High Kill Count (>35 kills in single match)');
    if (stats.winRate && stats.winRate > 95 && (stats.matches || 1) > 5) fraudFlags.push('Unusually High Win Rate (>95%)');

    try {
      if (player) {
        const result = await api.createSubmission({
          xnId: player.xnId,
          playerName: player.displayName,
          playerIgn: player.ign,
          stats,
          mode: stats.mode || 'BR',
          evidenceUrl,
          discrepancyReport
        });

        const newSub = result.submission;
        setSubmissions(prev => [newSub, ...prev]);
        if (result.auditLog) {
          setAuditLogs(prev => [result.auditLog!, ...prev]);
        }
        showToast(`SITREP ${newSub.id} [${stats.mode || 'BR'}] submitted (+${score.total} XP pending review)`, 'success');
        return newSub;
      }
    } catch {
      // Fallback
    }

    const newSub: Submission = {
      id: `sub-${Math.floor(1000 + Math.random() * 9000)}`,
      xnId: player ? player.xnId : 'XN-UNKNOWN',
      playerName: player ? player.displayName : 'Recruit Operative',
      playerIgn: player ? player.ign : 'OPERATIVE',
      createdAt: new Date().toISOString(),
      status: fraudFlags.length > 0 ? 'flagged' : 'pending',
      stats,
      mode: stats.mode || 'BR',
      evidenceUrl: evidenceUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
      fraudFlags,
      scoreBreakdown: score,
      discrepancyReport
    };

    setSubmissions(prev => [newSub, ...prev]);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: fraudFlags.length > 0 ? 'SITREP_FLAGGED' : 'SITREP_SUBMITTED',
      timestamp: new Date().toISOString(),
      actorType: 'system',
      details: `${newSub.id} [${stats.mode || 'BR'}] from ${newSub.playerName} (${newSub.xnId}) queued for review (Score: ${score.total} XP).${discrepancyReport ? ` [Discrepancy Report: "${discrepancyReport}"]` : ''}${fraudFlags.length ? ` Flags: ${fraudFlags.join(', ')}` : ''}`
    };
    setAuditLogs(prev => [log, ...prev]);

    showToast(`SITREP ${newSub.id} [${stats.mode || 'BR'}] submitted (+${score.total} XP pending review)`, 'success');
    return newSub;
  };

  const editSubmissionTelemetry = async (submissionId: string, stats: SubmissionStats, reason?: string) => {
    const newScore = calculateSubmissionScore(stats);
    try {
      const result = await api.updateSubmissionTelemetry(submissionId, stats, reason);
      if (result.submission) {
        setSubmissions(prev => prev.map(s => s.id === submissionId ? result.submission : s));
      }
      if (result.auditLog) {
        setAuditLogs(prev => [result.auditLog!, ...prev]);
      }
      showToast(`Submission ${submissionId} Telemetry Updated (Recalculated: ${newScore.total >= 0 ? `+${newScore.total}` : newScore.total} XP)`, 'success');
      return;
    } catch (err) {
      console.warn('[Edit Telemetry Fallback]', err);
    }

    setSubmissions(prev => prev.map(s => {
      if (s.id !== submissionId) return s;
      return {
        ...s,
        stats,
        scoreBreakdown: newScore,
        adminEdited: true,
        adminEditedNote: reason || 'Admin telemetry adjustment'
      };
    }));

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'SITREP_TELEMETRY_CORRECTED',
      timestamp: new Date().toISOString(),
      actorType: 'admin',
      details: `Submission ${submissionId} telemetry corrected by Admin (+${newScore.total} XP). Reason: ${reason || 'Scoreboard audit adjustment'}`
    };
    setAuditLogs(prev => [log, ...prev]);
    showToast(`Submission ${submissionId} Telemetry Updated (+${newScore.total} XP)`, 'success');
  };

  const approveSubmission = async (submissionId: string, editedStats?: SubmissionStats, reason?: string) => {
    const sub = submissions.find(s => s.id === submissionId);
    if (!sub || sub.status === 'approved') return;

    try {
      const result = await api.approveSubmission(submissionId, editedStats, reason);
      if (result.submission) {
        setSubmissions(prev => prev.map(s => s.id === submissionId ? result.submission : s));
      }
      if (result.player) {
        const updated = result.player;
        setPlayers(prev => prev.map(p => 
          (p.xnId.toLowerCase() === updated.xnId.toLowerCase() || p.id === updated.id) ? updated : p
        ));
        if (currentPlayer && (
          currentPlayer.xnId.toLowerCase() === updated.xnId.toLowerCase() || 
          currentPlayer.id === updated.id ||
          (currentPlayer.ign && updated.ign && currentPlayer.ign.toLowerCase() === updated.ign.toLowerCase())
        )) {
          const oldRank = currentPlayer.currentRank;
          setCurrentPlayer(updated);
          if (updated.currentRank !== oldRank && RANK_CONFIGS[updated.currentRank].minXp > RANK_CONFIGS[oldRank].minXp) {
            triggerRankCelebration(updated.currentRank);
          }
        }
      }
      if (result.auditLog) {
        setAuditLogs(prev => [result.auditLog!, ...prev]);
      }
      await refreshAllData();
      const finalXp = result.submission?.scoreBreakdown?.total ?? (editedStats ? calculateSubmissionScore(editedStats).total : sub.scoreBreakdown.total);
      showToast(`Submission ${submissionId} Approved (+${finalXp} XP)`, 'success');
      return;
    } catch (err) {
      console.warn('[Approval Fallback]', err);
    }

    const finalStats = editedStats || sub.stats;
    const finalScore = editedStats ? calculateSubmissionScore(editedStats) : sub.scoreBreakdown;
    const awardedXp = finalScore.total;
    const targetPlayer = players.find(p => 
      (sub.xnId && p.xnId && p.xnId.toLowerCase() === sub.xnId.toLowerCase()) ||
      (sub.xnId && p.id && p.id.toLowerCase() === sub.xnId.toLowerCase()) ||
      (sub.playerIgn && p.ign && p.ign.toLowerCase() === sub.playerIgn.toLowerCase())
    );

    setSubmissions(prev => prev.map(s => 
      s.id === submissionId 
        ? { 
            ...s, 
            status: 'approved', 
            stats: finalStats,
            scoreBreakdown: finalScore,
            adminEdited: editedStats ? true : s.adminEdited,
            adminEditedNote: reason || s.adminEditedNote,
            reviewedBy: currentAdmin?.displayName || 'Admin_Lead', 
            reviewedAt: new Date().toISOString() 
          } 
        : s
    ));

    if (targetPlayer) {
      const newTotalXp = targetPlayer.totalXp + awardedXp;
      const oldRank = targetPlayer.currentRank;
      const newRank = calculateRank(newTotalXp);

      const oldStats = targetPlayer.lifetimeStats || { kills: 0, wins: 0, matches: 0, kd: 0, winRate: 0, hs: 0 };
      const totalMatches = (oldStats.matches || 0) + (finalStats.matches || 1);
      const totalWins = (oldStats.wins || 0) + (finalStats.wins || 0);
      const totalKills = (oldStats.kills || 0) + (finalStats.kills || 0);
      const subDeaths = finalStats.deaths !== undefined ? finalStats.deaths : (finalStats.outcome === 'Defeat' ? 1 : 0);
      const oldDeaths = (oldStats.matches && oldStats.kd && oldStats.kd > 0) ? Math.round(oldStats.kills / oldStats.kd) : 0;
      const totalDeaths = Math.max(1, oldDeaths + subDeaths);
      const updatedKd = totalDeaths > 0 ? parseFloat((totalKills / totalDeaths).toFixed(2)) : totalKills;
      const updatedWinRate = totalMatches > 0 ? parseFloat(((totalWins / totalMatches) * 100).toFixed(1)) : (finalStats.winRate || 0);
      const updatedHs = parseFloat((((oldStats.hs || 0) + (finalStats.hs || 0)) / 2).toFixed(1));

      const updatedPlayer: Player = {
        ...targetPlayer,
        totalXp: newTotalXp,
        currentRank: newRank,
        peakRank: (RANK_CONFIGS[newRank].minXp > (RANK_CONFIGS[targetPlayer.peakRank]?.minXp || 0)) ? newRank : targetPlayer.peakRank,
        lifetimeStats: {
          kills: totalKills,
          wins: totalWins,
          matches: totalMatches,
          kd: updatedKd,
          winRate: updatedWinRate,
          hs: updatedHs
        }
      };

      setPlayers(prev => prev.map(p => (p.xnId.toLowerCase() === targetPlayer.xnId.toLowerCase() ? updatedPlayer : p)));

      if (currentPlayer && (
        currentPlayer.xnId.toLowerCase() === targetPlayer.xnId.toLowerCase() ||
        currentPlayer.id === targetPlayer.id
      )) {
        setCurrentPlayer(updatedPlayer);
      }

      if (newRank !== oldRank && RANK_CONFIGS[newRank].minXp > RANK_CONFIGS[oldRank].minXp) {
        triggerRankCelebration(newRank);
      }
    }

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'SUBMISSION_APPROVED',
      timestamp: new Date().toISOString(),
      actorType: 'admin',
      details: `Submission ${submissionId} approved for ${sub.playerName} (+${awardedXp} XP)${editedStats ? ' [with Admin Telemetry Adjustment]' : ''}`
    };
    setAuditLogs(prev => [log, ...prev]);
    showToast(`Submission ${submissionId} Approved (+${awardedXp} XP)`, 'success');
  };

  const flagSubmission = async (submissionId: string) => {
    try {
      const result = await api.flagSubmission(submissionId);
      if (result.submission) {
        setSubmissions(prev => prev.map(s => s.id === submissionId ? result.submission : s));
      }
      if (result.auditLog) {
        setAuditLogs(prev => [result.auditLog!, ...prev]);
      }
      showToast(`Submission ${submissionId} Flagged for Telemetry Audit`, 'info');
      return;
    } catch {
      // Fallback
    }

    setSubmissions(prev => prev.map(s => 
      s.id === submissionId ? { ...s, status: 'flagged' } : s
    ));

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'SUBMISSION_FLAGGED',
      timestamp: new Date().toISOString(),
      actorType: 'admin',
      details: `Submission ${submissionId} flagged for anti-cheat verification`
    };
    setAuditLogs(prev => [log, ...prev]);
    showToast(`Submission ${submissionId} Flagged for Review`, 'info');
  };

  const rejectSubmission = async (submissionId: string, reason: string) => {
    try {
      const result = await api.rejectSubmission(submissionId, reason);
      if (result.submission) {
        setSubmissions(prev => prev.map(s => s.id === submissionId ? result.submission : s));
      }
      if (result.auditLog) {
        setAuditLogs(prev => [result.auditLog!, ...prev]);
      }
      showToast(`Submission ${submissionId} Rejected`, 'error');
      return;
    } catch {
      // Fallback
    }

    setSubmissions(prev => prev.map(s => 
      s.id === submissionId ? { ...s, status: 'rejected', rejectionReason: reason, reviewedBy: currentAdmin?.displayName || 'Admin_Lead', reviewedAt: new Date().toISOString() } : s
    ));

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'SUBMISSION_REJECTED',
      timestamp: new Date().toISOString(),
      actorType: 'admin',
      details: `Submission ${submissionId} rejected. Reason: ${reason}`
    };
    setAuditLogs(prev => [log, ...prev]);
    showToast(`Submission ${submissionId} Rejected`, 'error');
  };

  // --- ACADEMY OPERATIONS: ADD & REMOVE OPERATIVES ---
  const addPlayerToAcademy = async (playerData: {
    displayName: string;
    ign: string;
    role: Player['role'];
    email?: string;
    username?: string;
    country?: string;
    bio?: string;
    avatarUrl?: string;
    initialXp?: number;
    academyStatus?: Player['academyStatus'];
    verificationStatus?: Player['verificationStatus'];
    lifetimeStats?: Partial<Player['lifetimeStats']>;
  }): Promise<Player> => {
    try {
      const res = await api.addPlayerToAcademy({
        ...playerData,
        adminUsername: currentAdmin?.displayName || currentAdmin?.username || 'Command'
      });
      setPlayers(prev => [res.player, ...prev]);
      if (res.auditLog) {
        setAuditLogs(prev => [res.auditLog!, ...prev]);
      }
      showToast(`Operative ${res.player.displayName} (${res.player.xnId}) enrolled`, 'success');
      refreshNotifications();
      return res.player;
    } catch (err: any) {
      showToast(err.message || 'Failed to add operative', 'error');
      throw err;
    }
  };

  const removePlayerFromAcademy = async (xnId: string, reason: string) => {
    try {
      const res = await api.removePlayerFromAcademy(
        xnId,
        reason,
        currentAdmin?.displayName || currentAdmin?.username || 'Command'
      );
      setPlayers(prev => prev.filter(p => p.xnId !== xnId));
      if (res.auditLog) {
        setAuditLogs(prev => [res.auditLog!, ...prev]);
      }
      if (currentPlayer?.xnId === xnId) {
        logout();
      }
      showToast(`Operative ${xnId} removed from Academy roster`, 'info');
      refreshNotifications();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove operative', 'error');
      throw err;
    }
  };

  // --- LOCKED TELEMETRY CALIBRATION ---
  const calibratePlayerTelemetry = async (xnId: string, data: {
    kills?: number;
    wins?: number;
    matches?: number;
    kd?: number;
    winRate?: number;
    reportTicket?: string;
    reason?: string;
    recalculateXp?: boolean;
  }): Promise<Player> => {
    try {
      const res = await api.calibratePlayerTelemetry(xnId, {
        ...data,
        adminUsername: currentAdmin?.displayName || currentAdmin?.username || 'Academy_Staff'
      });
      setPlayers(prev => prev.map(p => p.xnId === xnId ? res.player : p));
      if (currentPlayer?.xnId === xnId) {
        setCurrentPlayer(res.player);
      }
      if (res.auditLog) {
        setAuditLogs(prev => [res.auditLog!, ...prev]);
      }
      if (res.notification) {
        setNotifications(prev => [res.notification!, ...prev]);
        notificationService.sendDeviceNotification(res.notification.title, {
          body: res.notification.message
        });
      }
      showToast(`Telemetry calibrated for ${res.player.displayName} (${xnId})`, 'success');
      return res.player;
    } catch (err: any) {
      showToast(err.message || 'Telemetry calibration failed', 'error');
      throw err;
    }
  };

  // --- NOTIFICATION MANAGEMENT & DEVICE PUSH ---
  const refreshNotifications = async () => {
    try {
      const notifs = await api.getNotifications(currentPlayer?.xnId);
      setNotifications(notifs);
    } catch (err) {
      console.warn('Failed to refresh notifications:', err);
    }
  };

  const openNotificationModal = () => setNotificationModalOpen(true);
  const closeNotificationModal = () => setNotificationModalOpen(false);

  const requestDeviceNotificationPermission = async (): Promise<boolean> => {
    const perm = await notificationService.requestPermission();
    setDeviceNotificationPermission(perm);
    if (perm === 'granted') {
      showToast('Device push notifications enabled', 'success');
      return true;
    } else {
      showToast('Notification permission declined', 'info');
      return false;
    }
  };

  const sendNotification = async (payload: {
    recipientXnId?: string;
    title: string;
    message: string;
    type?: AppNotification['type'];
    priority?: AppNotification['priority'];
    linkView?: string;
  }): Promise<AppNotification> => {
    try {
      const res = await api.sendNotification({
        ...payload,
        sender: currentAdmin?.displayName || 'Academy Command'
      });
      setNotifications(prev => [res.notification, ...prev]);
      if (res.auditLog) {
        setAuditLogs(prev => [res.auditLog!, ...prev]);
      }
      // Trigger instant browser device alert
      notificationService.sendDeviceNotification(res.notification.title, {
        body: res.notification.message
      });
      showToast('Notification broadcasted to player devices', 'success');
      return res.notification;
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch notification', 'error');
      throw err;
    }
  };

  const markNotificationAsRead = async (id: string) => {
    await api.markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = async () => {
    await api.markAllNotificationsAsRead(currentPlayer?.xnId);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read', 'info');
  };

  const deleteNotification = async (id: string) => {
    await api.deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // --- ACADEMY EVENTS ---
  const refreshEvents = async () => {
    try {
      const evs = await api.getEvents();
      setEvents(evs);
    } catch (err) {
      console.warn('Failed to refresh events:', err);
    }
  };

  const createEvent = async (eventData: {
    title: string;
    eventType: AcademyEvent['eventType'];
    description: string;
    rewardXp: number;
    scheduledDate: string;
    targetRank?: string;
    targetRole?: string;
    broadcastPush?: boolean;
  }): Promise<AcademyEvent> => {
    try {
      const res = await api.createEvent({
        ...eventData,
        createdBy: currentAdmin?.displayName || 'Academy Command'
      });
      setEvents(prev => [res.event, ...prev]);
      if (res.auditLog) {
        setAuditLogs(prev => [res.auditLog!, ...prev]);
      }
      if (eventData.broadcastPush) {
        notificationService.sendDeviceNotification(`NEW EVENT: ${res.event.title}`, {
          body: `${res.event.description} (+${res.event.rewardXp} XP Reward)`
        });
      }
      showToast(`Academy event "${res.event.title}" published!`, 'success');
      refreshNotifications();
      return res.event;
    } catch (err: any) {
      showToast(err.message || 'Failed to create event', 'error');
      throw err;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await api.deleteEvent(id, currentAdmin?.displayName);
      setEvents(prev => prev.filter(e => e.id !== id));
      showToast('Event removed from Academy schedule', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete event', 'error');
    }
  };

  // Compute admin stats
  const adminStats: AdminStats = {
    totalPlayers: players.length,
    activePlayers: players.filter(p => p.lifetimeStats.matches > 0).length,
    pendingSubmissions: submissions.filter(s => s.status === 'pending').length,
    flaggedSubmissions: submissions.filter(s => s.status === 'flagged').length,
    approvedSubmissions: submissions.filter(s => s.status === 'approved').length,
    rejectedSubmissions: submissions.filter(s => s.status === 'rejected').length,
    totalXpAwarded: submissions.filter(s => s.status === 'approved').reduce((acc, s) => acc + s.scoreBreakdown.total, 0)
  };

  return (
    <AppContext.Provider
      value={{
        players,
        submissions,
        auditLogs,
        currentPlayer,
        currentAdmin,
        isAdmin,
        adminRequests,
        adminStatus,
        activeView,
        selectedProfileXnId,
        celebrationRank,
        showCelebration,
        toastMessage,
        adminStats,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,

        // Notifications
        notifications,
        unreadNotificationsCount,
        notificationModalOpen,
        openNotificationModal,
        closeNotificationModal,
        requestDeviceNotificationPermission,
        deviceNotificationPermission,
        sendNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        refreshNotifications,

        // Events
        events,
        createEvent,
        deleteEvent,
        refreshEvents,

        // Academy Operations
        addPlayerToAcademy,
        removePlayerFromAcademy,
        calibratePlayerTelemetry,

        // PWA
        installModalOpen,
        isInstallable,
        isAppInstalled,
        deferredPrompt,
        openInstallModal,
        closeInstallModal,
        promptInstall,
        setActiveView,
        viewPlayerProfile,
        loginAsPlayer,
        bootstrapFirstAdmin,
        requestAdminAccess,
        loginAsAdmin,
        approveAdminRequest,
        rejectAdminRequest,
        refreshAdminData,
        refreshPlayers,
        refreshAllData,
        resetAllRanks,
        resetPlayerRank,
        deductXp,
        rewardPlayer,
        logout,
        registerPlayer,
        updateProfile,
        updateAvatar,
        createSubmission,
        approveSubmission,
        editSubmissionTelemetry,
        flagSubmission,
        rejectSubmission,
        triggerRankCelebration,
        closeCelebration,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
