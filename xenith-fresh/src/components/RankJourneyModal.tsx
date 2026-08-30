import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, Shield, Zap, Sparkles, X, ChevronRight } from 'lucide-react';
import { RankTier } from '../types';
import { RANK_CONFIGS, RANK_TIERS_ORDER } from '../data/rankConfigs';
import { RankHexBadge } from './RankHexBadge';

interface RankJourneyModalProps {
  initialRank?: RankTier;
  isOpen: boolean;
  onClose: () => void;
  isStandaloneView?: boolean;
}

export const RankJourneyModal: React.FC<RankJourneyModalProps> = ({
  initialRank = 'B',
  isOpen,
  onClose,
  isStandaloneView = false
}) => {
  const [selectedRank, setSelectedRank] = useState<RankTier>(initialRank);
  const config = RANK_CONFIGS[selectedRank] || RANK_CONFIGS['B'];

  if (!isOpen && !isStandaloneView) return null;

  const content = (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-between text-center px-4 py-8 relative min-h-[85vh]">
      {/* Background radial ambiance */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl opacity-20 transition-all duration-700"
          style={{ backgroundColor: config.themeColor }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
      </div>

      {/* Top Controls: Tier Switcher (allows inspecting any rank clearance) */}
      <div className="w-full z-20 mb-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400/80 flex items-center gap-1">
            <Shield className="w-3 h-3" /> RANK CLEARANCE MATRIX
          </span>
          {!isStandaloneView && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Tier Selector Pills */}
        <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-lg backdrop-blur-md">
          {RANK_TIERS_ORDER.map((tier) => {
            const isSelected = tier === selectedRank;
            return (
              <button
                key={tier}
                onClick={() => setSelectedRank(tier)}
                className={`flex-1 py-1 px-1.5 text-xs font-mono font-bold rounded transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tier}
              </button>
            );
          })}
        </div>
      </div>

      {/* Header Eyebrow & Main Title (exact match from image.png) */}
      <motion.div
        key={`header-${selectedRank}`}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="z-10 mt-2"
      >
        <p className="font-mono text-xs sm:text-sm font-semibold tracking-[0.2em] text-cyan-400 uppercase mb-2 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]">
          SYSTEM AUTHORIZATION VERIFIED
        </p>
        <h1 className="font-display text-5xl sm:text-6xl font-black tracking-tight text-white uppercase drop-shadow-[0_2px_14px_rgba(255,255,255,0.2)]">
          PROMOTED
        </h1>
      </motion.div>

      {/* Hexagonal Rank Badge with Dotted Radar Orbital Ring (exact match from image.png) */}
      <motion.div
        key={`badge-${selectedRank}`}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="my-8 z-10"
      >
        <RankHexBadge
          rank={selectedRank}
          size="hero"
          showDottedRing={true}
          animateRing={true}
        />
      </motion.div>

      {/* Tactical Spec Card (exact match from image.png) */}
      <motion.div
        key={`card-${selectedRank}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="w-full bg-[#0c1015]/95 border-t border-r border-b border-slate-800/80 border-l-[4px] border-l-cyan-400 rounded-r-lg p-5 sm:p-6 text-left shadow-2xl backdrop-blur-xl z-10"
      >
        {/* Title: e.g. B-RANK VETERAN */}
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wide text-cyan-400 uppercase">
          {config.title}
        </h2>

        {/* Divider */}
        <div className="w-full h-px bg-slate-800/90 my-4" />

        {/* Perk Row */}
        <div className="flex items-center gap-3.5 my-2">
          <div className="w-7 h-7 rounded border border-cyan-400/60 bg-cyan-950/40 flex items-center justify-center text-cyan-400 shrink-0">
            <CheckSquare className="w-4 h-4" />
          </div>
          <span className="font-mono text-xs sm:text-sm font-semibold tracking-wider text-slate-200 uppercase">
            {config.perkDescription}
          </span>
        </div>

        {/* Clearance Level & Multiplier Grid */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-2">
          <div>
            <span className="block font-mono text-[11px] font-semibold text-cyan-400/90 tracking-wider uppercase mb-1">
              CLEARANCE
            </span>
            <span className="font-mono text-base sm:text-lg font-bold text-white tracking-wide uppercase">
              {config.clearanceLevel}
            </span>
          </div>

          <div>
            <span className="block font-mono text-[11px] font-semibold text-cyan-400/90 tracking-wider uppercase mb-1">
              MULTIPLIER
            </span>
            <span className="font-mono text-base sm:text-lg font-bold text-white tracking-wide uppercase">
              {config.multiplier}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Chamfered Amber CTA Button: CONTINUE (exact match from image.png) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full z-10 mt-8"
      >
        <button
          onClick={onClose}
          className="w-full py-4 px-6 bg-[#f4a261] hover:bg-[#ffb378] active:translate-y-0.5 text-[#2b1400] font-display font-black text-lg tracking-[0.15em] uppercase chamfer-btn transition-all duration-150 shadow-[0_0_24px_rgba(244,162,97,0.4)] flex items-center justify-center gap-2 cursor-pointer"
        >
          CONTINUE
        </button>
      </motion.div>
    </div>
  );

  if (isStandaloneView) {
    return <div className="min-h-screen py-6 flex items-center justify-center">{content}</div>;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-lg bg-[#080b0f] border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative my-auto"
        >
          {content}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
