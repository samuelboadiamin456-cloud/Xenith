import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Share, 
  PlusSquare, 
  Smartphone, 
  Laptop, 
  Check, 
  X, 
  Sparkles,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onInstallSuccess: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallSuccess
}) => {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if already in standalone / installed mode
    const standaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(Boolean(standaloneMode));
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        onInstallSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Install prompt error:', err);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0d1218] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(56,189,248,0.2)] overflow-hidden">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black border border-cyan-500/40 p-1 flex items-center justify-center shadow-[0_0_12px_rgba(56,189,248,0.3)]">
              <img 
                src="/logo.jpg" 
                alt="XN Logo" 
                className="w-full h-full object-contain rounded"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="font-display font-black text-sm text-white tracking-wide">
                INSTALL XN NETWORK APP
              </h3>
              <p className="font-mono text-[10px] text-cyan-400 font-bold uppercase">
                Direct Device Deployment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {isStandalone ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-display font-black text-white text-base">
                App Already Installed!
              </h4>
              <p className="font-mono text-xs text-slate-400 max-w-xs mx-auto">
                You are currently running the dedicated XN Academy standalone web app on your device homescreen.
              </p>
            </div>
          ) : deferredPrompt ? (
            /* Direct 1-Click Installation (Android / Chrome / Edge) */
            <div className="space-y-4">
              <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Instant Fast Access
                </div>
                <p className="font-mono text-[11px] text-slate-300 leading-relaxed">
                  Install the official XN Academy app directly to your home screen or desktop. Runs full-screen with offline caching, high performance, and quick SITREP submissions.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Homescreen Icon</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Full Screen Mode</span>
                </div>
              </div>

              <button
                onClick={handleInstallClick}
                disabled={installing}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {installing ? 'INSTALLING...' : 'ADD TO HOMESCREEN NOW'}
              </button>
            </div>
          ) : isIOS ? (
            /* iOS Safari Instructions */
            <div className="space-y-4">
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-bold">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  iOS Safari Installation Guide
                </div>
                <p className="font-mono text-[11px] text-slate-300">
                  Apple iOS requires adding web apps via Safari's Share menu:
                </p>
              </div>

              <div className="space-y-2.5 font-mono text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                  <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center font-bold text-cyan-400 shrink-0">
                    1
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Tap the</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold border border-slate-700">
                      <Share className="w-3.5 h-3.5" /> Share
                    </span>
                    <span>button in Safari</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                  <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center font-bold text-cyan-400 shrink-0">
                    2
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Scroll and tap</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold border border-slate-700">
                      <PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                  <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center font-bold text-cyan-400 shrink-0">
                    3
                  </div>
                  <span>Confirm by tapping <b>Add</b> in the top right corner.</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
              >
                GOT IT
              </button>
            </div>
          ) : (
            /* Generic / Desktop Browser Instructions */
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold">
                  <Laptop className="w-4 h-4 text-cyan-400" />
                  Desktop or Browser Installation
                </div>
                <p className="font-mono text-[11px] text-slate-300 leading-relaxed">
                  You can install XN Academy directly from your browser:
                </p>
              </div>

              <div className="space-y-2 font-mono text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">
                    •
                  </div>
                  <span>Look for the <b>Install App</b> (computer/download icon) in your browser's address bar.</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">
                    •
                  </div>
                  <span>Or open your browser menu (⋮ / ⋯) and select <b>"Install XN Academy"</b> or <b>"Create Shortcut"</b>.</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-black text-xs uppercase rounded-xl transition-colors cursor-pointer"
              >
                UNDERSTOOD
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
