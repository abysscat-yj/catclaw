// BuddyDisplay - animated ASCII art buddy in the sidebar with personality and interactions

import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePetStore } from "../../stores/pet-store";
import {
  getSpeciesById,
  getHatById,
  getPersonalityTitle,
  RARITIES,
  SLEEP_OVERLAY,
  THINK_OVERLAY,
  EXCITED_OVERLAY,
  type AnimState,
} from "../../data/buddy-data";

export default function BuddyDisplay() {
  const activeBuddy = usePetStore((s) => s.activeBuddy);
  const [frameIndex, setFrameIndex] = useState(0);
  const [speech, setSpeech] = useState<string | null>(null);
  const [animState, setAnimState] = useState<AnimState>("idle");
  const [bouncing, setBouncing] = useState(false);
  const speechTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const species = activeBuddy ? getSpeciesById(activeBuddy.speciesId) : null;
  const hat = activeBuddy ? getHatById(activeBuddy.hatId) : null;
  const rc = activeBuddy ? RARITIES[activeBuddy.rarity] : null;

  // Idle animation: cycle through frames
  useEffect(() => {
    if (!species) return;
    const speed = animState === "sleep" ? 1500 : animState === "excited" ? 400 : 800;
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % species.frames.length);
    }, speed);
    return () => clearInterval(interval);
  }, [species, animState]);

  // Random animation state changes
  useEffect(() => {
    if (!activeBuddy) return;
    const interval = setInterval(() => {
      const roll = Math.random();
      if (roll < 0.15) {
        setAnimState("sleep");
        setTimeout(() => setAnimState("idle"), 5000 + Math.random() * 5000);
      } else if (roll < 0.25) {
        setAnimState("thinking");
        setTimeout(() => setAnimState("idle"), 3000 + Math.random() * 3000);
      } else if (roll < 0.3) {
        setAnimState("excited");
        setTimeout(() => setAnimState("idle"), 2000 + Math.random() * 2000);
      }
    }, 10000 + Math.random() * 15000);
    return () => clearInterval(interval);
  }, [activeBuddy?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Random speech bubble
  useEffect(() => {
    if (!activeBuddy) return;

    const showSpeech = () => {
      window.catclaw.getRandomSpeech().then((text) => {
        setSpeech(text);
        if (speechTimeout.current) clearTimeout(speechTimeout.current);
        speechTimeout.current = setTimeout(() => {
          setSpeech(null);
        }, 4000);
      }).catch(() => { /* ignore */ });
    };

    const initial = setTimeout(showSpeech, 2000);
    const interval = setInterval(showSpeech, 15000 + Math.random() * 15000);

    return () => {
      clearTimeout(initial);
      clearInterval(interval);
      if (speechTimeout.current) clearTimeout(speechTimeout.current);
    };
  }, [activeBuddy?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Click interaction
  const handleClick = useCallback(() => {
    if (!activeBuddy) return;

    // Bounce animation
    setBouncing(true);
    setTimeout(() => setBouncing(false), 500);

    // Brief excited state
    setAnimState("excited");
    setTimeout(() => setAnimState("idle"), 1500);

    // Show click speech
    window.catclaw.getClickSpeech().then((text) => {
      setSpeech(text);
      if (speechTimeout.current) clearTimeout(speechTimeout.current);
      speechTimeout.current = setTimeout(() => {
        setSpeech(null);
      }, 3000);
    }).catch(() => { /* ignore */ });
  }, [activeBuddy]);

  if (!activeBuddy || !species) {
    return null;
  }

  const frame = species.frames[frameIndex] || species.frames[0];
  const personalityTitle = getPersonalityTitle(activeBuddy.attributes);

  // State overlay text
  const stateOverlay =
    animState === "sleep" ? SLEEP_OVERLAY :
    animState === "thinking" ? THINK_OVERLAY :
    animState === "excited" ? EXCITED_OVERLAY :
    null;

  return (
    <div className="px-3 py-2 border-t border-gray-200/50 dark:border-gray-700/50">
      {/* Speech bubble */}
      {speech && (
        <div className="mb-1.5 mx-1 animate-fade-in">
          <div className="relative bg-white dark:bg-gray-700 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-600 dark:text-gray-300 shadow-sm border border-gray-200/80 dark:border-gray-600/50">
            {speech}
            <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-white dark:bg-gray-700 border-r border-b border-gray-200/80 dark:border-gray-600/50 transform rotate-45" />
          </div>
        </div>
      )}

      {/* Buddy display - clickable */}
      <div
        className={`flex items-end gap-2 cursor-pointer select-none transition-transform ${bouncing ? "animate-bounce-once" : ""}`}
        onClick={handleClick}
      >
        {/* ASCII art */}
        <div className={`flex-shrink-0 ${activeBuddy.isShiny ? "animate-glow" : ""}`}>
          <pre className={`text-[9px] leading-[1.15] font-mono whitespace-pre select-none transition-opacity ${
            animState === "sleep" ? "text-gray-400 dark:text-gray-500 opacity-60" : "text-gray-600 dark:text-gray-400"
          }`}>
            {hat && hat.id !== "none" && `   ${hat.art}\n`}{frame}
          </pre>
          {/* State overlay */}
          {stateOverlay && (
            <div className={`text-[8px] text-center font-mono mt-0.5 ${
              animState === "sleep" ? "text-blue-400 animate-pulse" :
              animState === "thinking" ? "text-yellow-500 animate-pulse" :
              "text-orange-400"
            }`}>
              {stateOverlay}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 pb-0.5">
          <div className="flex items-center gap-1">
            <span className="text-xs">{species.emoji}</span>
            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 truncate">
              {activeBuddy.name}
            </span>
            {activeBuddy.isShiny && <span className="text-[10px]">&#10024;</span>}
          </div>
          <p className={`text-[10px] italic ${rc?.textClass || "text-gray-400"}`}>
            {personalityTitle}
          </p>
        </div>
      </div>
    </div>
  );
}
