import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { MainMenu } from "./components/MainMenu";
import { Game } from "./components/Game";
import { MapEditor } from "./components/MapEditor";
import { CustomMaps } from "./components/CustomMaps";
import { Profile } from "./components/Profile";
import Auth from "./components/Auth";
import { Leaderboard } from "./components/Leaderboard";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { TermsOfService } from "./components/TermsOfService";
import { supabase } from "./utils/supabaseClient";
import type { MapData } from "./types";
import type { Session } from "@supabase/supabase-js";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [gameState, setGameState] = useState<
    "menu" | "playing" | "gameover" | "editor" | "custom-select" | "profile" | "auth" | "leaderboard"
  >("menu");
  const [highScore, setHighScore] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedMap, setSelectedMap] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingScore, setPendingScore] = useState<number | null>(null);
  const [editingMapData, setEditingMapData] = useState<Partial<MapData> | null>(null);

  // Ensure a profile exists for the current user (handles OAuth edge cases)
  const ensureProfileExists = async (userId: string, email: string, fullName?: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (!data) {
      // Profile doesn't exist — create it
      const username = email ? email.split("@")[0] : "player";
      await supabase.from("profiles").upsert({
        id: userId,
        username,
        full_name: fullName || "",
        age: 0,
        high_score: 0,
      });
    }
  };

  const fetchHighScore = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("high_score")
      .eq("id", userId)
      .single();

    if (error) {
      console.warn("Could not fetch high score:", error.message);
      setHighScore(0);
      return;
    }

    if (data) {
      setHighScore(data.high_score || 0);
    }
  };

  // Effect 1: Auth state listener — ONLY sets session, no API calls here
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setHighScore(0);
        setLoading(false);
      }
      // If we were on the auth screen, go back to menu after successful login
      if (session?.user) {
        setGameState((prev) => (prev === 'auth' ? 'menu' : prev));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Effect 2: When session changes, load profile & high score (safely, with catch)
  useEffect(() => {
    if (!session?.user) return;

    let cancelled = false;

    const loadUserData = async () => {
      try {
        await ensureProfileExists(
          session.user.id,
          session.user.email || "",
          session.user.user_metadata?.full_name
        );
        if (cancelled) return;

        // If there's a pending score from guest play, save it now
        if (pendingScore !== null && pendingScore > 0) {
          await supabase.rpc('update_high_score', { new_score: pendingScore });
          setPendingScore(null);
        }

        await fetchHighScore(session.user.id);
      } catch (err) {
        console.error("Error loading user data:", err);
        if (!cancelled) setHighScore(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadUserData();

    return () => { cancelled = true; };
  }, [session?.user?.id]);

  const startGame = () => {
    setSelectedMap(null);
    setGameState("playing");
    setScore(0);
  };

  const startCustomGame = (map: MapData) => {
    setSelectedMap(map);
    setGameState("playing");
    setScore(0);
  };

  const handleGameOver = async (finalScore: number) => {
    setScore(finalScore);

    // Only update high score for normal mode
    if (finalScore > highScore && !selectedMap) {
      setHighScore(finalScore);

      if (session?.user) {
        // Use server-side function for secure score update
        const { error } = await supabase.rpc('update_high_score', {
          new_score: finalScore,
        });

        if (error) {
          console.error("Error updating high score:", error.message);
        }
      }
    }

    setGameState("gameover");
  };

  const handleBackToMenu = () => {
    setGameState("menu");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleOpenAuth = () => {
    setGameState("auth");
  };

  const handleLoginToSaveScore = () => {
    // Store the guest's score so it can be saved after login
    setPendingScore(score);
    setGameState("auth");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        Loading...
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={
          <>
            {gameState === "menu" && (
                <MainMenu
                  onStart={startGame}
                  onOpenEditor={() => {
                    setEditingMapData({ name: "My New Map", visibility: "local", difficulty: "medium" });
                    setGameState("editor");
                  }}
                  onOpenCustomMap={() => setGameState("custom-select")}
                  onOpenProfile={() => session ? setGameState("profile") : setGameState("auth")}
                  onOpenLeaderboard={() => setGameState("leaderboard")}
                  onOpenAuth={handleOpenAuth}
                  onLogout={handleLogout}
                  highScore={highScore}
                  isGuest={!session}
                  isLoggedIn={!!session}
                />
            )}

            {gameState === "editor" && (
               <MapEditor 
                 onBack={handleBackToMenu} 
                 mapMetadata={editingMapData!} 
                 userId={session?.user?.id}
               />
            )}

            {gameState === "custom-select" && (
              <CustomMaps
                onSelect={startCustomGame}
                onBack={handleBackToMenu}
                onOpenEditor={(metadata) => {
                  setEditingMapData(metadata || null);
                  setGameState("editor");
                }}
                userId={session?.user?.id}
              />
            )}

            {gameState === "auth" && (
              <Auth 
                onLogin={() => setGameState("menu")} 
                onBack={handleBackToMenu} 
              />
            )}

            {gameState === "leaderboard" && (
              <Leaderboard 
                onBack={handleBackToMenu}
                isGuest={!session}
                onOpenAuth={handleOpenAuth}
                userId={session?.user?.id}
              />
            )}

            {gameState === 'profile' && session?.user && (
              <Profile 
                onBack={handleBackToMenu} 
                onLogout={handleLogout} 
                userId={session.user.id} 
              />
            )}

            {gameState === "playing" && (
              <Game 
                onGameOver={handleGameOver} 
                initialPipes={selectedMap?.pipes_data} 
              />
            )}

      {gameState === "gameover" && (
        <div className="fixed inset-0 flex flex-col items-center justify-center p-4 font-display z-50">
          {/* Blurred Game Background Overlay */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute inset-0 bg-cover bg-center scale-110 blur-xl opacity-60 dark:opacity-40" 
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDQ_3a30evpDGQKM_BzJRudQxfkFrnfXB5AEkAPPj2bg8KWe9ct0aOCUMk8CKR8DRroakgMUMnO8PMMmgsDSOLmsgV6KfMANC6G5NngsUF1Hd4zio0Fv0epqc__5fisW7Uph2iOa1ZQwz82zoEEiCjPFF1V-Lhm_3OiLn6Zc1_2Fe0k0UEQ54OQ3CzPyN5mWhNICKk_u7_36d0HouqfxPKtu3nzp-wXYQxs_ObqegiErju4cQeVGl32lvcT7Ur9dFJ2uMsZuP1l4OYW")' }}
            />
            {/* Darken overlay for contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900/90 dark:from-slate-950/70 dark:to-slate-950/95" />
          </div>

          <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
            {!session ? (
              // GUEST VIEW
              <div className="bg-background-dark/80 backdrop-blur-xl border border-white/10 rounded-xl p-8 shadow-2xl flex flex-col items-center">
                <div className="mb-4 bg-primary/20 p-4 rounded-full">
                  <span className="material-symbols-outlined text-primary text-5xl">
                    {selectedMap && score === selectedMap.pipes_data.length ? "workspace_premium" : "emoji_events"}
                  </span>
                </div>
                <h1 className="text-white tracking-tight text-4xl sm:text-5xl font-extrabold leading-tight text-center pb-8 italic">
                  {selectedMap && score === selectedMap.pipes_data.length ? "LEVEL CLEAR" : "GAME OVER"}
                </h1>
                
                <div className="grid grid-cols-2 gap-4 w-full mb-8">
                  <div className="flex flex-col items-center justify-center gap-1 rounded-xl p-6 bg-white/5 border border-white/10">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Score</p>
                    <p className="text-white tracking-tight text-4xl font-extrabold">{score}</p>
                  </div>
                  {!selectedMap ? (
                    <div className="flex flex-col items-center justify-center gap-1 rounded-xl p-6 bg-white/5 border border-white/10">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Best</p>
                      <p className="text-white tracking-tight text-4xl font-extrabold">{highScore > score ? highScore : score}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 rounded-xl p-6 bg-white/5 border border-white/10">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Map Pipes</p>
                      <p className="text-white tracking-tight text-4xl font-extrabold">{selectedMap.pipes_data.length}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col w-full gap-4">
                  <button 
                    onClick={handleLoginToSaveScore}
                    className="flex items-center justify-center gap-3 overflow-hidden rounded-full h-14 px-8 bg-primary hover:bg-blue-500 text-white text-lg font-bold transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined shrink-0 text-xl">cloud_upload</span>
                    <span className="truncate uppercase tracking-wider text-sm sm:text-base">Login to Save Score</span>
                  </button>
                  <button 
                    onClick={selectedMap ? () => startCustomGame(selectedMap) : startGame}
                    className="flex items-center justify-center gap-3 overflow-hidden rounded-full h-14 px-8 bg-game-green hover:brightness-110 text-slate-900 text-lg font-bold transition-all shadow-lg shadow-game-green/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined shrink-0 text-xl">replay</span>
                    <span className="truncate uppercase tracking-wider text-sm sm:text-base">Play Again</span>
                  </button>
                  <button 
                    onClick={handleBackToMenu}
                    className="flex items-center justify-center gap-3 overflow-hidden rounded-full h-14 px-8 bg-game-orange hover:brightness-110 text-slate-900 text-lg font-bold transition-all shadow-lg shadow-game-orange/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined shrink-0 text-xl">home</span>
                    <span className="truncate uppercase tracking-wider text-sm sm:text-base">Main Menu</span>
                  </button>
                  <button 
                    onClick={() => setGameState('leaderboard')}
                    className="mt-2 flex items-center justify-center gap-2 bg-transparent text-slate-400 hover:text-white text-sm font-semibold transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">leaderboard</span>
                    <span>View Global Leaderboard</span>
                  </button>
                </div>
              </div>
            ) : (
              // LOGGED IN VIEW
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-slate-700/30 rounded-xl shadow-2xl p-8 flex flex-col items-center">
                <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 border-4 border-white dark:border-slate-700 shadow-inner">
                  <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-500">
                    {selectedMap && score === selectedMap.pipes_data.length ? "emoji_events" : "sentiment_very_dissatisfied"}
                  </span>
                </div>
                <h1 className="text-slate-900 dark:text-slate-100 text-4xl sm:text-5xl font-black tracking-tighter mb-8 italic text-center">
                  {selectedMap && score === selectedMap.pipes_data.length ? "LEVEL CLEAR" : "GAME OVER"}
                </h1>
                
                <div className="grid grid-cols-2 gap-4 w-full mb-10">
                  <div className="bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 rounded-xl p-5 flex flex-col items-center">
                    <p className="text-primary text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase mb-1">Score</p>
                    <p className="text-slate-900 dark:text-slate-100 text-4xl font-extrabold">{score}</p>
                  </div>
                  {!selectedMap ? (
                    <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col items-center">
                      <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase mb-1">Best</p>
                      <p className="text-slate-900 dark:text-slate-100 text-4xl font-extrabold">{highScore > score ? highScore : score}</p>
                    </div>
                  ) : (
                    <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col items-center">
                      <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase mb-1">Map Pipes</p>
                      <p className="text-slate-900 dark:text-slate-100 text-4xl font-extrabold">{selectedMap.pipes_data.length}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <button 
                    onClick={selectedMap ? () => startCustomGame(selectedMap) : startGame}
                    className="flex items-center justify-center gap-3 w-full h-14 bg-success hover:bg-success/90 text-white rounded-full font-bold text-lg shadow-lg shadow-success/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-xl">replay</span>
                    <span className="tracking-wider">PLAY AGAIN</span>
                  </button>
                  <button 
                    onClick={handleBackToMenu}
                    className="flex items-center justify-center gap-3 w-full h-14 bg-game-orange hover:bg-orange-500 text-white rounded-full font-bold text-lg shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-xl">home</span>
                    <span className="tracking-wider">MAIN MENU</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
          </>
        } />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
      </Routes>
      <Analytics />
    </>
  );
}

export default App;
