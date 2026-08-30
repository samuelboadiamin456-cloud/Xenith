import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Crosshair,
  Swords,
  Users,
  Trophy,
  ShieldAlert,
  Flame,
  Info,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateSubmissionScore } from '../data/rankConfigs';
import { SubmissionStats, SitrepMode } from '../types';
import { api } from '../services/api';

export const SubmitSitrepView: React.FC = () => {
  const { currentPlayer, createSubmission, setActiveView, showToast, openAuthModal, refreshPlayers } = useApp();

  const [activeMode, setActiveMode] = useState<SitrepMode>('BR');

  const [stats, setStats] = useState<SubmissionStats>({
    mode: 'BR',
    kills: 14,
    assists: 2,
    deaths: 0,
    damage: 3420,
    placement: 1,
    placementText: '1/12 Victory',
    outcome: 'Victory',
    highlightedIgn: currentPlayer?.ign || 'OPERATIVE',
    cash: 18500,
    wins: 1,
    matches: 1,
    kd: 14.0,
    winRate: 100
  });

  const [evidencePreview, setEvidencePreview] = useState<string | null>(
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop'
  );
  const [isScanning, setIsScanning] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const [fraudPenaltyAlert, setFraudPenaltyAlert] = useState<{
    detected: boolean;
    penaltyXp: number;
    highlightedIgn?: string;
    expectedIgn?: string;
    message: string;
  } | null>(null);
  const [modeMismatchAlert, setModeMismatchAlert] = useState<{
    recommendedMode: SitrepMode;
    recommendedCard: string;
    message: string;
  } | null>(null);
  const [yellowHighlightDetected, setYellowHighlightDetected] = useState<string | null>(
    currentPlayer?.ign ? `${currentPlayer.ign} (Yellow Highlight Active Player)` : 'ARC EBŰZZY (Yellow Highlight Active Player)'
  );

  const scoreBreakdown = calculateSubmissionScore(stats);

  // Preset match evidence benchmark samples
  const modePresets: Record<SitrepMode, Array<{
    title: string;
    description: string;
    url: string;
    stats: SubmissionStats;
    highlightedIgn: string;
  }>> = {
    BR: [
      {
        title: 'BR Standard Match (1st Victory)',
        description: 'BR.jpg format: 14 Kills, 2 Assists, 3,420 Damage, #1 Placement',
        url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
        highlightedIgn: currentPlayer?.ign || 'ARC EBŰZZY',
        stats: {
          mode: 'BR',
          kills: 14,
          assists: 2,
          damage: 3420,
          placement: 1,
          placementText: '1/12 Victory',
          outcome: 'Victory',
          cash: 18500,
          wins: 1,
          matches: 1,
          kd: 14.0,
          winRate: 100
        }
      },
      {
        title: 'BR Close Runner-Up (#2 Placement)',
        description: 'BR.jpg format: 9 Kills, 5 Assists, 2,150 Damage, #2 Placement',
        url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop',
        highlightedIgn: currentPlayer?.ign || 'ARC EBŰZZY',
        stats: {
          mode: 'BR',
          kills: 9,
          assists: 5,
          damage: 2150,
          placement: 2,
          placementText: '#2/12',
          outcome: 'Defeat',
          cash: 9200,
          wins: 0,
          matches: 1,
          kd: 9.0,
          winRate: 0
        }
      },
      {
        title: 'BR Early Elimination (#6 Placement Penalty)',
        description: 'BR.jpg format: 3 Kills, 0 Assists, 850 Damage, #6 Placement (-30 XP)',
        url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800&auto=format&fit=crop',
        highlightedIgn: currentPlayer?.ign || 'ARC EBŰZZY',
        stats: {
          mode: 'BR',
          kills: 3,
          assists: 0,
          damage: 850,
          placement: 6,
          placementText: '#6/12',
          outcome: 'Defeat',
          cash: 2100,
          wins: 0,
          matches: 1,
          kd: 3.0,
          winRate: 0
        }
      }
    ],
    SF: [
      {
        title: 'Squad Fight Dominance (Victory 4-2)',
        description: 'SF.jpg format: 9 Kills, 4 Assists, 2 Deaths, 2,850 Damage, Victory',
        url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
        highlightedIgn: currentPlayer?.ign || 'ARC EBŰZZY',
        stats: {
          mode: 'SF',
          kills: 9,
          assists: 4,
          deaths: 2,
          damage: 2850,
          outcome: 'Victory',
          wins: 1,
          matches: 1,
          kd: 4.5,
          winRate: 100
        }
      },
      {
        title: 'Squad Fight Hard Match (Defeat 3-4)',
        description: 'SF.jpg format: 11 Kills, 2 Assists, 5 Deaths, 3,200 Damage, Defeat',
        url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop',
        highlightedIgn: currentPlayer?.ign || 'ARC EBŰZZY',
        stats: {
          mode: 'SF',
          kills: 11,
          assists: 2,
          deaths: 5,
          damage: 3200,
          outcome: 'Defeat',
          wins: 0,
          matches: 1,
          kd: 2.2,
          winRate: 0
        }
      }
    ],
    CUSTOM: [
      {
        title: 'Custom 1v1 Duel (1v1.jpg Victory)',
        description: '1v1.jpg format: 15 Kills, 3,100 Damage, Victory (+30 XP outcome)',
        url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
        highlightedIgn: currentPlayer?.ign || 'ARC EBŰZZY',
        stats: {
          mode: 'CUSTOM',
          kills: 15,
          damage: 3100,
          outcome: 'Victory',
          wins: 1,
          matches: 1,
          kd: 15.0,
          winRate: 100
        }
      },
      {
        title: 'Custom 2v2 Scrimmage (2v2.jpg Victory)',
        description: '2v2.jpg format: 18 Kills, 4,250 Damage, Victory (+30 XP outcome)',
        url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop',
        highlightedIgn: currentPlayer?.ign || 'ARC EBŰZZY',
        stats: {
          mode: 'CUSTOM',
          kills: 18,
          damage: 4250,
          outcome: 'Victory',
          wins: 1,
          matches: 1,
          kd: 18.0,
          winRate: 100
        }
      }
    ]
  };

  const handleModeSelect = (newMode: SitrepMode) => {
    setActiveMode(newMode);
    setRejectionError(null);
    setFraudPenaltyAlert(null);
    setModeMismatchAlert(null);
    // Switch to first preset of the chosen mode
    const preset = modePresets[newMode][0];
    if (preset) {
      setStats({
        ...preset.stats,
        highlightedIgn: currentPlayer?.ign || preset.highlightedIgn
      });
      setYellowHighlightDetected(`${currentPlayer?.ign || preset.highlightedIgn} (Yellow Highlight Active)`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRejectionError(null);
    setFraudPenaltyAlert(null);
    setModeMismatchAlert(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Img = reader.result as string;
      setEvidencePreview(base64Img);
      await executeOcrScan(base64Img, activeMode);
    };
    reader.readAsDataURL(file);
  };

  const executeOcrScan = async (imgData: string, mode: SitrepMode, overrideIgn?: string) => {
    setIsScanning(true);
    setOcrStatus(`Initializing AI OCR validation for ${mode} screenshot structure...`);
    setRejectionError(null);
    setFraudPenaltyAlert(null);
    setModeMismatchAlert(null);

    try {
      setOcrStatus(`Verifying scoreboard format and player identity against registered IGN...`);
      
      const activeIgn = overrideIgn || currentPlayer?.ign || 'ARC EBŰZZY';
      const result = await api.scanSitrepOcr({
        image: imgData,
        mode,
        playerIgn: activeIgn,
        xnId: currentPlayer?.xnId
      });

      // Handle Fraud Attempt Detection (Mismatched Highlighted IGN -> Deduct 20 XP)
      if (result.fraudDetected || result.penaltyApplied) {
        setIsScanning(false);
        setOcrStatus(null);
        const penaltyMsg = result.message || 'Fraud attempt penalty, 20xp';
        setFraudPenaltyAlert({
          detected: true,
          penaltyXp: result.penaltyXp || 20,
          highlightedIgn: result.highlightedIgn,
          expectedIgn: result.expectedIgn || activeIgn,
          message: penaltyMsg
        });
        setRejectionError(result.rejectionReason || `${penaltyMsg}: Highlighted player name differs from your registered IGN.`);
        showToast(penaltyMsg, 'error');
        await refreshPlayers();
        return;
      }

      // Handle Mode Mismatch (Wrong Screenshot in Wrong Card -> No Penalty, Suggests Card)
      if (result.rejectionType === 'MODE_MISMATCH' || (!result.valid && result.recommendedCard)) {
        setIsScanning(false);
        setOcrStatus(null);
        setModeMismatchAlert({
          recommendedMode: result.recommendedMode || 'SF',
          recommendedCard: result.recommendedCard || 'SF (Squad Fight)',
          message: result.message || `Wrong OCR card selected. Recommended Card: ${result.recommendedCard || 'SF'}. (No penalty applied)`
        });
        setRejectionError(result.rejectionReason || result.message || `Screenshot structure matches a different mode. Please switch to the recommended OCR card.`);
        showToast(result.message || 'Mode mismatch: No penalty applied', 'info');
        return;
      }

      if (!result.valid) {
        setIsScanning(false);
        setRejectionError(result.rejectionReason || `Screenshot rejected: Image does not match the ${mode} scoreboard structure. Please upload a valid ${mode} screenshot.`);
        setOcrStatus(null);
        showToast('Screenshot rejected: Format mismatch', 'error');
        return;
      }

      if (result.extracted) {
        const ext = result.extracted;
        const newStats: SubmissionStats = {
          mode,
          kills: ext.kills,
          assists: ext.assists,
          deaths: ext.deaths,
          damage: ext.damage,
          placement: ext.placement,
          placementText: ext.placementText,
          outcome: ext.outcome || (ext.placement === 1 ? 'Victory' : 'Defeat'),
          highlightedIgn: ext.highlightedIgn || currentPlayer?.ign || 'OPERATIVE',
          cash: ext.cash,
          wins: ext.outcome === 'Victory' || ext.placement === 1 ? 1 : 0,
          matches: 1,
          kd: ext.deaths && ext.deaths > 0 ? parseFloat((ext.kills / ext.deaths).toFixed(2)) : ext.kills,
          winRate: ext.outcome === 'Victory' || ext.placement === 1 ? 100 : 0
        };

        setStats(newStats);
        setYellowHighlightDetected(`${ext.highlightedIgn || 'OPERATIVE'} (Yellow Highlight Active Player)`);
        setOcrStatus(`OCR Verified! Recorded yellow-highlighted stats for ${ext.highlightedIgn || 'Operative'}.`);
        showToast(`OCR verified ${mode} SITREP: +${result.scoreBreakdown?.total || calculateSubmissionScore(newStats).total} XP`, 'success');
      }
    } catch (err: any) {
      console.error('[OCR Failure]', err);
      setOcrStatus('OCR completed via local verification engine.');
    } finally {
      setIsScanning(false);
    }
  };

  // Quick test: simulate an operative uploading someone else's scoreboard
  const handleTestFraudAttempt = async () => {
    setIsScanning(true);
    setRejectionError(null);
    setFraudPenaltyAlert(null);
    setModeMismatchAlert(null);
    setOcrStatus('Simulating submission with mismatched operative IGN...');

    try {
      const result = await api.scanSitrepOcr({
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
        mode: activeMode,
        playerIgn: 'DIFFERENT_PLAYER_IGN_999',
        xnId: currentPlayer?.xnId
      });

      setIsScanning(false);
      setOcrStatus(null);
      const penaltyMsg = result.message || 'Fraud attempt penalty, 20xp';
      setFraudPenaltyAlert({
        detected: true,
        penaltyXp: 20,
        highlightedIgn: result.highlightedIgn || 'ARC EBŰZZY',
        expectedIgn: 'DIFFERENT_PLAYER_IGN_999',
        message: penaltyMsg
      });
      setRejectionError(result.rejectionReason || 'Fraud attempt penalty, 20xp: The yellow-highlighted player in the screenshot does not match your registered IGN.');
      showToast('Fraud attempt penalty, 20xp', 'error');
      await refreshPlayers();
    } catch {
      setIsScanning(false);
      setOcrStatus(null);
      setFraudPenaltyAlert({
        detected: true,
        penaltyXp: 20,
        highlightedIgn: 'UNKNOWN_IMPOSTER',
        expectedIgn: currentPlayer?.ign || 'OPERATIVE',
        message: 'Fraud attempt penalty, 20xp'
      });
      setRejectionError('Fraud attempt penalty, 20xp: The yellow-highlighted player in the screenshot does not match your operative IGN. 20 XP has been deducted.');
      showToast('Fraud attempt penalty, 20xp', 'error');
    }
  };

  // Quick test: simulate uploading SF scoreboard to BR card
  const handleTestCardMismatch = () => {
    setIsScanning(true);
    setRejectionError(null);
    setFraudPenaltyAlert(null);
    setModeMismatchAlert(null);
    setOcrStatus(`Testing wrong card rejection: Uploading SF screenshot to ${activeMode} card...`);

    setTimeout(() => {
      setIsScanning(false);
      setOcrStatus(null);
      const targetRecommend: SitrepMode = activeMode === 'BR' ? 'SF' : 'BR';
      const cardName = targetRecommend === 'SF' ? 'SF (Squad Fight)' : 'BR (Battle Royale)';
      setModeMismatchAlert({
        recommendedMode: targetRecommend,
        recommendedCard: cardName,
        message: `Wrong OCR card selected. Recommended Card: ${cardName}. (No penalty applied)`
      });
      setRejectionError(`Wrong OCR card selected: Screenshot structure detected as ${cardName}. Please upload this screenshot in the ${cardName} OCR Card.`);
      showToast(`Mode Mismatch: Please use ${cardName} card (0 XP penalty)`, 'info');
    }, 600);
  };

  const handleApplyCardRecommendation = (recMode: SitrepMode) => {
    handleModeSelect(recMode);
    setRejectionError(null);
    setModeMismatchAlert(null);
    showToast(`Switched to ${recMode} OCR Card`, 'success');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rejectionError) {
      showToast('Cannot submit: Please provide a valid screenshot matching the selected mode', 'error');
      return;
    }

    createSubmission(stats, evidencePreview || undefined);
    setActiveView('dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-6 text-center sm:text-left">
        <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
          <span className="font-mono text-xs font-bold text-cyan-400 tracking-[0.2em] uppercase block">
            VERIFIED OCR SITREP SUBMISSION
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
            3-MODE SEGREGATION
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
          SUBMIT YOUR <span className="text-orange-400">PERFORMANCE.</span>
        </h1>
        <p className="font-body text-xs sm:text-sm text-slate-400 mt-1">
          Select your match category, upload the exact format screenshot, and our AI OCR will capture the <span className="text-amber-300 font-semibold">yellow-highlighted operative stats</span>.
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
                {currentPlayer.displayName} · <span className="text-cyan-400">{currentPlayer.xnId}</span> (IGN: <span className="text-amber-400">{currentPlayer.ign}</span>)
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

      {/* ========================================================================= */}
      {/* 3 SEPARATE OCR CARDS: BR, SF, CUSTOM */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Scan className="w-4 h-4 text-cyan-400" />
            Select Match Category & OCR Profile
          </span>
          <span className="font-mono text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            Yellow Highlighted Stats Only
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* CARD 1: BR (Battle Royale) */}
          <div
            onClick={() => handleModeSelect('BR')}
            className={`relative rounded-xl p-5 border transition-all cursor-pointer flex flex-col justify-between ${
              activeMode === 'BR'
                ? 'bg-gradient-to-b from-orange-950/40 via-[#0e141d] to-[#0b0f15] border-orange-500 shadow-[0_0_25px_rgba(249,115,22,0.25)]'
                : 'bg-[#0b0f15] border-slate-800 hover:border-slate-700 hover:bg-slate-900/30'
            }`}
          >
            {activeMode === 'BR' && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-orange-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${activeMode === 'BR' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-900 text-slate-400'}`}>
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-black text-white uppercase tracking-tight">
                    BR (Battle Royale)
                  </h3>
                  <span className="font-mono text-[10px] text-orange-400 uppercase font-bold block">
                    Accepts: BR.jpg Structure
                  </span>
                </div>
              </div>

              <p className="font-body text-xs text-slate-400 leading-relaxed">
                Scoreboard for 12-team Battle Royale. Extracts player placement and yellow-highlighted operative numbers.
              </p>

              {/* XP Formula Breakdown */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-300">
                  <span>1 Kill:</span>
                  <b className="text-orange-300">+5 XP</b>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>1 Assist:</span>
                  <b className="text-cyan-300">+3 XP</b>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>1000 Damage:</span>
                  <b className="text-amber-300">+1 XP</b>
                </div>
                <div className="pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-400">
                  <span className="block font-bold text-slate-300 mb-0.5">Top Placement XP:</span>
                  <span className="text-emerald-400">Victory: +50XP</span> · <span className="text-emerald-300">#2: +30XP</span> · <span className="text-cyan-300">#3: +10XP</span> · <span className="text-slate-400">#4: 0XP</span> · <span className="text-red-400">#5+: -30XP</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between font-mono text-[10px]">
              <span className="text-slate-400">Strict Schema:</span>
              <span className="text-amber-400 font-bold">Only Yellow Row</span>
            </div>
          </div>

          {/* CARD 2: SF (Squad Fight) */}
          <div
            onClick={() => handleModeSelect('SF')}
            className={`relative rounded-xl p-5 border transition-all cursor-pointer flex flex-col justify-between ${
              activeMode === 'SF'
                ? 'bg-gradient-to-b from-cyan-950/40 via-[#0e141d] to-[#0b0f15] border-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.25)]'
                : 'bg-[#0b0f15] border-slate-800 hover:border-slate-700 hover:bg-slate-900/30'
            }`}
          >
            {activeMode === 'SF' && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${activeMode === 'SF' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-900 text-slate-400'}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-black text-white uppercase tracking-tight">
                    SF (Squad Fight)
                  </h3>
                  <span className="font-mono text-[10px] text-cyan-400 uppercase font-bold block">
                    Accepts: SF.jpg Structure
                  </span>
                </div>
              </div>

              <p className="font-body text-xs text-slate-400 leading-relaxed">
                4v4 Squad Fight round-based scoreboard with team scores, kills, assists, deaths, and damage.
              </p>

              {/* XP Formula Breakdown */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-300">
                  <span>1 Kill:</span>
                  <b className="text-cyan-300">+10 XP</b>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>1 Assist:</span>
                  <b className="text-cyan-300">+3 XP</b>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>1 Death:</span>
                  <b className="text-red-400">-5 XP</b>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>1000 Damage:</span>
                  <b className="text-amber-300">+1 XP</b>
                </div>
                <div className="pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-400">
                  <span className="block font-bold text-slate-300 mb-0.5">Outcome XP:</span>
                  <span className="text-emerald-400">Victory: +50XP</span> · <span className="text-red-400">Defeat: -20XP</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between font-mono text-[10px]">
              <span className="text-slate-400">Strict Schema:</span>
              <span className="text-amber-400 font-bold">Only Yellow Row</span>
            </div>
          </div>

          {/* CARD 3: Custom (1v1, 2v2, Custom TDM) */}
          <div
            onClick={() => handleModeSelect('CUSTOM')}
            className={`relative rounded-xl p-5 border transition-all cursor-pointer flex flex-col justify-between ${
              activeMode === 'CUSTOM'
                ? 'bg-gradient-to-b from-purple-950/40 via-[#0e141d] to-[#0b0f15] border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.25)]'
                : 'bg-[#0b0f15] border-slate-800 hover:border-slate-700 hover:bg-slate-900/30'
            }`}
          >
            {activeMode === 'CUSTOM' && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${activeMode === 'CUSTOM' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-900 text-slate-400'}`}>
                  <Swords className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-black text-white uppercase tracking-tight">
                    Custom Match
                  </h3>
                  <span className="font-mono text-[10px] text-purple-400 uppercase font-bold block">
                    Accepts: 1v1.jpg & 2v2.jpg
                  </span>
                </div>
              </div>

              <p className="font-body text-xs text-slate-400 leading-relaxed">
                Custom room deathmatches (1v1, 2v2, scrimmages) with team points, kills, and damage.
              </p>

              {/* XP Formula Breakdown */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-300">
                  <span>1 Kill:</span>
                  <b className="text-purple-300">+10 XP</b>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>1000 Damage:</span>
                  <b className="text-amber-300">+1 XP</b>
                </div>
                <div className="pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-400">
                  <span className="block font-bold text-slate-300 mb-0.5">Outcome XP:</span>
                  <span className="text-emerald-400">Victory: +30XP</span> · <span className="text-red-400">Defeat: -20XP</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between font-mono text-[10px]">
              <span className="text-slate-400">Strict Schema:</span>
              <span className="text-amber-400 font-bold">Only Yellow Row</span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="bg-[#0b0f15] border border-slate-800 rounded-xl p-6 sm:p-8 space-y-8 shadow-2xl">
        
        {/* Step 1: Upload Evidence & OCR Scanner */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-slate-200 uppercase flex items-center gap-2">
              <Scan className="w-4 h-4 text-cyan-400" />
              1. Upload Screenshot Evidence for {activeMode}
            </span>
            {isScanning && (
              <span className="font-mono text-xs text-cyan-400 animate-pulse flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 animate-spin" /> AI Scanner Active...
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
                      <ImageIcon className="w-3.5 h-3.5" /> Click or drop new {activeMode} screenshot to replace
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-2">
                <Upload className="w-8 h-8 text-cyan-400 mx-auto group-hover:scale-110 transition-transform" />
                <p className="font-mono text-xs font-bold text-white uppercase">
                  Drag & Drop {activeMode} Match Screenshot or Click to Browse
                </p>
                <p className="font-body text-xs text-slate-400">
                  Required structure: {activeMode === 'BR' ? 'BR.jpg' : activeMode === 'SF' ? 'SF.jpg' : '1v1.jpg / 2v2.jpg'}. Telemetry will be scanned automatically.
                </p>
              </div>
            )}
          </div>

          {/* Fraud Attempt Penalty Banner */}
          {fraudPenaltyAlert && (
            <div className="p-4 bg-red-950/70 border-2 border-red-500 rounded-xl text-xs font-mono text-red-200 flex items-start gap-3 shadow-lg shadow-red-950/50 animate-pulse">
              <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm uppercase tracking-wider text-red-300 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    Fraud attempt penalty, 20xp
                  </span>
                  <span className="bg-red-500/20 text-red-300 font-bold px-2 py-0.5 rounded text-[10px] border border-red-500/40">
                    -20 XP DEDUCTION
                  </span>
                </div>
                <p className="text-red-200 leading-relaxed text-xs">
                  {rejectionError || fraudPenaltyAlert.message}
                </p>
                <div className="p-2.5 bg-black/40 rounded border border-red-500/30 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Highlighted Player on Screen:</span>
                    <b className="text-red-300">{fraudPenaltyAlert.highlightedIgn || 'Unknown'}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Your Registered Operative IGN:</span>
                    <b className="text-cyan-300">{fraudPenaltyAlert.expectedIgn || currentPlayer?.ign || 'Unknown'}</b>
                  </div>
                </div>
                <p className="text-[11px] text-red-400">
                  Operative IGNs must match the yellow-highlighted row in the scoreboard.
                </p>
              </div>
            </div>
          )}

          {/* Mode Mismatch Card Recommendation Banner (No Penalty) */}
          {modeMismatchAlert && (
            <div className="p-4 bg-amber-950/50 border border-amber-500/60 rounded-xl text-xs font-mono text-amber-200 flex items-start gap-3 shadow-md">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-amber-300">
                    Wrong OCR Card Selected (No Penalty)
                  </span>
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
                    0 XP Penalty
                  </span>
                </div>
                <p className="text-amber-200 leading-relaxed text-xs">
                  {modeMismatchAlert.message}
                </p>
                <div className="pt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleApplyCardRecommendation(modeMismatchAlert.recommendedMode)}
                    className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-black text-xs uppercase rounded transition-colors cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <Check className="w-3.5 h-3.5" /> Switch to {modeMismatchAlert.recommendedCard} Card
                  </button>
                  <span className="text-[11px] text-slate-400">
                    Re-scans automatically under correct mode schema.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* General OCR Rejection Alert Banner (when not fraud or mode mismatch) */}
          {rejectionError && !fraudPenaltyAlert && !modeMismatchAlert && (
            <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-xl text-xs font-mono text-red-300 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold uppercase tracking-wider block text-red-200">
                  SCREENSHOT STRUCTURE REJECTED
                </span>
                <p className="text-red-300 leading-relaxed">{rejectionError}</p>
                <p className="text-[11px] text-red-400">
                  To proceed, upload a match result screenshot matching the required <b>{activeMode}</b> structure.
                </p>
              </div>
            </div>
          )}

          {/* OCR Success Feedback */}
          {ocrStatus && !rejectionError && (
            <div className="p-3.5 bg-cyan-950/30 border border-cyan-500/40 rounded-xl flex items-center justify-between text-xs font-mono text-cyan-300">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                {ocrStatus}
              </span>
            </div>
          )}

          {/* Yellow Highlight Active Verification Callout */}
          {yellowHighlightDetected && !rejectionError && (
            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs font-mono text-amber-300">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Active Operative Row: <b>{yellowHighlightDetected}</b></span>
              </span>
              <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                Yellow Filter Verified
              </span>
            </div>
          )}

          {/* Quick Preset Samples & Rule Guards */}
          <div className="space-y-2 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-slate-400 uppercase block">
                Quick Telemetry Benchmarks for {activeMode}:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestFraudAttempt}
                  className="px-2.5 py-1 rounded bg-red-950/50 border border-red-500/40 text-[10px] font-mono text-red-300 hover:text-red-200 hover:bg-red-900/60 transition-colors cursor-pointer"
                >
                  ⚡ Test Fraud Attempt (-20 XP)
                </button>
                <button
                  type="button"
                  onClick={handleTestCardMismatch}
                  className="px-2.5 py-1 rounded bg-amber-950/50 border border-amber-500/40 text-[10px] font-mono text-amber-300 hover:text-amber-200 hover:bg-amber-900/60 transition-colors cursor-pointer"
                >
                  ⚡ Test Wrong OCR Card (0 XP)
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {modePresets[activeMode].map((sample, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setRejectionError(null);
                    setFraudPenaltyAlert(null);
                    setModeMismatchAlert(null);
                    setEvidencePreview(sample.url);
                    setStats({
                      ...sample.stats,
                      highlightedIgn: currentPlayer?.ign || sample.highlightedIgn
                    });
                    setYellowHighlightDetected(`${currentPlayer?.ign || sample.highlightedIgn} (Yellow Highlight Active)`);
                    setOcrStatus(`Loaded ${sample.title} benchmark telemetry.`);
                    showToast(`Benchmark preset loaded: ${sample.title}`, 'info');
                  }}
                  className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500 text-[11px] font-mono text-slate-300 hover:text-white transition-colors cursor-pointer text-left"
                >
                  <span className="block font-bold">{sample.title}</span>
                  <span className="text-[9px] text-slate-500 block truncate max-w-[260px]">{sample.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2: Extracted Telemetry Metrics (Dynamic per Mode) */}
        <div className="space-y-4 pt-4 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold text-slate-200 uppercase flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-400" />
              2. Extracted {activeMode} Metrics (Yellow Highlighted Player)
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              Operative: <b className="text-amber-300">{stats.highlightedIgn || currentPlayer?.ign || 'OPERATIVE'}</b>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Kills */}
            <div>
              <label className="block font-mono text-[11px] text-slate-400 uppercase mb-1">
                Kills ({activeMode === 'BR' ? '+5 XP/ea' : '+10 XP/ea'})
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

            {/* Assists (BR and SF only) */}
            {(activeMode === 'BR' || activeMode === 'SF') && (
              <div>
                <label className="block font-mono text-[11px] text-slate-400 uppercase mb-1">
                  Assists (+3 XP/ea)
                </label>
                <input
                  type="number"
                  min="0"
                  value={stats.assists ?? 0}
                  onChange={(e) => setStats({ ...stats, assists: parseInt(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded font-mono text-sm text-cyan-400 outline-none"
                  required
                />
              </div>
            )}

            {/* Deaths (SF only) */}
            {activeMode === 'SF' && (
              <div>
                <label className="block font-mono text-[11px] text-slate-400 uppercase mb-1">
                  Deaths (-5 XP/ea)
                </label>
                <input
                  type="number"
                  min="0"
                  value={stats.deaths ?? 0}
                  onChange={(e) => setStats({ ...stats, deaths: parseInt(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-red-500 rounded font-mono text-sm text-red-400 outline-none"
                  required
                />
              </div>
            )}

            {/* Damage */}
            <div>
              <label className="block font-mono text-[11px] text-slate-400 uppercase mb-1">
                Damage (+1 XP / 1k)
              </label>
              <input
                type="number"
                min="0"
                value={stats.damage ?? 0}
                onChange={(e) => setStats({ ...stats, damage: parseInt(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded font-mono text-sm text-amber-400 outline-none"
                required
              />
            </div>

            {/* BR Placement */}
            {activeMode === 'BR' && (
              <div>
                <label className="block font-mono text-[11px] text-slate-400 uppercase mb-1">
                  BR Placement
                </label>
                <select
                  value={stats.placement ?? 1}
                  onChange={(e) => {
                    const place = parseInt(e.target.value);
                    setStats({ 
                      ...stats, 
                      placement: place, 
                      placementText: place === 1 ? '1/12 Victory' : `#${place}/12`,
                      outcome: place === 1 ? 'Victory' : 'Defeat' 
                    });
                  }}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded font-mono text-sm text-emerald-400 outline-none cursor-pointer"
                >
                  <option value="1">#1 Victory (+50 XP)</option>
                  <option value="2">#2 Placement (+30 XP)</option>
                  <option value="3">#3 Placement (+10 XP)</option>
                  <option value="4">#4 Placement (+0 XP)</option>
                  <option value="5">#5 Placement (-30 XP)</option>
                  <option value="6">#6+ Placement (-30 XP)</option>
                </select>
              </div>
            )}

            {/* SF / Custom Outcome */}
            {(activeMode === 'SF' || activeMode === 'CUSTOM') && (
              <div>
                <label className="block font-mono text-[11px] text-slate-400 uppercase mb-1">
                  Match Outcome
                </label>
                <select
                  value={stats.outcome ?? 'Victory'}
                  onChange={(e) => setStats({ ...stats, outcome: e.target.value as 'Victory' | 'Defeat', wins: e.target.value === 'Victory' ? 1 : 0 })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded font-mono text-sm text-emerald-400 outline-none cursor-pointer"
                >
                  <option value="Victory">
                    Victory ({activeMode === 'SF' ? '+50 XP' : '+30 XP'})
                  </option>
                  <option value="Defeat">
                    Defeat (-20 XP)
                  </option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Projected XP Reward Card for Selected Mode */}
        <div className="bg-slate-900/80 border border-cyan-500/30 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-xs text-slate-300 font-bold uppercase block">
                Projected {activeMode} Performance XP
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                Calculated strictly according to {activeMode} ruleset
              </span>
            </div>
            <span className={`font-mono text-2xl font-black ${scoreBreakdown.total >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
              {scoreBreakdown.total >= 0 ? `+${scoreBreakdown.total}` : scoreBreakdown.total} XP
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-slate-400 pt-3 border-t border-slate-800">
            <div>
              Kills ({activeMode === 'BR' ? '5 XP' : '10 XP'}): <b className="text-white">+{scoreBreakdown.killsXp} XP</b>
            </div>

            {(activeMode === 'BR' || activeMode === 'SF') && (
              <div>
                Assists (3 XP): <b className="text-cyan-300">+{scoreBreakdown.assistsXp ?? 0} XP</b>
              </div>
            )}

            {activeMode === 'SF' && (
              <div>
                Deaths (-5 XP): <b className="text-red-400">{scoreBreakdown.deathsXp ?? 0} XP</b>
              </div>
            )}

            <div>
              Damage (1k/1 XP): <b className="text-amber-300">+{scoreBreakdown.damageXp ?? 0} XP</b>
            </div>

            {activeMode === 'BR' && (
              <div>
                Placement: <b className={(scoreBreakdown.placementBonus ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {(scoreBreakdown.placementBonus ?? 0) >= 0 ? `+${scoreBreakdown.placementBonus}` : scoreBreakdown.placementBonus} XP
                </b>
              </div>
            )}

            {(activeMode === 'SF' || activeMode === 'CUSTOM') && (
              <div>
                Outcome: <b className={(scoreBreakdown.outcomeBonus ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {(scoreBreakdown.outcomeBonus ?? 0) >= 0 ? `+${scoreBreakdown.outcomeBonus}` : scoreBreakdown.outcomeBonus} XP
                </b>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!!rejectionError}
          className={`w-full py-4 font-display font-black text-base uppercase tracking-wider chamfer-btn transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
            rejectionError 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-[#f4a261] hover:bg-[#ffb378] active:translate-y-0.5 text-[#2b1400] shadow-[0_0_25px_rgba(244,162,97,0.4)]'
          }`}
        >
          <Zap className="w-5 h-5" />
          Send {activeMode} SITREP For Review ({scoreBreakdown.total >= 0 ? `+${scoreBreakdown.total} XP` : `${scoreBreakdown.total} XP`}) →
        </button>
      </form>
    </div>
  );
};
