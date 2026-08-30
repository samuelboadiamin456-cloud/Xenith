import { Player, Submission, AuditLog, AdminStats, SubmissionStats, AdminUser, AdminRequest, AppNotification, AcademyEvent } from '../types';

const ADMIN_TOKEN_KEY = 'xn_academy_admin_token_v1';

function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}
function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}
export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
function authHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Check backend health
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch('/api/health');
      return res.ok;
    } catch {
      return false;
    }
  },

  // Database Full State Synchronization
  async getFullState(): Promise<{
    players: Player[];
    submissions: Submission[];
    auditLogs: AuditLog[];
    adminStatus: { hasInitialAdmin: boolean; totalAdmins: number; pendingRequestsCount: number };
    admins: AdminUser[];
    adminRequests: AdminRequest[];
    notifications: AppNotification[];
    events: AcademyEvent[];
    serverTimestamp: string;
  } | null> {
    try {
      const res = await fetch('/api/sync/full-state');
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn('[API] getFullState error', err);
      return null;
    }
  },

  async clientMergeSync(payload: { players?: Player[]; submissions?: Submission[] }): Promise<{
    players: Player[];
    submissions: Submission[];
    auditLogs: AuditLog[];
    notifications: AppNotification[];
    events: AcademyEvent[];
  } | null> {
    try {
      const res = await fetch('/api/sync/client-merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn('[API] clientMergeSync error', err);
      return null;
    }
  },

  // Players API
  async getPlayers(params?: { role?: string; rank?: string; sort?: string }): Promise<Player[]> {
    try {
      const query = new URLSearchParams();
      if (params?.role && params.role !== 'ALL') query.set('role', params.role);
      if (params?.rank && params.rank !== 'ALL') query.set('rank', params.rank);
      if (params?.sort) query.set('sort', params.sort);

      const res = await fetch(`/api/players?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch players');
      const data = await res.json();
      return data.players || [];
    } catch (err) {
      console.warn('[API] getPlayers fallback to local state', err);
      return [];
    }
  },

  async getPlayer(identifier: string): Promise<Player | null> {
    try {
      const res = await fetch(`/api/players/${encodeURIComponent(identifier)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.player || null;
    } catch (err) {
      console.warn('[API] getPlayer error', err);
      return null;
    }
  },

  async registerPlayer(playerData: {
    username: string;
    email: string;
    password?: string;
    displayName: string;
    ign: string;
    role: Player['role'];
    country?: string;
    bio?: string;
    avatarUrl?: string;
  }): Promise<{ player: Player; auditLog?: AuditLog }> {
    const res = await fetch('/api/players/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playerData)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to register operative');
    }

    return await res.json();
  },

  async loginPlayer(identifier: string, password?: string): Promise<{ player: Player; message: string }> {
    const res = await fetch('/api/players/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Authentication failed');
    }

    return await res.json();
  },

  async updatePlayer(xnId: string, updatedData: Partial<Player>): Promise<Player> {
    const res = await fetch(`/api/players/${encodeURIComponent(xnId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });

    if (!res.ok) {
      throw new Error('Failed to update player specs');
    }

    const data = await res.json();
    return data.player;
  },

  // Submissions API
  async getSubmissions(params?: { status?: string; xnId?: string; mode?: string }): Promise<Submission[]> {
    try {
      const query = new URLSearchParams();
      if (params?.status && params.status !== 'ALL') query.set('status', params.status);
      if (params?.xnId) query.set('xnId', params.xnId);
      if (params?.mode && params.mode !== 'ALL') query.set('mode', params.mode);

      const res = await fetch(`/api/submissions?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch submissions');
      const data = await res.json();
      return data.submissions || [];
    } catch (err) {
      console.warn('[API] getSubmissions error', err);
      return [];
    }
  },

  async createSubmission(payload: {
    xnId: string;
    playerName?: string;
    playerIgn?: string;
    stats: SubmissionStats;
    mode?: 'BR' | 'SF' | 'CUSTOM';
    evidenceUrl?: string;
  }): Promise<{ submission: Submission; auditLog?: AuditLog }> {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error('Failed to submit performance report');
    }

    return await res.json();
  },

  async scanSitrepOcr(data: {
    image: string;
    mode: 'BR' | 'SF' | 'CUSTOM';
  }): Promise<{
    success: boolean;
    valid: boolean;
    rejectionReason?: string;
    mode: 'BR' | 'SF' | 'CUSTOM';
    extracted?: {
      highlightedIgn: string;
      kills: number;
      assists?: number;
      deaths?: number;
      damage: number;
      placement?: number;
      placementText?: string;
      outcome?: 'Victory' | 'Defeat';
      cash?: number;
      teamFormat?: string;
    };
    scoreBreakdown?: any;
    message?: string;
  }> {
    const res = await fetch('/api/ocr/scan-sitrep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'OCR server request failed');
    }

    return await res.json();
  },

  async approveSubmission(id: string): Promise<{ submission: Submission; player?: Player; auditLog?: AuditLog }> {
    const res = await fetch(`/api/submissions/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to approve submission');
    }

    return await res.json();
  },

  async flagSubmission(id: string): Promise<{ submission: Submission; auditLog?: AuditLog }> {
    const res = await fetch(`/api/submissions/${encodeURIComponent(id)}/flag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to flag submission');
    }

    return await res.json();
  },

  async rejectSubmission(id: string, reason: string): Promise<{ submission: Submission; auditLog?: AuditLog }> {
    const res = await fetch(`/api/submissions/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ reason })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to reject submission');
    }

    return await res.json();
  },

  // Audit Logs API
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const res = await fetch('/api/audit-logs');
      if (!res.ok) return [];
      const data = await res.json();
      return data.auditLogs || [];
    } catch {
      return [];
    }
  },

  // Admin Stats API
  async getAdminStats(): Promise<AdminStats | null> {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // --- ADMIN AUTH & APPROVAL APIS ---
  async getAdminStatus(): Promise<{ hasInitialAdmin: boolean; totalAdmins: number; pendingRequestsCount: number }> {
    try {
      const res = await fetch('/api/admin/status');
      if (!res.ok) return { hasInitialAdmin: false, totalAdmins: 0, pendingRequestsCount: 0 };
      return await res.json();
    } catch {
      return { hasInitialAdmin: false, totalAdmins: 0, pendingRequestsCount: 0 };
    }
  },

  async bootstrapFirstAdmin(data: {
    username: string;
    email: string;
    password: string;
    displayName: string;
  }): Promise<{ admin: AdminUser; auditLog?: AuditLog }> {
    const res = await fetch('/api/admin/bootstrap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to initialize Head of Command');
    }

    const result = await res.json();
    if (result.token) setAdminToken(result.token);
    return result;
  },

  async requestAdminAccess(data: {
    username: string;
    email: string;
    password: string;
    displayName: string;
    reason?: string;
  }): Promise<{ message: string; request: AdminRequest }> {
    const res = await fetch('/api/admin/request-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to submit clearance application');
    }

    return await res.json();
  },

  async loginAdmin(identifier: string, password: string): Promise<{ admin: AdminUser; message: string }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Admin authentication failed');
    }

    const result = await res.json();
    if (result.token) setAdminToken(result.token);
    return result;
  },

  async getAdminRequests(): Promise<AdminRequest[]> {
    try {
      const res = await fetch('/api/admin/requests', { headers: authHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.requests || [];
    } catch {
      return [];
    }
  },

  async approveAdminRequest(id: string): Promise<{ message: string; request: AdminRequest; newAdmin: AdminUser }> {
    const res = await fetch(`/api/admin/requests/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to approve clearance request');
    }

    return await res.json();
  },

  async rejectAdminRequest(id: string): Promise<{ message: string; request: AdminRequest }> {
    const res = await fetch(`/api/admin/requests/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to reject clearance request');
    }

    return await res.json();
  },

  async getAdmins(): Promise<AdminUser[]> {
    try {
      const res = await fetch('/api/admin/list', { headers: authHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.admins || [];
    } catch {
      return [];
    }
  },

  // --- HEAD OF COMMAND (HoC) SUPREME CONTROLS ---
  async resetAllRanks(hocUsername?: string, reason?: string): Promise<{ message: string; resetCount: number; auditLog?: AuditLog }> {
    const res = await fetch('/api/admin/hoc/reset-all-ranks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hocUsername, reason })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to execute network rank reset');
    }

    return await res.json();
  },

  async resetPlayerRank(xnId: string, hocUsername?: string, reason?: string): Promise<{ message: string; player: Player; auditLog?: AuditLog }> {
    const res = await fetch('/api/admin/hoc/reset-player-rank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ xnId, hocUsername, reason })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to reset operative rank');
    }

    return await res.json();
  },

  async deductXp(xnId: string, amount: number, hocUsername?: string, reason?: string): Promise<{ message: string; player: Player; auditLog?: AuditLog }> {
    const res = await fetch('/api/admin/hoc/deduct-xp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ xnId, amount, hocUsername, reason })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to deduct operative XP');
    }

    return await res.json();
  },

  // --- ADMIN REWARD (50 XP) ---
  async rewardPlayer(xnId: string, adminUsername: string, amount: number = 50, reason?: string): Promise<{ message: string; player: Player; auditLog?: AuditLog }> {
    const res = await fetch('/api/admin/reward-player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ xnId, adminUsername, amount, reason })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to reward operative');
    }

    return await res.json();
  },

  // --- ACADEMY OPERATIONS: ADD & REMOVE PLAYERS ---
  async addPlayerToAcademy(playerData: {
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
    adminUsername?: string;
  }): Promise<{ message: string; player: Player; auditLog?: AuditLog }> {
    const res = await fetch('/api/admin/players/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(playerData)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to add operative to academy');
    }

    return await res.json();
  },

  async removePlayerFromAcademy(xnId: string, reason: string, adminUsername?: string): Promise<{ message: string; removedXnId: string; auditLog?: AuditLog }> {
    const res = await fetch(`/api/admin/players/${encodeURIComponent(xnId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ reason, adminUsername })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to remove operative from academy');
    }

    return await res.json();
  },

  // --- LOCK & CALIBRATE TELEMETRY METRIC (BASED ON PLAYER REPORT) ---
  async calibratePlayerTelemetry(xnId: string, data: {
    kills?: number;
    wins?: number;
    matches?: number;
    kd?: number;
    winRate?: number;
    reportTicket?: string;
    reason?: string;
    adminUsername?: string;
    recalculateXp?: boolean;
  }): Promise<{ message: string; player: Player; notification?: AppNotification; auditLog?: AuditLog }> {
    const res = await fetch(`/api/admin/players/${encodeURIComponent(xnId)}/calibrate-telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to calibrate telemetry metrics');
    }

    return await res.json();
  },

  // --- NOTIFICATIONS API ---
  async getNotifications(recipientXnId?: string): Promise<AppNotification[]> {
    try {
      const query = recipientXnId ? `?recipientXnId=${encodeURIComponent(recipientXnId)}` : '';
      const res = await fetch(`/api/notifications${query}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.notifications || [];
    } catch {
      return [];
    }
  },

  async sendNotification(payload: {
    recipientXnId?: string;
    title: string;
    message: string;
    type?: AppNotification['type'];
    priority?: AppNotification['priority'];
    linkView?: string;
    sender?: string;
  }): Promise<{ message: string; notification: AppNotification; auditLog?: AuditLog }> {
    const res = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to dispatch notification');
    }

    return await res.json();
  },

  async markNotificationAsRead(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
        method: 'POST'
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async markAllNotificationsAsRead(recipientXnId?: string): Promise<boolean> {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientXnId })
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteNotification(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/notifications/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // --- ACADEMY EVENTS API ---
  async getEvents(): Promise<AcademyEvent[]> {
    try {
      const res = await fetch('/api/events');
      if (!res.ok) return [];
      const data = await res.json();
      return data.events || [];
    } catch {
      return [];
    }
  },

  async createEvent(eventData: {
    title: string;
    eventType: AcademyEvent['eventType'];
    description: string;
    rewardXp: number;
    scheduledDate: string;
    targetRank?: string;
    targetRole?: string;
    createdBy?: string;
    broadcastPush?: boolean;
  }): Promise<{ message: string; event: AcademyEvent; auditLog?: AuditLog }> {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(eventData)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to publish academy event');
    }

    return await res.json();
  },

  async deleteEvent(id: string, adminUsername?: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ adminUsername })
      });
      return res.ok;
    } catch {
      return false;
    }
  }
};
