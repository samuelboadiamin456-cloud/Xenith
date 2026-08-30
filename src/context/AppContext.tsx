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
  
  // Submissions
  createSubmission: (stats: SubmissionStats, evidenceUrl?: string) => Promise<Submission>;
  approveSubmission: (submissionId: string) => Promise<void>;
  flagSubmission: (submissionId: string) => Promise<void>;
  rejectSubmission: (submissionId: string, reason: string) => Promise<void>;
  
  // Celebration
  triggerRankCelebration: (rank: RankTier) => void;
  closeCelebration: () => void;
  
  // Toast
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;

  // Academy Operations: roster, notifications, events
  notifications: AppNotification[];
  events: AcademyEvent[];
  deviceNotificationPermission: NotificationPermission | 'unsupported';
  requestDeviceNotificationPermission: () => Promise<void>;
  refreshPlayers: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
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
  }) => Promise<void>;
  removePlayerFromAcademy: (xnId: string, reason: string) => Promise<void>;
  calibratePlayerTelemetry: (xnId: string, data: {
    kills?: number;
    wins?: number;
    matches?: number;
    kd?: number;
    winRate?: number;
    reportTicket?: string;
    reason?: string;
    recalculateXp?: boolean;
  }) => Promise<void>;
  sendNotification: (payload: {
    recipientXnId?: string;
    title: string;
    message: string;
    type?: AppNotification['type'];
    priority?: AppNotification['priority'];
    linkView?: string;
  }) => Promise<void>;
  createEvent: (eventData: {
    title: string;
    eventType: AcademyEvent['eventType'];
    description: string;
    rewardXp: number;
    scheduledDate: string;
    targetRank?: string;
    targetRole?: string;
    broadcastPush?: boolean;
  }) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  // Notification bell/modal
  unreadNotificationsCount: number;
  notificationModalOpen: boolean;
  openNotificationModal: () => void;
  closeNotificationModal: () => void;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
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
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAYERS);
      return saved ? JSON.parse(saved) : INITIAL_PLAYERS;
    } catch {
      return INITIAL_PLAYERS;
    }
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUBS);
      return saved ? JSON.parse(saved) : INITIAL_SUBMISSIONS;
    } catch {
      return INITIAL_SUBMISSIONS;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ADMIN_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_ADMIN) === 'true';
  });

  // Academy Operations: notifications & events (fetched from the
  // server — previously these were destructured from context by
  // AcademyOperationsView but never actually defined here, which
  // made them `undefined` and crashed the view on `.length` access.
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [events, setEvents] = useState<AcademyEvent[]>([]);
  const [deviceNotificationPermission, setDeviceNotificationPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);

  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ADMIN_REQUESTS);
    return saved ? JSON.parse(saved) : [];
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
      setAdminStatus(status);
      if (requests && requests.length >= 0) {
        setAdminRequests(requests);
      }
    } catch (err) {
      console.warn('[Admin Sync Error]', err);
    }
  };

  // Initial Fetch & Sync from Backend APIs
  useEffect(() => {
    // One-time cleanup: earlier versions mirrored full submissions
    // (including base64 evidence images) into localStorage on every
    // change, which eventually exceeds the browser's ~5-10MB quota
    // and crashes the app. The database is the real source of truth
    // now, so these cached copies are dead weight — clear them.
    try {
      localStorage.removeItem(STORAGE_KEY_PLAYERS);
      localStorage.removeItem(STORAGE_KEY_SUBS);
      localStorage.removeItem(STORAGE_KEY_LOGS);
    } catch {
      // ignore — storage may be unavailable (private browsing, etc.)
    }

    let isMounted = true;
    const fetchBackendData = async () => {
      try {
        const [serverPlayers, serverSubs, serverLogs, status, requests, serverNotifs, serverEvents] = await Promise.all([
          api.getPlayers(),
          api.getSubmissions(),
          api.getAuditLogs(),
          api.getAdminStatus(),
          api.getAdminRequests(),
          api.getNotifications(),
          api.getEvents()
        ]);

        if (isMounted) {
          if (serverPlayers && serverPlayers.length > 0) {
            setPlayers(serverPlayers);
          }
          if (serverSubs && serverSubs.length > 0) {
            setSubmissions(serverSubs);
          }
          if (serverLogs && serverLogs.length > 0) {
            setAuditLogs(serverLogs);
          }
          if (status) {
            setAdminStatus(status);
          }
          if (requests) {
            setAdminRequests(requests);
          }
          setNotifications(serverNotifs || []);
          setEvents(serverEvents || []);
        }
      } catch (err) {
        console.warn('[XN Protocol] Backend API sync note:', err);
      }
    };

    fetchBackendData();
    return () => {
      isMounted = false;
    };
  }, []);

  // players, submissions, and audit logs are no longer mirrored to
  // localStorage — they come from the database via the API fetch
  // above. Submissions in particular carry full evidence images,
  // which reliably exceeded the browser storage quota and crashed
  // the app (see cleanup effect above).

  useEffect(() => {
    if (currentPlayer) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentPlayer));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [currentPlayer]);

  useEffect(() => {
    if (currentAdmin) {
      localStorage.setItem(STORAGE_KEY_ADMIN_USER, JSON.stringify(currentAdmin));
    } else {
      localStorage.removeItem(STORAGE_KEY_ADMIN_USER);
    }
  }, [currentAdmin]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ADMIN, isAdmin ? 'true' : 'false');
  }, [isAdmin]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ADMIN_REQUESTS, JSON.stringify(adminRequests));
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

  const createSubmission = async (stats: SubmissionStats, evidenceUrl?: string): Promise<Submission> => {
    const player = currentPlayer || players[0];
    const score = calculateSubmissionScore(stats);
    
    // Fraud checks
    const fraudFlags: string[] = [];
    if (stats.kd > 12.0) fraudFlags.push('Extreme K/D Anomaly (>12.0)');
    if (stats.hs > 85.0) fraudFlags.push('Abnormal Headshot Ratio (>85%)');
    if (stats.winRate > 95 && stats.matches > 5) fraudFlags.push('Unusually High Win Rate (>95%)');

    try {
      if (player) {
        const result = await api.createSubmission({
          xnId: player.xnId,
          playerName: player.displayName,
          playerIgn: player.ign,
          stats,
          evidenceUrl
        });

        const newSub = result.submission;
        setSubmissions(prev => [newSub, ...prev]);
        if (result.auditLog) {
          setAuditLogs(prev => [result.auditLog!, ...prev]);
        }
        showToast(`SITREP ${newSub.id} submitted to review queue`, 'success');
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
      evidenceUrl: evidenceUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
      fraudFlags,
      scoreBreakdown: score
    };

    setSubmissions(prev => [newSub, ...prev]);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: fraudFlags.length > 0 ? 'SITREP_FLAGGED' : 'SITREP_SUBMITTED',
      timestamp: new Date().toISOString(),
      actorType: 'system',
      details: `${newSub.id} from ${newSub.playerName} (${newSub.xnId}) queued for review. ${fraudFlags.length ? `Flags: ${fraudFlags.join(', ')}` : ''}`
    };
    setAuditLogs(prev => [log, ...prev]);

    showToast(`SITREP ${newSub.id} submitted to review queue`, 'success');
    return newSub;
  };

  const approveSubmission = async (submissionId: string) => {
    const sub = submissions.find(s => s.id === submissionId);
    if (!sub || sub.status === 'approved') return;

    try {
      const result = await api.approveSubmission(submissionId);
      if (result.submission) {
        setSubmissions(prev => prev.map(s => s.id === submissionId ? result.submission : s));
      }
      if (result.player) {
        setPlayers(prev => prev.map(p => p.xnId === result.player!.xnId ? result.player! : p));
        if (currentPlayer?.xnId === result.player.xnId) {
          setCurrentPlayer(result.player);
        }
      }
      if (result.auditLog) {
        setAuditLogs(prev => [result.auditLog!, ...prev]);
      }
      showToast(`Submission ${submissionId} Approved (+${sub.scoreBreakdown.total} XP)`, 'success');
      return;
    } catch {
      // Fallback
    }

    const awardedXp = sub.scoreBreakdown.total;
    const targetPlayer = players.find(p => p.xnId === sub.xnId);

    setSubmissions(prev => prev.map(s => 
      s.id === submissionId 
        ? { ...s, status: 'approved', reviewedBy: currentAdmin?.displayName || 'Admin_Lead', reviewedAt: new Date().toISOString() } 
        : s
    ));

    if (targetPlayer) {
      const newTotalXp = targetPlayer.totalXp + awardedXp;
      const oldRank = targetPlayer.currentRank;
      const newRank = calculateRank(newTotalXp);

      const oldStats = targetPlayer.lifetimeStats;
      const totalMatches = oldStats.matches + sub.stats.matches;
      const totalWins = oldStats.wins + sub.stats.wins;
      const totalKills = oldStats.kills + sub.stats.kills;
      const updatedKd = totalMatches > 0 ? parseFloat((totalKills / Math.max(1, totalMatches * 0.8)).toFixed(2)) : sub.stats.kd;
      const updatedWinRate = totalMatches > 0 ? parseFloat(((totalWins / totalMatches) * 100).toFixed(1)) : sub.stats.winRate;
      const updatedHs = parseFloat(((oldStats.hs + sub.stats.hs) / 2).toFixed(1));

      const updatedPlayer: Player = {
        ...targetPlayer,
        totalXp: newTotalXp,
        currentRank: newRank,
        peakRank: (RANK_CONFIGS[newRank].minXp > RANK_CONFIGS[targetPlayer.peakRank].minXp) ? newRank : targetPlayer.peakRank,
        lifetimeStats: {
          kills: totalKills,
          wins: totalWins,
          matches: totalMatches,
          kd: updatedKd,
          winRate: updatedWinRate,
          hs: updatedHs
        }
      };

      setPlayers(prev => prev.map(p => (p.xnId === targetPlayer.xnId ? updatedPlayer : p)));

      if (currentPlayer?.xnId === targetPlayer.xnId) {
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
      details: `Submission ${submissionId} approved for ${sub.playerName} (+${awardedXp} XP)`
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

  // Compute admin stats — guarded against any record missing nested
  // fields, which previously crashed this computation (and the whole
  // app, since it runs on every render) with "Cannot read properties
  // of undefined".
  const adminStats: AdminStats = {
    totalPlayers: players.length,
    activePlayers: players.filter(p => (p.lifetimeStats?.matches ?? 0) > 0).length,
    pendingSubmissions: submissions.filter(s => s.status === 'pending').length,
    flaggedSubmissions: submissions.filter(s => s.status === 'flagged').length,
    approvedSubmissions: submissions.filter(s => s.status === 'approved').length,
    rejectedSubmissions: submissions.filter(s => s.status === 'rejected').length,
    totalXpAwarded: submissions.filter(s => s.status === 'approved').reduce((acc, s) => acc + (s.scoreBreakdown?.total ?? 0), 0)
  };

  // --- Academy Operations handlers ---
  const refreshPlayers = async () => {
    try {
      const list = await api.getPlayers();
      if (list) setPlayers(list);
    } catch (err) {
      console.warn('[XN Protocol] refreshPlayers failed:', err);
    }
  };

  const refreshEvents = async () => {
    try {
      setEvents(await api.getEvents());
    } catch (err) {
      console.warn('[XN Protocol] refreshEvents failed:', err);
    }
  };

  const refreshNotifications = async () => {
    try {
      setNotifications(await api.getNotifications());
    } catch (err) {
      console.warn('[XN Protocol] refreshNotifications failed:', err);
    }
  };

  const requestDeviceNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      setDeviceNotificationPermission('unsupported');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setDeviceNotificationPermission(perm);
    } catch {
      setDeviceNotificationPermission('denied');
    }
  };

  const addPlayerToAcademy: AppContextType['addPlayerToAcademy'] = async (playerData) => {
    try {
      const result = await api.addPlayerToAcademy({ ...playerData, adminUsername: currentAdmin?.username });
      setPlayers(prev => [...prev, result.player]);
      if (result.auditLog) setAuditLogs(prev => [result.auditLog as AuditLog, ...prev]);
      showToast(`${result.player.displayName} added to the academy roster`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add operative to academy', 'error');
      throw err;
    }
  };

  const removePlayerFromAcademy = async (xnId: string, reason: string) => {
    try {
      const result = await api.removePlayerFromAcademy(xnId, reason, currentAdmin?.username);
      setPlayers(prev => prev.filter(p => p.xnId !== xnId));
      showToast(result.message || 'Operative removed from academy', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove operative', 'error');
      throw err;
    }
  };

  const calibratePlayerTelemetry: AppContextType['calibratePlayerTelemetry'] = async (xnId, data) => {
    try {
      const result = await api.calibratePlayerTelemetry(xnId, { ...data, adminUsername: currentAdmin?.username });
      setPlayers(prev => prev.map(p => (p.xnId === xnId ? result.player : p)));
      if (result.notification) setNotifications(prev => [result.notification as AppNotification, ...prev]);
      showToast(result.message || 'Telemetry calibrated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to calibrate telemetry', 'error');
      throw err;
    }
  };

  const sendNotification: AppContextType['sendNotification'] = async (payload) => {
    try {
      const result = await api.sendNotification({ ...payload, sender: currentAdmin?.displayName });
      setNotifications(prev => [result.notification, ...prev]);
      showToast('Notification dispatched', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch notification', 'error');
      throw err;
    }
  };

  const createEvent: AppContextType['createEvent'] = async (eventData) => {
    try {
      const result = await api.createEvent({ ...eventData, createdBy: currentAdmin?.displayName });
      setEvents(prev => [result.event, ...prev]);
      showToast('Academy event published', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to publish event', 'error');
      throw err;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const ok = await api.deleteEvent(id, currentAdmin?.username);
      if (ok) {
        setEvents(prev => prev.filter(e => e.id !== id));
        showToast('Event removed', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to remove event', 'error');
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  const openNotificationModal = () => setNotificationModalOpen(true);
  const closeNotificationModal = () => setNotificationModalOpen(false);

  const markNotificationAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    try {
      await api.markNotificationAsRead(id);
    } catch (err) {
      console.warn('[XN Protocol] markNotificationAsRead failed:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await api.markAllNotificationsAsRead(currentPlayer?.xnId);
    } catch (err) {
      console.warn('[XN Protocol] markAllNotificationsAsRead failed:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await api.deleteNotification(id);
    } catch (err) {
      console.warn('[XN Protocol] deleteNotification failed:', err);
    }
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
        logout,
        registerPlayer,
        updateProfile,
        updateAvatar,
        createSubmission,
        approveSubmission,
        flagSubmission,
        rejectSubmission,
        triggerRankCelebration,
        closeCelebration,
        showToast,
        notifications,
        events,
        deviceNotificationPermission,
        requestDeviceNotificationPermission,
        refreshPlayers,
        refreshEvents,
        refreshNotifications,
        addPlayerToAcademy,
        removePlayerFromAcademy,
        calibratePlayerTelemetry,
        sendNotification,
        createEvent,
        deleteEvent,
        unreadNotificationsCount,
        notificationModalOpen,
        openNotificationModal,
        closeNotificationModal,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification
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
