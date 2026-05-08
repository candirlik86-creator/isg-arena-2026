"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ForkliftChallengeFlowItem, ForkliftPenalties, ForkliftRun } from "@/lib/game-state";

type ForkliftChallengeProps = {
  item: ForkliftChallengeFlowItem;
  existingRun?: ForkliftRun;
  disabled?: boolean;
  onComplete?: (run: Omit<ForkliftRun, "submittedAt">) => void;
};

type Position = {
  x: number;
  y: number;
};

const boardWidth = 12;
const boardHeight = 8;
const startPosition: Position = { x: 1, y: 6 };
const pickupPosition: Position = { x: 2, y: 1 };
const dropoffPosition: Position = { x: 10, y: 1 };
const obstacles: Array<Position & { label: string }> = [
  { x: 4, y: 2, label: "Koni" },
  { x: 5, y: 6, label: "Palet" },
  { x: 8, y: 3, label: "Koni" },
  { x: 9, y: 5, label: "Palet" },
];
const pedestrianCells: Position[] = Array.from({ length: 8 }, (_, index) => ({ x: index + 2, y: 4 }));
const blindSpotCells: Position[] = [
  { x: 6, y: 2 },
  { x: 7, y: 2 },
  { x: 6, y: 3 },
];

const initialPenalties: ForkliftPenalties = {
  pedestrian: 0,
  collision: 0,
  speeding: 0,
  horn: 0,
};

function samePosition(a: Position, b: Position) {
  return a.x === b.x && a.y === b.y;
}

function containsPosition(list: Position[], position: Position) {
  return list.some((entry) => samePosition(entry, position));
}

function calculateForkliftScore(penalties: ForkliftPenalties, durationMs: number, timeLimitSeconds: number) {
  const penaltyTotal = penalties.pedestrian * 120 + penalties.collision * 160 + penalties.speeding * 70 + penalties.horn * 120;
  const safetyScore = Math.max(0, 800 - penaltyTotal);
  const timeRatio = Math.max(0, 1 - durationMs / (timeLimitSeconds * 1000));
  const timeBonus = Math.round(200 * timeRatio);

  return {
    safetyScore,
    timeBonus,
    score: safetyScore + timeBonus,
  };
}

function getCellLabel(position: Position) {
  if (samePosition(position, pickupPosition)) {
    return "Yük";
  }

  if (samePosition(position, dropoffPosition)) {
    return "Güvenli Alan";
  }

  const obstacle = obstacles.find((entry) => samePosition(entry, position));
  if (obstacle) {
    return obstacle.label;
  }

  if (containsPosition(blindSpotCells, position)) {
    return "Kör Nokta";
  }

  if (containsPosition(pedestrianCells, position)) {
    return "Yaya Yolu";
  }

  return "";
}

export function ForkliftChallenge({ item, existingRun, disabled = false, onComplete }: ForkliftChallengeProps) {
  const [position, setPosition] = useState<Position>(startPosition);
  const [hasLoad, setHasLoad] = useState(false);
  const [speedMode, setSpeedMode] = useState<"safe" | "fast">("safe");
  const [hornReady, setHornReady] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [penalties, setPenalties] = useState<ForkliftPenalties>(initialPenalties);
  const [completed, setCompleted] = useState(false);
  const [status, setStatus] = useState(item.message);

  useEffect(() => {
    if (!startTime || completed) {
      return undefined;
    }

    const timer = window.setInterval(() => setDurationMs(Date.now() - startTime), 300);
    return () => window.clearInterval(timer);
  }, [completed, startTime]);

  const scorePreview = useMemo(() => {
    if (existingRun) {
      return {
        score: existingRun.score,
        safetyScore: existingRun.safetyScore,
        timeBonus: existingRun.timeBonus,
      };
    }

    return calculateForkliftScore(penalties, durationMs, item.timeLimitSeconds);
  }, [durationMs, existingRun, item.timeLimitSeconds, penalties]);

  const completeRun = useCallback(
    (nextPenalties: ForkliftPenalties, nextDurationMs: number) => {
      const score = calculateForkliftScore(nextPenalties, nextDurationMs, item.timeLimitSeconds);
      const run: Omit<ForkliftRun, "submittedAt"> = {
        itemId: item.id,
        score: score.score,
        safetyScore: score.safetyScore,
        timeBonus: score.timeBonus,
        durationMs: nextDurationMs,
        completed: true,
        penalties: nextPenalties,
      };

      setCompleted(true);
      setStatus("Yük güvenli alana ulaştı. Skor gönderildi.");
      onComplete?.(run);
    },
    [item.id, item.timeLimitSeconds, onComplete],
  );

  const move = useCallback(
    (dx: number, dy: number) => {
      if (disabled || existingRun || completed) {
        return;
      }

      const startedAt = startTime ?? Date.now();
      if (!startTime) {
        setStartTime(startedAt);
      }

      const target = {
        x: Math.max(0, Math.min(boardWidth - 1, position.x + dx)),
        y: Math.max(0, Math.min(boardHeight - 1, position.y + dy)),
      };

      if (samePosition(target, position)) {
        return;
      }

      const nextPenalties = { ...penalties };
      const obstacle = obstacles.find((entry) => samePosition(entry, target));

      if (obstacle) {
        nextPenalties.collision += 1;
        setPenalties(nextPenalties);
        setHornReady(false);
        setStatus(`${obstacle.label} çarpışması: güvenli davranış puanı düştü.`);
        return;
      }

      if (speedMode === "fast") {
        nextPenalties.speeding += 1;
      }

      if (containsPosition(pedestrianCells, target)) {
        nextPenalties.pedestrian += 1;
      }

      if (containsPosition(blindSpotCells, target) && !hornReady) {
        nextPenalties.horn += 1;
        setStatus("Kör noktaya korna kullanmadan girdiniz.");
      } else if (containsPosition(blindSpotCells, target) && hornReady) {
        setStatus("Kör noktada korna kullanıldı. Güvenli karar.");
      } else if (containsPosition(pedestrianCells, target)) {
        setStatus("Yaya yoluna girildi. Rota güvenli değil.");
      } else if (speedMode === "fast") {
        setStatus("Hız limiti aşıldı. Süre değil güvenlik öncelikli.");
      } else {
        setStatus(hasLoad ? "Yük kontrollü taşınıyor." : "Yüke yaklaşın ve güvenli rotayı koruyun.");
      }

      const nextHasLoad = hasLoad || samePosition(target, pickupPosition);
      const nextDurationMs = Date.now() - startedAt;

      setPosition(target);
      setHasLoad(nextHasLoad);
      setPenalties(nextPenalties);
      setDurationMs(nextDurationMs);
      setHornReady(false);

      if (nextHasLoad && samePosition(target, dropoffPosition)) {
        completeRun(nextPenalties, nextDurationMs);
      }
    },
    [completeRun, completed, disabled, existingRun, hasLoad, hornReady, penalties, position, speedMode, startTime],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        move(0, -1);
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        move(0, 1);
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        move(-1, 0);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        move(1, 0);
      }

      if (event.key.toLocaleLowerCase("tr-TR") === "h") {
        setHornReady(true);
        setStatus("Korna hazır. Bir sonraki kör nokta geçişi güvenli sayılır.");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [move]);

  const resetLocalRun = () => {
    setPosition(startPosition);
    setHasLoad(false);
    setSpeedMode("safe");
    setHornReady(false);
    setStartTime(null);
    setDurationMs(0);
    setPenalties(initialPenalties);
    setCompleted(false);
    setStatus(item.message);
  };

  const cells = Array.from({ length: boardWidth * boardHeight }, (_, index) => ({
    x: index % boardWidth,
    y: Math.floor(index / boardWidth),
  }));

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-4 shadow-2xl md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.28em] text-amber-200">Final Özel Etap</p>
          <h2 className="mt-2 text-3xl font-black text-white md:text-5xl">{item.title}</h2>
          <p className="mt-3 max-w-3xl text-lg font-semibold text-slate-300">{item.message}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">Güvenli</p>
            <p className="text-2xl font-black text-white">{scorePreview.safetyScore}</p>
          </div>
          <div className="rounded-2xl border border-sky-300/30 bg-sky-400/10 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-200">Süre</p>
            <p className="text-2xl font-black text-white">{scorePreview.timeBonus}</p>
          </div>
          <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-200">Toplam</p>
            <p className="text-2xl font-black text-white">{scorePreview.score}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900 p-3">
          <div
            className="grid aspect-[12/8] min-h-[330px] gap-1"
            style={{
              gridTemplateColumns: `repeat(${boardWidth}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${boardHeight}, minmax(0, 1fr))`,
            }}
          >
            {cells.map((cell) => {
              const isForklift = samePosition(cell, position);
              const isPickup = samePosition(cell, pickupPosition);
              const isDropoff = samePosition(cell, dropoffPosition);
              const isObstacle = obstacles.some((entry) => samePosition(entry, cell));
              const isPedestrian = containsPosition(pedestrianCells, cell);
              const isBlindSpot = containsPosition(blindSpotCells, cell);
              const cellLabel = getCellLabel(cell);

              return (
                <div
                  key={`${cell.x}-${cell.y}`}
                  className={`relative flex min-h-10 items-center justify-center rounded-lg border text-center text-[10px] font-black uppercase leading-tight ${
                    isDropoff
                      ? "border-emerald-300/60 bg-emerald-400/25 text-emerald-50"
                      : isPickup
                      ? "border-amber-300/60 bg-amber-300/25 text-amber-50"
                      : isObstacle
                      ? "border-red-300/60 bg-red-500/25 text-red-50"
                      : isPedestrian
                      ? "border-sky-300/50 bg-sky-400/20 text-sky-50"
                      : isBlindSpot
                      ? "border-fuchsia-300/50 bg-fuchsia-400/20 text-fuchsia-50"
                      : "border-white/5 bg-slate-800 text-slate-500"
                  }`}
                >
                  {cellLabel}
                  {isForklift ? (
                    <div className="absolute inset-1 flex items-center justify-center rounded-md border border-slate-950 bg-amber-300 text-sm font-black text-slate-950 shadow-xl">
                      FL{hasLoad ? "+Y" : ""}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Canlı Durum</p>
            <p className="mt-2 text-lg font-black text-white">{existingRun ? "Skorunuz kaydedildi." : status}</p>
            <p className="mt-3 text-sm font-semibold text-slate-400">Süre: {(durationMs / 1000).toFixed(1)} sn</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Hatalar</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-bold text-slate-200">
              <span>Yaya yolu: {existingRun?.penalties.pedestrian ?? penalties.pedestrian}</span>
              <span>Çarpışma: {existingRun?.penalties.collision ?? penalties.collision}</span>
              <span>Hız: {existingRun?.penalties.speeding ?? penalties.speeding}</span>
              <span>Korna: {existingRun?.penalties.horn ?? penalties.horn}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Kontrol</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <span />
              <button type="button" disabled={disabled || Boolean(existingRun)} onClick={() => move(0, -1)} className="rounded-xl bg-white/[0.08] px-3 py-3 font-black text-white disabled:opacity-40">Yukarı</button>
              <span />
              <button type="button" disabled={disabled || Boolean(existingRun)} onClick={() => move(-1, 0)} className="rounded-xl bg-white/[0.08] px-3 py-3 font-black text-white disabled:opacity-40">Sol</button>
              <button type="button" disabled={disabled || Boolean(existingRun)} onClick={() => move(0, 1)} className="rounded-xl bg-white/[0.08] px-3 py-3 font-black text-white disabled:opacity-40">Aşağı</button>
              <button type="button" disabled={disabled || Boolean(existingRun)} onClick={() => move(1, 0)} className="rounded-xl bg-white/[0.08] px-3 py-3 font-black text-white disabled:opacity-40">Sağ</button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={disabled || Boolean(existingRun)}
                onClick={() => setSpeedMode((value) => (value === "safe" ? "fast" : "safe"))}
                className={`rounded-xl px-3 py-3 font-black ${
                  speedMode === "safe" ? "bg-emerald-400/20 text-emerald-100" : "bg-red-400/20 text-red-100"
                } disabled:opacity-40`}
              >
                {speedMode === "safe" ? "Güvenli Hız" : "Hızlı Mod"}
              </button>
              <button
                type="button"
                disabled={disabled || Boolean(existingRun)}
                onClick={() => {
                  setHornReady(true);
                  setStatus("Korna hazır. Bir sonraki kör nokta geçişi güvenli sayılır.");
                }}
                className={`rounded-xl px-3 py-3 font-black ${
                  hornReady ? "bg-sky-400/25 text-sky-100" : "bg-white/[0.08] text-white"
                } disabled:opacity-40`}
              >
                Korna
              </button>
            </div>
            {!existingRun ? (
              <button type="button" onClick={resetLocalRun} className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 font-black text-slate-200">
                Parkuru Sıfırla
              </button>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}
