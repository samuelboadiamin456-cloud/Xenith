import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HomeView } from './views/HomeView';
import { LeaderboardView } from './views/LeaderboardView';
import { DashboardView } from './views/DashboardView';
import { SubmitSitrepView } from './views/SubmitSitrepView';
import { AdminPortalView } from './views/AdminPortalView';
import { PublicProfileView } from './views/PublicProfileView';
import { EditProfileView } from './views/EditProfileView';
import { RankJourneyModal } from './components/RankJourneyModal';
import { AuthModal } from './views/AuthModal';
import { InstallAppModal } from './components/InstallAppModal';
import { Shield, Sparkles, CheckCircle2, AlertCircle, Info, Download, Smartphone } from 'lucide-react';

const AppContent: React.FC = () => {
  const { 
    activeView, 
    showCelebration, 
    celebrationRank, 
    closeCelebration, 
    toastMessage, 
    currentPlayer,
    authModalOpen,
    authModalMode,
    closeAuthModal,
    installModalOpen,
    closeInstallModal,
    openInstallModal,
    deferredPrompt,
    isAppInstalled,
    showToast
  } = useApp();

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <HomeView />;
      case 'leaderboard':
        return <LeaderboardView />;
      case 'dashboard':
        return <DashboardView />;
      case 'submit':
        return <SubmitSitrepView />;
      case 'admin':
        return <AdminPortalView />;
      case 'profile':
        return <PublicProfileView />;
      case 'edit-profile':
        return <EditProfileView />;
      case 'rank-journey':
        return (
          <RankJourneyModal
            isOpen={true}
            onClose={closeCelebration}
            initialRank={currentPlayer?.currentRank || 'B'}
            isStandaloneView={true}
          />
        );
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#080a0d] text-[#f3f5f7] hud-grid-bg flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950">
      <div>
        {/* Topbar Navigation */}
        <Navbar />

        {/* Main Viewport Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {renderView()}
        </main>
      </div>

      {/* Global Rank Journey Celebration Modal (Exact match to image.png) */}
      <RankJourneyModal
        isOpen={showCelebration && activeView !== 'rank-journey'}
        onClose={closeCelebration}
        initialRank={celebrationRank || currentPlayer?.currentRank || 'B'}
      />

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        initialMode={authModalMode}
      />

      {/* Global PWA Install Modal */}
      <InstallAppModal
        isOpen={installModalOpen}
        onClose={closeInstallModal}
        deferredPrompt={deferredPrompt}
        onInstallSuccess={() => {
          showToast('XN Academy installed successfully!', 'success');
        }}
      />

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div
            className={`p-3.5 px-5 rounded-xl border flex items-center gap-3 shadow-2xl backdrop-blur-xl font-mono text-xs ${
              toastMessage.type === 'success'
                ? 'bg-[#0d1815]/95 border-emerald-500/50 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : toastMessage.type === 'error'
                ? 'bg-[#180d0d]/95 border-red-500/50 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                : 'bg-[#0d1418]/95 border-cyan-500/50 text-cyan-300 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400" />
            ) : (
              <Info className="w-4 h-4 text-cyan-400" />
            )}
            <span className="font-semibold">{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Official Footer */}
      <footer className="border-t border-slate-800/80 bg-[#06080b] py-8 mt-16 font-mono text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.jpg" 
              alt="XN Academy Crest" 
              className="w-6 h-6 object-contain rounded border border-cyan-500/30"
              referrerPolicy="no-referrer"
            />
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-300">XN ACADEMY PROTOCOL</span>
              <span>· PERMANENT PLAYER IDENTITY MATRIX</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={openInstallModal}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_10px_rgba(56,189,248,0.15)]"
            >
              <Smartphone className="w-3.5 h-3.5" />
              {isAppInstalled ? 'App Installed' : 'Install App to Device'}
            </button>
            <span className="text-slate-700">|</span>
            <span>SYSTEM ENCRYPTION: SHA-256</span>
            <span className="text-slate-700">|</span>
            <span className="text-cyan-400">APEX VANGUARD SEASON</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
