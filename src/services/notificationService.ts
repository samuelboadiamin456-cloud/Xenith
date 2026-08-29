// Browser Web Notifications & Tactical Chime Service for XN Academy

export interface DeviceNotificationOptions {
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}

class NotificationService {
  private hasNotificationApi(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationPermission {
    if (!this.hasNotificationApi()) return 'denied';
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.hasNotificationApi()) return 'denied';
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        this.playTacticalChime(true);
        this.sendDeviceNotification('XN ACADEMY NOTIFICATIONS ACTIVATED', {
          body: 'Your device is now synchronized with Academy Command alerts, match SITREPs, and operational events.',
          icon: '/logo.jpg'
        });
      }
      return result;
    } catch (err) {
      console.warn('Failed to request notification permission:', err);
      return 'denied';
    }
  }

  public sendDeviceNotification(title: string, options: DeviceNotificationOptions): boolean {
    if (!this.hasNotificationApi() || Notification.permission !== 'granted') {
      return false;
    }

    try {
      const notif = new Notification(title, {
        body: options.body,
        icon: options.icon || '/logo.jpg',
        badge: options.badge || '/logo.jpg',
        tag: options.tag || `xn-notif-${Date.now()}`,
        data: options.data,
        requireInteraction: options.requireInteraction ?? false
      });

      this.playTacticalChime();

      notif.onclick = () => {
        window.focus();
        notif.close();
      };

      return true;
    } catch (err) {
      console.warn('Could not display device notification:', err);
      return false;
    }
  }

  // Pure Web Audio API synthesized tactical audio cue
  public playTacticalChime(isActivation: boolean = false) {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (isActivation) {
        // Futuristic double pulse
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.25);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        // Crisp notification ping
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {
      // Audio not permitted or unavailable; silent graceful fallback
    }
  }
}

export const notificationService = new NotificationService();
