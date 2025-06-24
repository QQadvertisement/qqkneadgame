import React, { useState, useEffect, useRef } from "react";
import { supabase } from './supabaseClient';

// Define leaderboard entry type
interface LeaderboardEntry {
  nickname: string;
  score: number;
}

export default function KneadingGame() {
  const [kneadCount, setKneadCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [scene, setScene] = useState<'start' | 'leaderboard' | 'entry' | 'countdown' | 'game' | 'result'>('start');
  const [entry, setEntry] = useState({ name: '', phone: '', email: '', agree: false });
  const [entryError, setEntryError] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [countdown, setCountdown] = useState(3);
  const intervalRef = useRef<number | null>(null);
  const autoSwitchRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-switch between start and leaderboard every 7 seconds
  useEffect(() => {
    if (scene === 'start' || scene === 'leaderboard') {
      if (autoSwitchRef.current) clearTimeout(autoSwitchRef.current);
      autoSwitchRef.current = window.setTimeout(() => {
        setScene(scene === 'start' ? 'leaderboard' : 'start');
      }, 7000);
    }
    return () => {
      if (autoSwitchRef.current) clearTimeout(autoSwitchRef.current);
    };
  }, [scene]);

  // Countdown logic
  useEffect(() => {
    if (scene === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setKneadCount(0);
        setTimeLeft(10);
        setIsRunning(true);
        setScene('game');
      }
    }
  }, [scene, countdown]);

  const handleKnead = () => {
    if (!isRunning) return;
    setKneadCount(prev => prev + 1);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  const startGame = () => {
    setKneadCount(0);
    setTimeLeft(10);
    setIsRunning(true);
    setScene('game');
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setScene('result');
    }
    return () => {
      if (intervalRef.current !== null) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // Helper to generate anonymized nickname
  function generateNickname() {
    const emojis = ['🦄', '🐨', '🍩', '🐙', '🦊', '🐸', '🐧', '🐼', '🦁', '🐵'];
    const names = ['Sparkle', 'Koala', 'Donut', 'Octo', 'Foxy', 'Froggy', 'Pengu', 'Panda', 'Leo', 'Momo'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    const number = Math.floor(1000 + Math.random() * 9000);
    return `${emoji} ${name} #${number}`;
  }

  // Fetch leaderboard from Supabase
  async function fetchLeaderboard() {
    const { data, error } = await supabase
      .from('scores')
      .select('nickname, score')
      .order('score', { ascending: false })
      .limit(5);
    if (!error && data) {
      setLeaderboard(data);
    }
  }

  // On mount and after submitting a score, fetch leaderboard
  useEffect(() => {
    if (scene === 'leaderboard' || scene === 'result') {
      fetchLeaderboard();
    }
  }, [scene]);

  // On game finish, insert score into Supabase
  useEffect(() => {
    if (scene === 'result' && kneadCount > 0 && entry.name) {
      const submitScore = async () => {
        const nickname = generateNickname();
        await supabase.from('scores').insert([
          {
            name: entry.name,
            phone: entry.phone,
            email: entry.email,
            score: kneadCount,
            nickname,
            created_at: new Date().toISOString(),
          },
        ]);
        fetchLeaderboard();
      };
      submitScore();
    }
    // eslint-disable-next-line
  }, [scene]);

  // Start Screen
  if (scene === 'start') {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen p-4 text-center select-none cursor-pointer"
        style={{ background: '#d8fbf4' }}
        onClick={() => setScene('entry')}
      >
        <h1 className="fun-heading text-5xl font-extrabold mb-4 text-purple-700 drop-shadow-lg uppercase tracking-wider">
          Ready, Set,<br />Knead!
        </h1>
        <img
          src="/qqkneadgame/assets/sprites/start.png"
          alt="Start Kneading Game"
          className="w-72 h-72 object-contain mb-6 animate-bounce-slow"
        />
        <p className="fun-subtitle text-xl font-semibold text-red-600 mb-6">
          Tap to knead. Knead as much as you can in 10 seconds!
        </p>
      </div>
    );
  }

  // Leaderboard Scene
  if (scene === 'leaderboard') {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen p-4 text-center select-none cursor-pointer"
        style={{ background: '#d8fbf4' }}
        onClick={() => setScene('entry')}
      >
        <h2 className="fun-heading text-4xl font-bold text-purple-700 mb-4 uppercase tracking-wider">Leaderboard</h2>
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-xs mb-6">
          <ol className="text-left text-lg font-bold text-gray-700 space-y-2">
            {leaderboard.map((entry, idx) => (
              <li key={idx} className="flex justify-between items-center">
                <span>{idx + 1}. {entry.nickname}</span>
                <span className="text-purple-600">{entry.score}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="fun-subtitle text-lg text-red-600">Think you can beat these scores? Tap anywhere to play!</p>
      </div>
    );
  }

  // Entry Form Scene
  if (scene === 'entry') {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setEntry(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    };
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!entry.name || !entry.phone || !entry.email || !entry.agree) {
        setEntryError('Please fill all fields and agree to the terms.');
        return;
      }
      setEntryError('');
      setCountdown(3);
      setScene('countdown');
    };
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center select-none" style={{ background: '#d8fbf4' }}>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm flex flex-col gap-4">
          <h2 className="fun-heading text-3xl text-purple-700 mb-2">Quick Entry</h2>
          <input
            type="text"
            name="name"
            placeholder="Your Name or Company Name"
            value={entry.name}
            onChange={handleChange}
            className="rounded-lg border-2 border-purple-300 px-4 py-3 text-lg focus:outline-none focus:border-purple-500"
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone"
            value={entry.phone}
            onChange={handleChange}
            className="rounded-lg border-2 border-purple-300 px-4 py-3 text-lg focus:outline-none focus:border-purple-500"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={entry.email}
            onChange={handleChange}
            className="rounded-lg border-2 border-purple-300 px-4 py-3 text-lg focus:outline-none focus:border-purple-500"
            required
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="agree"
              checked={entry.agree}
              onChange={handleChange}
              className="accent-purple-600"
              required
            />
            <span className="text-red-700 font-bold fun-subtitle text-center">
              I consent to the collection of my personal information for the purpose of this demo. I understand that I may be contacted in the future if I am a qualified lead.
            </span>
          </label>
          {entryError && <div className="text-red-500 text-sm mb-2">{entryError}</div>}
          <button
            type="submit"
            className="bg-purple-600 text-white font-bold py-3 rounded-lg text-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!(entry.name && entry.phone && entry.email && entry.agree)}
          >
            Start
          </button>
        </form>
      </div>
    );
  }

  // Countdown Scene
  if (scene === 'countdown') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center select-none" style={{ background: '#d8fbf4' }}>
        <h2 className="fun-heading text-6xl text-purple-700 mb-2 drop-shadow-lg">{countdown > 0 ? countdown : 'Go!'}</h2>
      </div>
    );
  }

  // Result Scene
  if (scene === 'result') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center select-none" style={{ background: '#d8fbf4' }}>
        <img
          src="/qqkneadgame/assets/sprites/finish.png"
          alt="Finish Kneading"
          className="w-60 h-60 object-contain mb-4"
        />
        <p className="text-2xl font-semibold text-purple-700 mb-2 fun-heading">⏱️ Time's up! You kneaded <strong>{kneadCount}</strong> times!</p>
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-xs mb-6">
          <h3 className="fun-heading text-xl text-purple-700 mb-2 font-bold uppercase tracking-wider">Leaderboard</h3>
          <ol className="text-left text-lg font-bold text-gray-700 space-y-2">
            {leaderboard.map((entry, idx) => (
              <li key={idx} className="flex justify-between items-center">
                <span>{idx + 1}. {entry.nickname}</span>
                <span className="text-purple-600">{entry.score}</span>
              </li>
            ))}
          </ol>
        </div>
        <button
          onClick={() => setScene('entry')}
          className="bg-purple-600 text-white font-bold py-3 px-8 rounded-full text-xl shadow-lg hover:bg-purple-700 transition-all animate-pulse"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={handleKnead}
      className="flex flex-col items-center justify-center min-h-screen p-4 text-center select-none"
      style={{ background: '#d8fbf4' }}
    >
      <audio ref={audioRef} src="/qqkneadgame/assets/sounds/knead.mp3" preload="auto" />

      <h1 className="text-3xl font-bold mb-2">🍞 Dough Kneading Challenge!</h1>

      {/* Time Gauge */}
      <div className="w-full max-w-lg bg-gray-300 h-3 rounded mb-4">
        <div
          className="bg-green-500 h-3 rounded transition-[width] duration-700 ease-out"
          style={{ width: `${(timeLeft / 10) * 100}%` }}
        />
      </div>

      {!isRunning && timeLeft === 0 && (
        <div className="pb-5">
          <p className="text-2xl font-semibold">
            ⏱️ Time's up! You kneaded <strong>{kneadCount}</strong> times!
          </p>
          <p className="mt-2 text-green-700 font-medium">
            That dough is ready for action!!<br />
            You can find your next favorite bun at 🥖🧁 <span className="font-bold text-teal-700">YOUR BRAND HERE</span> 🍜🍕
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              startGame();
            }}
            className="mt-4 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700"
          >
            Play Again
          </button>
        </div>
      )}

      {/* Sprite */}
      <img
        src={
          !isRunning && timeLeft === 0
            ? "/qqkneadgame/assets/sprites/finish.png"
            : kneadCount % 2 === 0
              ? "/qqkneadgame/assets/sprites/idle.png"
              : "/qqkneadgame/assets/sprites/knead.png"
        }
        alt="Quantum Quokka"
        className="w-60 h-60 object-contain mb-4"
      />

      {isRunning && (
        <div className="text-lg mb-6">
          <p className="mb-2">Time Left: <strong>{timeLeft}s</strong></p>
          <p className="mt-4 text-xl">Kneads: <strong>{kneadCount}</strong></p>
        </div>
      )}
    </div>
  );
}