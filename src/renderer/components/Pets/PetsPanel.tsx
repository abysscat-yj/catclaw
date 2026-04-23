// PetsPanel - buddy collection view with gacha draw and active buddy selection

import React, { useCallback, useEffect, useState } from "react";
import { usePetStore } from "../../stores/pet-store";
import { RARITIES } from "../../data/buddy-data";
import BuddyCard from "./PetCard";
import GachaModal from "./GachaModal";

export default function PetsPanel() {
  const buddies = usePetStore((s) => s.buddies);
  const activeBuddy = usePetStore((s) => s.activeBuddy);
  const pawCoins = usePetStore((s) => s.pawCoins);
  const loaded = usePetStore((s) => s.loaded);
  const setBuddies = usePetStore((s) => s.setBuddies);
  const setActiveBuddy = usePetStore((s) => s.setActiveBuddy);
  const setCoins = usePetStore((s) => s.setCoins);
  const setLoaded = usePetStore((s) => s.setLoaded);
  const addBuddy = usePetStore((s) => s.addBuddy);

  const [showGacha, setShowGacha] = useState(false);

  useEffect(() => {
    async function load() {
      const [buddyList, stats, active] = await Promise.all([
        window.catclaw.listBuddies(),
        window.catclaw.getPetStats(),
        window.catclaw.getActiveBuddy(),
      ]);
      setBuddies(buddyList);
      setCoins(stats.pawCoins);
      setActiveBuddy(active);
      setLoaded(true);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(async () => {
    const [buddyList, stats, active] = await Promise.all([
      window.catclaw.listBuddies(),
      window.catclaw.getPetStats(),
      window.catclaw.getActiveBuddy(),
    ]);
    setBuddies(buddyList);
    setCoins(stats.pawCoins);
    setActiveBuddy(active);
  }, [setBuddies, setCoins, setActiveBuddy]);

  const handleDraw = useCallback(async (): Promise<DrawResult> => {
    const result = await window.catclaw.drawBuddy();
    addBuddy(result.buddy);
    setCoins(result.pawCoins);
    // If this is the first buddy, it becomes active automatically
    if (buddies.length === 0) {
      setActiveBuddy(result.buddy);
    }
    return result;
  }, [addBuddy, setCoins, setActiveBuddy, buddies.length]);

  const handleCloseGacha = useCallback(() => {
    setShowGacha(false);
    refresh();
  }, [refresh]);

  const handleSetActive = useCallback(async (buddy: BuddyRecord) => {
    await window.catclaw.setActiveBuddy(buddy.id);
    setActiveBuddy(buddy);
  }, [setActiveBuddy]);

  const rarityCount = (rarity: string) => buddies.filter((b) => b.rarity === rarity).length;
  const shinyCount = buddies.filter((b) => b.isShiny).length;

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        加载中...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            伙伴收藏
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            已收集 {buddies.length} 只伙伴
            {shinyCount > 0 && <span className="ml-2">&#10024; {shinyCount} 闪光</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <span>{"\uD83E\uDE99"}</span>
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              {pawCoins}
            </span>
          </div>
          <button
            onClick={() => setShowGacha(true)}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-4 py-2 text-sm font-medium transition-all shadow-md hover:shadow-lg"
          >
            {"\uD83C\uDFB2"} 抽取伙伴
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {buddies.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">{"\uD83D\uDC3E"}</div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              还没有伙伴！
            </h3>
            <p className="text-sm text-gray-400 mt-2">
              抽取你的第一只伙伴，开始收藏之旅。
              <br />
              每只伙伴都有独特的种族、属性与稀有度！
            </p>
            <button
              onClick={() => setShowGacha(true)}
              className="mt-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-3 text-sm font-bold transition-all shadow-md hover:shadow-lg"
            >
              {"\uD83C\uDFB2"} 抽取你的第一只伙伴！
            </button>
          </div>
        ) : (
          <>
            {/* Rarity stats */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {(["common", "uncommon", "rare", "epic", "legendary"] as const).map((r) => (
                <RarityStat key={r} rarity={r} count={rarityCount(r)} />
              ))}
            </div>

            {/* Active buddy hint */}
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              点击伙伴可将它设为侧边栏中的当前陪伴。
            </p>

            {/* Buddy grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {buddies.map((buddy) => (
                <BuddyCard
                  key={buddy.id}
                  buddy={buddy}
                  selected={activeBuddy?.id === buddy.id}
                  onClick={() => handleSetActive(buddy)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {showGacha && (
        <GachaModal
          onClose={handleCloseGacha}
          pawCoins={pawCoins}
          onDraw={handleDraw}
        />
      )}
    </div>
  );
}

function RarityStat({ rarity, count }: { rarity: string; count: number }) {
  const rc = RARITIES[rarity] || RARITIES.common;
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium ${rc.textClass}`}>
      <span>{rc.name}</span>
      <span className="font-bold">{count}</span>
    </div>
  );
}
