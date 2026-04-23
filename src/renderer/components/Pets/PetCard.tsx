// BuddyCard - displays a collected buddy with ASCII art, hat, rarity styling, inline rename

import React, { useCallback, useRef, useState } from "react";
import { getSpeciesById, getHatById, RARITIES, getPersonalityTitle } from "../../data/buddy-data";
import { usePetStore } from "../../stores/pet-store";

interface BuddyCardProps {
  buddy: BuddyRecord;
  isNew?: boolean;
  onClick?: () => void;
  selected?: boolean;
}

export default function BuddyCard({ buddy, isNew, onClick, selected }: BuddyCardProps) {
  const species = getSpeciesById(buddy.speciesId);
  const hat = getHatById(buddy.hatId);
  const rc = RARITIES[buddy.rarity] || RARITIES.common;
  const renameBuddy = usePetStore((s) => s.renameBuddy);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(buddy.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const frame = species?.frames[0] || "???";
  const personality = getPersonalityTitle(buddy.attributes);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(buddy.name);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }, [buddy.name]);

  const handleSave = useCallback(async () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== buddy.name) {
      await window.catclaw.renameBuddy(buddy.id, trimmed);
      renameBuddy(buddy.id, trimmed);
    }
    setEditing(false);
  }, [editName, buddy.id, buddy.name, renameBuddy]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") setEditing(false);
  }, [handleSave]);

  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl border-2 p-4 ${rc.bgClass} ${rc.borderClass} transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${isNew ? "animate-card-reveal" : ""} ${selected ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900" : ""} ${onClick ? "cursor-pointer" : ""}`}
    >
      {/* Legendary shimmer */}
      {buddy.rarity === "legendary" && (
        <div className="absolute inset-0 rounded-2xl shimmer-bg animate-shimmer pointer-events-none" />
      )}

      {/* Shiny indicator */}
      {buddy.isShiny && (
        <div className="absolute top-2 left-2">
          <span className="text-xs animate-sparkle">&#10024;</span>
        </div>
      )}

      {/* Rarity badge */}
      <div className="absolute top-2 right-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${rc.textClass} bg-white/60 dark:bg-black/30`}>
          {rc.name}
        </span>
      </div>

      {/* Hat + ASCII art */}
      <div className="text-center mt-3 mb-2">
        <pre className="inline-block text-[10px] leading-[1.2] font-mono text-gray-700 dark:text-gray-300 whitespace-pre select-none">
          {hat && hat.id !== "none" && (
            <>{`    ${hat.art}\n`}</>
          )}
          {frame}
        </pre>
      </div>

      {/* Species emoji + name (double-click to rename) */}
      <div className="flex items-center justify-center gap-1.5 mt-1">
        <span className="text-base">{species?.emoji}</span>
        {editing ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-bold text-center text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 border border-indigo-300 dark:border-indigo-600 rounded px-1 py-0 w-24 outline-none"
            maxLength={20}
          />
        ) : (
          <span
            onDoubleClick={handleDoubleClick}
            className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate cursor-text"
            title="Double-click to rename"
          >
            {buddy.name}
          </span>
        )}
      </div>

      {/* Personality title */}
      <p className={`text-center text-[10px] mt-1 italic ${rc.textClass}`}>
        {personality}
      </p>

      {/* Top attribute */}
      <div className="mt-1.5 flex justify-center">
        <AttributeBar attrs={buddy.attributes} />
      </div>

      {/* Date */}
      <p className="mt-1 text-[10px] text-center text-gray-400 dark:text-gray-600">
        {new Date(buddy.obtainedAt).toLocaleDateString()}
      </p>
    </div>
  );
}

function AttributeBar({ attrs }: { attrs: BuddyAttributes }) {
  const entries = Object.entries(attrs) as [string, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const top = entries[0];
  const icons: Record<string, string> = {
    debugging: "\uD83D\uDC1B",
    patience: "\uD83E\uDDD8",
    chaos: "\uD83C\uDF2A\uFE0F",
    wisdom: "\uD83E\uDDD9",
    snark: "\uD83D\uDE0F",
  };
  return (
    <span className="text-[10px] text-gray-500 dark:text-gray-400">
      {icons[top[0]] || ""} {top[1]}
    </span>
  );
}
