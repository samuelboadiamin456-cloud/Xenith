import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Zap, 
  ShieldCheck, 
  Image as ImageIcon,
  Scan,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateSubmissionScore } from '../data/rankConfigs';
import { SubmissionStats } from '../types';

export const SubmitSitrepView: React.FC = () => {
  const { currentPlayer, createSubmission, setActiveView, showToast, openAuthModal } = useApp();

  const [stats, setStats] = useState<SubmissionStats>({
    kills: 14,
    wins: 2,
    matches: 3,
    kd: 3.5,
    winRate: 66.7
  });

  const [evidencePreview, setEvidencePreview] = useState<string | null>(
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop'
  );
  const [isScanning, setIsScanning] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);

  const scoreBreakdown = calculateSubmissionScore(stats);

  const sampleEvidence = [
    {
      title: 'Competitive Match 1 (High K/D)',
      url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
      stats: { kills: 18, wins: 3, matches: 4, kd: 4.5, winRate: 75.0 }
    },
    {
      title: 'Tournament Finals (Sniper Ace)',
      url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop',
      stats: { kills: 24, wins: 2, matches: 3, kd: 6.0, winRate: 66.7 }
    },
    {
      title: 'Scrim Session (Flagged Anomaly Test)',
      url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800&auto=format&fit=crop',
      stats: { kills: 42, wins: 2, matches: 2, kd: 21.0, winRate: 100.0 }
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setEvidencePreview(result);
      runOcrSimulation(result, {
        kills: Math.floor(8 + Math.random() * 16),
        wins: Math.floor(1 + Math.random() * 3),
        matches: Math.floor(2 + Math.random() * 3),
        kd: parseFloat((2.0 + Math.random() * 3.5).toFixed(2)),
        winRate: parseFloat((50 + Math.random() * 35).toFixed(1))
      });
    };
    reader.readAsDataURL(file);
  };

  const runOcrSimulation = (imgUrl: string, targetStats: SubmissionStats) => {
    setIsScanning(true);
    setOcrStatus('Analyzing match screenshot telemetry...');

    setTimeout(() => {
      setOcrStatus('Extracting kill counter, match outcome, and K/D performance vectors...');
    }, 600);

    setTimeout(() => {
      setStats(targetStats);
      setIsScanning(false);
      setOcrStatus('OCR Analysis Complete! Telemetry populated below.');
      showToast('Telemetry extracted successfully', 'success');
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSubmission(stats, evidencePreview || undefined);
    setActiveView('dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-6 text-center sm:text-left">
        <span className="font-mono text-xs font-bold text-cyan-400 tracking-[0.2em] uppercase block mb-1">
          VERIFIED SITREP SUBMISSION
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
          SUBMIT YOUR <span className="text-orange-400">PERFORMANCE.</span>
        </h1>
        <p className="font-body text-sm text-slate-400 mt-1">
          Upload match evidence, inspect extracted statistics, and transmit your SITREP to the Academy Review Desk.
        </p>
      </div>

      {/* Authenticated Identity Banner */}
      {currentPlayer ? (
        <div className="bg-[#0e141d] border-l-4 border-l-cyan-400 border-t border-r border-b border-slate-800 p-4 rounded-r-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-display font-black">
              {currentPlayer.displayName.charAt(0)}
            </div>
            <div>
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block">
                AUTHENTICATED OPERATIVE SESSION
              </span>
              <p className="font-mono text-sm font-bold text-white">
                {currentPlayer.displayName} · <span className="text-cyan-400">{currentPlayer.xnId}</span>
              </p>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" /> SECURE SESSION
          </span>
        </div>
      ) : (
        <div className="bg-[#14120e] border-l-4 border-l-amber-500 border-t border-r border-b border-slate-800 p-4 rounded-r-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] text-amber-400 uppercase tracking-wider block font-bold">
              UNAUTHENTICATED SESSION
            </span>
            <p className="font-body text-xs text-slate-300">
              Claim or sign in to your permanent XN-ID to ensure match score and XP are tied to your official record.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 font-mono text-xs font-bold rounded cursor-pointer transition-colors"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="px-3.5 py-1.5 bg-[#f4a261] hover:bg-[#ffb378] text-[#2b1400] font-display font-black text-xs uppercase rounded cursor-pointer transition-all shadow-[0_0_10px_rgba(244,162,97,0.3)]"
            >
              Claim XN-ID
            </button>
          </div>
        </div>
      )}

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="bg-[#0b0f15] border border-slate-800 rounded-xl p-6 sm:p-8 space-y-8 shadow-2xl">
        
        {/* Step 1: Upload Evidence & OCR Scanner */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-slate-200 uppercase flex items-center gap-2">
              <Scan className="w-4 h-4 text-cyan-400" />
              1. Screenshot Evidence & OCR Recognition
            </span>
            {isScanning && (
              <span className="font-mono text-xs text-cyan-400 animate-pulse flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Scanning...
              </span>
            )}
          </div>

          {/* Upload Dropzone */}
          <div className="relative border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-6 text-center transition-colors bg-slate-900/40 group">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            
            {evidencePreview ? (
              <div className="space-y-3">
                <div className="relative max-h-56 mx-auto rounded-lg overflow-hidden border border-slate-700 shadow-md">
                  <img
                    src={evidencePreview}
                    alt="Submitted Evidence"
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                    <span className="font-mono text-xs text-cyan-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" /> Click or drop new screenshot to replace
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-2">
                <Upload className="w-8 h-8 text-cyan-400 mx-auto group-hover:scale-110 transition-transform" />
                <p className="font-mono text-xs font-bold text-white uppercase">
                  Drag & Drop Match Screenshot or Click to Browse
                </p>
                <p className="font-body text-xs text-slate-400">
                  Supports PNG, JPG, WEBP. Telemetry will be scanned automatically.
                </p>
              </div>
            )}
          </div>

          {/* OCR Feedback */}
          {ocrStatus && (
            <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-lg flex items-center justify-between text-xs font-mono text-cyan-300">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                {ocrStatus}
              </span>
            </div>
          )}

          {/* Quick Preset Samples */}
          <div className="space-y-1.5 pt-2">
            <span className="font-mono text-[11px] text-slate-400 uppercase block">
              Or test with preset match evidence:
            </span>
            <div className="flex flex-wrap gap-2">
              {sampleEvidence.map((sample, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setEvidencePreview(sample.url);
                    runOcrSimulation(sample.url, sample.stats);
                  }}
                  className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500 text-[11px] font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2: Telemetry Values (Editable) */}
        <div className="space-y-4 pt-4 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold text-slate-200 uppercase flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-400" />
              2. Match Telemetry Metrics
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              Official lifetime telemetry is locked & calibrated by Academy Staff upon review
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block font-mono text-[11px] text-slate-400 uppercase mb-1">
                Kills
              </label>
              <input
                type="number"
                min="0"
                value={stats.kills}
                onChange={(e) => setStats({ ...stats, kills: parseInt(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded font-mono text-sm text-white outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] text-slate-400 uppercase mb-1">
                Wins
              </label>
              <input
                type="number"
                min="0"
                value={stats.wins}
                onChange={(e) => setStats({ ...stats, wins: parseInt(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded font-mono text-sm text-emerald-400 outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] text-slate-400 uppercase mb-1">
                Matches
              </label>
              <input
                type="number"
                min="1"
                value={stats.matches}
                onChange={(e) => setStats({ ...stats, matches: parseInt(e.target.value) || 1 })}
                className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded font-mono text-sm text-white outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] text-slate-400 uppercase mb-1">
                K/D Ratio
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={stats.kd}
                onChange={(e) => setStats({ ...stats, kd: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded font-mono text-sm text-cyan-400 outline-none"
                required
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block font-mono text-[11px] text-slate-400 uppercase mb-1">
                Win Rate %
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={stats.winRate}
                onChange={(e) => setStats({ ...stats, winRate: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded font-mono text-sm text-amber-400 outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Step 3: Projected XP Reward Card */}
        <div className="bg-slate-900/80 border border-cyan-500/30 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-slate-300 font-bold uppercase">
              Projected Performance XP
            </span>
            <span className="font-mono text-xl font-black text-cyan-400">
              +{scoreBreakdown.total} XP
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            <div>Kills (5 XP/ea): <b className="text-white">+{scoreBreakdown.killsXp} XP</b></div>
            <div>Wins (25 XP/ea): <b className="text-white">+{scoreBreakdown.winBonus} XP</b></div>
            <div>K/D Rating (15 XP/pt): <b className="text-white">+{scoreBreakdown.kdBonus} XP</b></div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-4 bg-[#f4a261] hover:bg-[#ffb378] active:translate-y-0.5 text-[#2b1400] font-display font-black text-base uppercase tracking-wider chamfer-btn transition-all duration-150 shadow-[0_0_25px_rgba(244,162,97,0.4)] flex items-center justify-center gap-2 cursor-pointer"
        >
          <Zap className="w-5 h-5" />
          Send SITREP For Review →
        </button>
      </form>
    </div>
  );
};
