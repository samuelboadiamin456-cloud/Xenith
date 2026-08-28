import React, { useState } from 'react';
import { 
  Shield, 
  Trophy, 
  LayoutDashboard, 
  Upload, 
  Lock, 
  Search, 
  Zap, 
  User, 
  LogOut, 
  ChevronDown, 
  Check, 
  Menu, 
  X,
  Sparkles,
  Crown,
  Camera,
  Download,
  Smartphone
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RankHexBadge } from './RankHexBadge';

export const Navbar: React.FC = () => {
  const { 
    activeView, 
    setActiveView, 
    currentPlayer, 
    currentAdmin,
    isAdmin, 
    logout, 
    players, 
    loginAsPlayer, 
    submissions,
    triggerRankCelebration,
    openAuthModal,
    adminRequests,
    openInstallModal,
    isAppInstalled
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const pendingCount = submissions.filter(s => s.status === 'pending' || s.status === 'flagged').length +
    adminRequests.filter(r => r.status === 'pending').length;

  const handleNav = (view: typeof activeView) => {
    setActiveView(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080b0f]/90 border-b border-slate-800/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Title */}
        <div 
          onClick={() => handleNav('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative w-11 h-11 rounded-lg bg-black/80 border border-cyan-500/40 flex items-center justify-center p-0.5 shadow-[0_0_15px_rgba(56,189,248,0.25)] group-hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all overflow-hidden">
            <img 
              src="/logo.jpg" 
              alt="XN Academy Hall of Fame Logo" 
              className="w-full h-full object-contain rounded"
              referrerPolicy="no-referrer"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black tracking-wider text-base text-white group-hover:text-cyan-400 transition-colors">
                XN ACADEMY
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">
                PRO
              </span>
            </div>
            <p className="font-mono text-[9px] tracking-widest text-slate-400 uppercase">
              OFFICIAL PLAYER NETWORK
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => handleNav('home')}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              activeView === 'home'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            Home
          </button>

          <button
            onClick={() => handleNav('leaderboard')}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'leaderboard'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Leaderboard
          </button>

          {currentPlayer && (
            <button
              onClick={() => handleNav('dashboard')}
              className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === 'dashboard'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </button>
          )}

          <button
            onClick={() => handleNav('submit')}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'submit'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Submit SITREP
          </button>

          <button
            onClick={() => handleNav('rank-journey')}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 text-amber-400 hover:bg-amber-500/10 border border-amber-500/30 cursor-pointer ${
              activeView === 'rank-journey' ? 'bg-amber-500/20 shadow-[0_0_14px_rgba(245,158,11,0.3)]' : ''
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Rank Journey
          </button>

          <button
            onClick={() => handleNav('admin')}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'admin'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            {isAdmin ? <Crown className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5" />}
            Admin
            {pendingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-mono font-bold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Section: Identity Chip & Switcher */}
        <div className="flex items-center gap-3">
          {/* Install App Quick Trigger */}
          <button
            onClick={openInstallModal}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-400 font-mono text-[11px] font-bold transition-all cursor-pointer"
            title="Install XN Network to Homescreen"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isAppInstalled ? 'Installed' : 'Install'}</span>
          </button>

          {isAdmin && currentAdmin ? (
            /* ADMIN PROFILE CHIP */
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 bg-amber-950/30 border border-amber-500/40 hover:border-amber-400 rounded-lg text-left transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded bg-gradient-to-tr from-amber-600 to-yellow-400 text-slate-950 font-display font-black text-sm flex items-center justify-center shadow-sm">
                  <Crown className="w-4 h-4" />
                </div>

                <div className="hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-amber-300">
                      {currentAdmin.displayName}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-amber-400/80 font-bold uppercase block">
                    {currentAdmin.isHeadOfCommand ? 'HEAD OF COMMAND' : 'STAFF OFFICER'}
                  </span>
                </div>

                <ChevronDown className="w-4 h-4 text-amber-400" />
              </button>

              {profileDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-[#0d1218] border border-amber-500/30 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800/80 mb-2">
                    <p className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      {currentAdmin.displayName}
                    </p>
                    <p className="font-mono text-[11px] text-amber-400">
                      @{currentAdmin.username} · {currentAdmin.email}
                    </p>
                  </div>

                  <button
                    onClick={() => handleNav('admin')}
                    className="w-full px-3 py-2 text-left font-mono text-xs text-amber-300 hover:bg-amber-500/10 rounded flex items-center gap-2 cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    Admin Command Portal
                  </button>

                  <div className="border-t border-slate-800/80 mt-2 pt-1">
                    <button
                      onClick={logout}
                      className="w-full px-3 py-2 text-left font-mono text-xs text-red-400 hover:bg-red-500/10 rounded flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Exit Admin Mode
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : currentPlayer ? (
            /* PLAYER PROFILE CHIP WITH CUSTOM AVATAR */
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-lg text-left transition-colors cursor-pointer"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-sky-400 text-slate-950 font-display font-black text-sm flex items-center justify-center overflow-hidden border border-cyan-500/30">
                    {currentPlayer.avatarUrl ? (
                      <img 
                        src={currentPlayer.avatarUrl} 
                        alt={currentPlayer.displayName} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      currentPlayer.displayName.charAt(0)
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1">
                    <span className="px-1 py-0.2 text-[8px] font-mono font-black rounded bg-orange-500 text-slate-950">
                      {currentPlayer.currentRank}
                    </span>
                  </span>
                </div>

                <div className="hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-100">
                      {currentPlayer.displayName}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-cyan-400 font-semibold block">
                    {currentPlayer.xnId}
                  </span>
                </div>

                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-[#0d1218] border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800/80 mb-2">
                    <p className="font-mono text-xs font-bold text-white">
                      {currentPlayer.displayName}
                    </p>
                    <p className="font-mono text-[11px] text-cyan-400">
                      {currentPlayer.xnId} · IGN: {currentPlayer.ign}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>XP: <b className="text-white">{currentPlayer.totalXp}</b></span>
                      <span className="text-orange-400 font-bold">{currentPlayer.currentRank} RANK</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleNav('dashboard')}
                    className="w-full px-3 py-2 text-left font-mono text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded flex items-center gap-2 cursor-pointer"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
                    My Dashboard
                  </button>

                  <button
                    onClick={() => triggerRankCelebration(currentPlayer.currentRank)}
                    className="w-full px-3 py-2 text-left font-mono text-xs text-amber-400 hover:bg-amber-500/10 rounded flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Rank Promotion HUD
                  </button>

                  <button
                    onClick={() => handleNav('edit-profile')}
                    className="w-full px-3 py-2 text-left font-mono text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-slate-400" />
                    Change Profile Picture
                  </button>

                  <div className="border-t border-slate-800/80 mt-2 pt-1">
                    <button
                      onClick={logout}
                      className="w-full px-3 py-2 text-left font-mono text-xs text-red-400 hover:bg-red-500/10 rounded flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('login')}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 font-mono text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="px-3.5 py-1.5 bg-[#f4a261] hover:bg-[#ffb378] text-[#2b1400] font-display font-black text-xs uppercase tracking-wider chamfer-btn-sm transition-all cursor-pointer shadow-[0_0_12px_rgba(244,162,97,0.3)]"
              >
                Claim XN-ID
              </button>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#080b0f]/98 px-4 py-4 space-y-2 backdrop-blur-2xl">
          <button
            onClick={() => handleNav('home')}
            className={`w-full text-left px-3 py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider ${
              activeView === 'home' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-300'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleNav('leaderboard')}
            className={`w-full text-left px-3 py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider ${
              activeView === 'leaderboard' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-300'
            }`}
          >
            Leaderboard
          </button>
          {currentPlayer && (
            <button
              onClick={() => handleNav('dashboard')}
              className={`w-full text-left px-3 py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider ${
                activeView === 'dashboard' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-300'
              }`}
            >
              Dashboard
            </button>
          )}
          <button
            onClick={() => handleNav('submit')}
            className={`w-full text-left px-3 py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider ${
              activeView === 'submit' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-300'
            }`}
          >
            Submit SITREP
          </button>
          <button
            onClick={() => handleNav('rank-journey')}
            className="w-full text-left px-3 py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30"
          >
            Rank Journey
          </button>
          <button
            onClick={() => handleNav('admin')}
            className={`w-full text-left px-3 py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider ${
              activeView === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-300'
            }`}
          >
            Admin Portal ({pendingCount} pending)
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              openInstallModal();
            }}
            className="w-full text-left px-3 py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Download className="w-3.5 h-3.5" />
              {isAppInstalled ? 'App Installed' : 'Install App to Device'}
            </span>
            <span className="text-[10px] text-cyan-300 font-mono">PWA</span>
          </button>
        </div>
      )}
    </header>
  );
};
