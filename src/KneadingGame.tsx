import React, { useState, useEffect, useRef } from "react";

export default function KneadingGame() {
  const [kneadCount, setKneadCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [isKneading, setIsKneading] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleKnead = () => {
    if (!isRunning) return;
    setKneadCount(prev => prev + 1);
    setIsKneading(true);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }

    setTimeout(() => setIsKneading(false), 150);
  };

  const startGame = () => {
    setKneadCount(0);
    setTimeLeft(10);
    setIsRunning(true);
    setIsKneading(false);
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => {
      if (intervalRef.current !== null) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  return (
    <div
      onClick={handleKnead}
      className="flex flex-col items-center justify-center min-h-screen bg-teal-50 p-4 text-center select-none"
    >
      <audio ref={audioRef} src="/assets/sounds/knead.mp3" preload="auto" />

      <h1 className="text-3xl font-bold mb-2">🍞 Quantum Quokkas Kneading Challenge!</h1>

      {/* Time Gauge */}
      <div className="w-full max-w-lg bg-gray-300 h-3 rounded mb-4">
        <div
          className="bg-green-500 h-3 rounded transition-all duration-300"
          style={{ width: `${(timeLeft / 10) * 100}%` }}
        />
      </div>

      {/* Sprite */}
      <img
        src={isKneading ? "/assets/sprites/knead.png" : "/assets/sprites/idle.png"}
        alt="Quantum Quokka"
        className="w-32 mb-4"
      />

      {!isRunning && timeLeft === 10 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            startGame();
          }}
          className="px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700"
        >
          Start Kneading
        </button>
      )}

      {isRunning && (
        <div className="text-lg mb-6">
          <p className="mb-2">Time Left: <strong>{timeLeft}s</strong></p>
          <p className="mt-4 text-xl">Kneads: <strong>{kneadCount}</strong></p>
        </div>
      )}

      {!isRunning && timeLeft === 0 && (
        <div>
          <p className="text-2xl font-semibold">⏱️ Time's up! You kneaded <strong>{kneadCount}</strong> times!</p>
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
    </div>
  );
}
