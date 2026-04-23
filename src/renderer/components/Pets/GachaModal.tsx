// GachaModal - buddy draw modal with flip animation

import React, { useCallback, useState } from "react";
import BuddyCard from "./PetCard";

interface GachaModalProps {
  onClose: () => void;
  pawCoins: number;
  onDraw: () => Promise<DrawResult>;
}

const DRAW_COST = 10;

const RARITY_CELEBRATION: Record<string, { text: string; color: string }> = {
  common: { text: "新伙伴！", color: "text-gray-600 dark:text-gray-400" },
  uncommon: { text: "不常见的发现！", color: "text-green-500" },
  rare: { text: "稀有发现！", color: "text-blue-500" },
  epic: { text: "史诗级！！！", color: "text-purple-500" },
  legendary: { text: "传说级！！！", color: "text-amber-500 animate-pulse" },
};

type DrawState = "idle" | "drawing" | "revealed";

export default function GachaModal({ onClose, pawCoins, onDraw }: GachaModalProps) {
  const [state, setState] = useState<DrawState>("idle");
  const [result, setResult] = useState<DrawResult | null>(null);
  const [coins, setCoins] = useState(pawCoins);

  const handleDraw = useCallback(async () => {
    setState("drawing");

    try {
      const drawResult = await onDraw();
      setResult(drawResult);
      setCoins(drawResult.pawCoins);

      setTimeout(() => {
        setState("revealed");
      }, 800);
    } catch {
      setState("idle");
    }
  }, [onDraw]);

  const handleDrawAgain = useCallback(() => {
    setResult(null);
    setState("idle");
  }, []);

  const celebration = result ? RARITY_CELEBRATION[result.buddy.rarity] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Idle state */}
        {state === "idle" && (
          <div className="text-center">
            <div className="text-6xl mb-4 animate-float">{"\uD83D\uDC3E"}</div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              抽取伙伴！
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              花费 {DRAW_COST} 个爪爪币召唤一个随机伙伴
            </p>

            {/* Rarity rates */}
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
              <span className="rarity-text-common">普通 60%</span>
              <span className="rarity-text-uncommon">不常见 25%</span>
              <span className="rarity-text-rare">稀有 10%</span>
              <span className="rarity-text-epic">史诗 4%</span>
              <span className="rarity-text-legendary">传说 1%</span>
            </div>

            {/* Coin balance */}
            <div className="mt-5 flex items-center justify-center gap-1.5">
              <span>{"\uD83E\uDE99"}</span>
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                {coins} 个爪爪币
              </span>
            </div>

            {/* Draw button */}
            <button
              onClick={handleDraw}
              disabled={coins < DRAW_COST}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 text-white px-6 py-3 text-sm font-bold transition-all shadow-md hover:shadow-lg disabled:shadow-none disabled:cursor-not-allowed"
            >
              {coins < DRAW_COST
                ? `还差 ${DRAW_COST - coins} 个爪爪币`
                : `抽取（${DRAW_COST} 爪爪币）`}
            </button>
          </div>
        )}

        {/* Drawing state - card flip animation */}
        {state === "drawing" && (
          <div className="text-center py-8">
            <div className="perspective mx-auto w-48 h-56">
              <div className="w-full h-full animate-card-flip rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
                <span className="text-5xl text-white">{"\uD83D\uDC3E"}</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-400 dark:text-gray-500 animate-pulse">
              正在召唤新伙伴...
            </p>
          </div>
        )}

        {/* Revealed state */}
        {state === "revealed" && result && (
          <div className="text-center">
            {/* Shiny callout */}
            {result.buddy.isShiny && (
              <p className="text-sm font-bold text-pink-500 mb-1 animate-pulse">
                &#10024; 闪光！ &#10024;
              </p>
            )}

            {/* Celebration text */}
            <p className={`text-lg font-black mb-4 ${celebration?.color}`}>
              {celebration?.text}
            </p>

            {/* Buddy card */}
            <div className="max-w-[200px] mx-auto">
              <BuddyCard buddy={result.buddy} isNew />
            </div>

            {/* Updated coin balance */}
            <div className="mt-4 flex items-center justify-center gap-1.5">
              <span>{"\uD83E\uDE99"}</span>
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                剩余 {coins} 个爪爪币
              </span>
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex gap-3">
              {coins >= DRAW_COST && (
                <button
                  onClick={handleDrawAgain}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-4 py-2.5 text-sm font-medium transition-all"
                >
                  再抽一次
                </button>
              )}
              <button
                onClick={onClose}
                className={`${coins >= DRAW_COST ? "flex-1" : "w-full"} rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2.5 text-sm font-medium transition-all`}
              >
                太棒了！
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
