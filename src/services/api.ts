import { Player, Submission, AuditLog, AdminStats, SubmissionStats } from '../types';

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
    displayName: string;
    ign: string;
    role: Player['role'];
    country?: string;
    bio?: string;
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
  async getSubmissions(params?: { status?: string; xnId?: string }): Promise<Submission[]> {
    try {
      const query = new URLSearchParams();
      if (params?.status && params.status !== 'ALL') query.set('status', params.status);
      if (params?.xnId) query.set('xnId', params.xnId);

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

  async approveSubmission(id: string): Promise<{ submission: Submission; player?: Player; auditLog?: AuditLog }> {
    const res = await fetch(`/api/submissions/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      throw new Error('Failed to approve submission');
    }

    return await res.json();
  },

  async flagSubmission(id: string): Promise<{ submission: Submission; auditLog?: AuditLog }> {
    const res = await fetch(`/api/submissions/${encodeURIComponent(id)}/flag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      throw new Error('Failed to flag submission');
    }

    return await res.json();
  },

  async rejectSubmission(id: string, reason: string): Promise<{ submission: Submission; auditLog?: AuditLog }> {
    const res = await fetch(`/api/submissions/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });

    if (!res.ok) {
      throw new Error('Failed to reject submission');
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
  }
};
