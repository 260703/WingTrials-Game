import { type FC } from 'react';
import { Footer } from './Footer';
import { AnimatedTitle } from './AnimatedTitle';

interface MainMenuProps {
  onStart: () => void;
  onOpenEditor: () => void;
  onOpenCustomMap: () => void;
  onOpenProfile: () => void;
  onOpenLeaderboard: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  highScore: number;
  isGuest?: boolean;
  isLoggedIn?: boolean;
}

export const MainMenu: FC<MainMenuProps> = ({
  onStart,
  onOpenEditor,
  onOpenCustomMap,
  onOpenProfile,
  onOpenLeaderboard,
  onOpenAuth,
  onLogout,
  highScore,
  isGuest,
  isLoggedIn,
}) => {
  const handleRestrictedAction = (action: () => void, featureName: string) => {
    if (isGuest) {
      alert(`Please LOGIN to access ${featureName}!`);
      onOpenAuth();
    } else {
      action();
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-x-hidden overflow-y-auto pixel-bg font-display">
      {/* ── Background Elements (CSS-only parallax) ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Sun */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-yellow-300 rounded-full blur-xl opacity-60" />

        {/* Clouds */}
        <div className="absolute top-1/4 left-[10%] w-48 h-12 bg-white rounded-full opacity-40 blur-sm" />
        <div className="absolute top-1/3 left-[60%] w-64 h-16 bg-white rounded-full opacity-30 blur-md" />

        {/* Distant hills */}
        <div
          className="absolute bottom-32 left-0 right-0 h-64 bg-[#5eb3bf] opacity-30"
          style={{ clipPath: 'polygon(0% 100%, 0% 60%, 15% 40%, 35% 70%, 55% 30%, 80% 80%, 100% 50%, 100% 100%)' }}
        />

        {/* Foreground hills */}
        <div
          className="absolute bottom-0 left-0 right-0 h-48 bg-[#73bf2e]"
          style={{ clipPath: 'polygon(0% 100%, 0% 40%, 20% 20%, 40% 50%, 60% 10%, 85% 60%, 100% 30%, 100% 100%)' }}
        />

        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#ded895] border-t-4 border-[#543847]" />
      </div>

      {/* ── Guest Badge ── */}
      {isGuest && (
        <div className="absolute top-6 left-8 z-20 flex items-center gap-2">
          <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 text-white text-[10px] font-bold tracking-wider">
            GUEST ACCOUNT
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="relative z-10 w-full px-8 py-6 flex justify-between items-start">
        {/* Left side spacer conceptually for guest badge if we had one here, or other header elements */}
        <div></div>

        <div className="flex gap-4">
          <button
            onClick={onOpenLeaderboard}
            className="group relative flex items-center justify-center size-14 border-none hover:scale-105 transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform z-20 outline-none"
            aria-label="Leaderboard"
          >
            {/* Pill Background expanding to the left using width instead of scale */}
            <div className="absolute right-0 top-0 bottom-0 w-14 group-hover:w-48 bg-primary/90 backdrop-blur-md rounded-full shadow-[0_0_15px_rgba(37,157,244,0.4)] transition-[width] duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] -z-10" />

            {/* Emerging Text sliding from right to left */}
            <div className="absolute right-18 flex items-center justify-end w-28 overflow-hidden -z-10 text-right opacity-0 translate-x-4 transition-all duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.27)] group-hover:opacity-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap">
              <span className="text-white font-extrabold text-[0.85rem] tracking-[0.15em] uppercase drop-shadow-md pr-1">
                Leader<br />Board
              </span>
            </div>

            {/* Solid Icon Circle Foreground Container */}
            <div className="relative flex items-center justify-center size-14 bg-primary rounded-full shadow-lg overflow-hidden shrink-0 border border-white/10 z-10 transition-colors duration-400">
              {/* Shine effect passing left to right across the circle */}
              <div 
                className="absolute inset-0 -translate-x-[150%] skew-x-12 bg-linear-to-r from-transparent via-white/50 to-transparent group-hover:animate-[shine_1.5s_cubic-bezier(0.4,0,0.2,1)_infinite] z-20 pointer-events-none" 
              />
              <span className="material-symbols-outlined text-2xl font-bold text-white relative z-10 drop-shadow-sm">
                leaderboard
              </span>
            </div>
          </button>
          
          {isLoggedIn ? (
            <button
              onClick={onLogout}
              className="group flex items-center gap-2 px-6 py-2 h-14 bg-white/10 hover:bg-white/20 transition-all rounded-full glass-card text-white text-sm font-bold tracking-wide"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              <span className="uppercase">Logout</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="group flex items-center gap-2 px-6 py-2 h-14 bg-white/10 hover:bg-white/20 transition-all rounded-full glass-card text-white text-sm font-bold tracking-wide"
            >
              <span className="material-symbols-outlined text-xl">login</span>
              <span className="uppercase">Login</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Center Content ── */}
      <main className="relative z-10 flex flex-col items-center gap-6 sm:gap-8 mb-12 sm:mb-16">
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-2 sm:gap-4">
          <AnimatedTitle />

          {/* High Score Card */}
          <div className="glass-card px-8 py-3 rounded-full flex items-center gap-4 mt-2 md:mt-4">
            <span className="text-white/70 text-sm font-bold uppercase tracking-widest">High Score</span>
            <span className="text-white text-3xl font-black tabular-nums">
              {String(highScore).padStart(3, '0')}
            </span>
            <span className="material-symbols-outlined text-yellow-400">emoji_events</span>
          </div>
        </div>

        {/* ── Controls Stack ── */}
        <div className="flex flex-col gap-3 w-full max-w-sm px-6">
          {/* Start Game */}
          <button
            onClick={onStart}
            className="group relative flex items-center justify-center overflow-hidden rounded-full h-16 bg-game-green hover:scale-105 transition-transform duration-200 shadow-[0_8px_0_0_#16a34a] active:translate-y-1 active:shadow-none"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <span className="relative flex items-center gap-3 text-white text-xl font-extrabold tracking-wider uppercase">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              Start Game
            </span>
          </button>

          {/* Create Map */}
          <button
            onClick={() => handleRestrictedAction(onOpenEditor, 'the Map Editor')}
            className="group relative flex items-center justify-center overflow-hidden rounded-full h-14 bg-game-orange hover:scale-105 transition-transform duration-200 shadow-[0_6px_0_0_#ea580c] active:translate-y-1 active:shadow-none"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <span className="relative flex items-center gap-3 text-white text-lg font-bold tracking-wider uppercase">
              <span className="material-symbols-outlined text-xl">map</span>
              Create Map
            </span>
          </button>

          {/* Custom Maps */}
          <button
            onClick={() => handleRestrictedAction(onOpenCustomMap, 'Custom Maps')}
            className="group relative flex items-center justify-center overflow-hidden rounded-full h-14 bg-primary hover:scale-105 transition-transform duration-200 shadow-[0_6px_0_0_#1d4ed8] active:translate-y-1 active:shadow-none"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <span className="relative flex items-center gap-3 text-white text-lg font-bold tracking-wider uppercase">
              <span className="material-symbols-outlined text-xl">grid_view</span>
              Custom Maps
            </span>
          </button>

          {/* Profile — only for logged-in users */}
          {isLoggedIn && (
            <button
              onClick={onOpenProfile}
              className="group relative flex items-center justify-center overflow-hidden rounded-full h-14 bg-indigo-500 hover:scale-105 transition-transform duration-200 shadow-[0_6px_0_0_#4338ca] active:translate-y-1 active:shadow-none"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <span className="relative flex items-center gap-3 text-white text-lg font-bold tracking-wider uppercase">
                <span className="material-symbols-outlined text-xl">person</span>
                Profile
              </span>
            </button>
          )}
        </div>
      </main>

      {/* Footer Area */}
      <div className="relative z-10 w-full mt-auto pb-4 sm:pb-6">
        <Footer />
      </div>
    </div>
  );
};
