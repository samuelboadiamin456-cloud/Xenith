import React from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[XN Protocol Uncaught UI Error]:', error, errorInfo);
  }

  private handleReset = (): void => {
    try {
      localStorage.removeItem('xn_academy_submissions_v1');
      localStorage.removeItem('xn_academy_logs_v1');
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleClearAndHome = (): void => {
    try {
      localStorage.removeItem('xn_academy_submissions_v1');
      localStorage.removeItem('xn_academy_logs_v1');
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080a0d] text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0d1218] border border-cyan-500/30 rounded-2xl p-6 sm:p-8 space-y-6 text-center shadow-[0_0_40px_rgba(56,189,248,0.2)]">
            <div className="w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <span className="font-mono text-[10px] font-bold text-red-400 uppercase tracking-widest block">
                SYSTEM INTERRUPT RECOVERED
              </span>
              <h2 className="font-display text-2xl font-black text-white uppercase">
                Operative HUD Restored
              </h2>
              <p className="font-mono text-xs text-slate-400 leading-relaxed">
                A telemetry glitch occurred. The protocol intercepted the error safely without compromising your clearance records.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-left font-mono text-[11px] text-slate-400 max-h-24 overflow-y-auto">
                <span className="text-red-400 font-bold block mb-1">Diagnostic Log:</span>
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.3)]"
              >
                <RefreshCw className="w-4 h-4" />
                Reload HUD
              </button>

              <button
                onClick={this.handleClearAndHome}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-bold uppercase rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
