'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PropLineDto, PropStatType } from '@props-analyzer/shared-types';
import {
  STAT_TYPE_LABELS,
  STAT_TYPE_ABBREVIATIONS,
  formatAmericanOdds,
} from '@props-analyzer/shared-types';
import {
  evidenceLevel,
  summarizeWindow,
  windowOptions,
  type EvidenceLevel,
} from './prop-stats';

function formatChartDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatTooltipDate(iso: string): string {
  const date = new Date(iso);
  const yy = String(date.getFullYear()).slice(-2);
  return `${date.getMonth() + 1}/${date.getDate()}/${yy}`;
}

function formatPct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

const EVIDENCE_COLORS: Record<EvidenceLevel, string> = {
  High: 'text-mint-400',
  Moderate: 'text-gold-400',
  Limited: 'text-coral-400',
  Insufficient: 'text-slate-500',
};

function StatPill({
  prop,
  selected,
  onSelect,
}: {
  prop: PropLineDto;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex shrink-0 flex-col items-start rounded-xl border px-4 py-2.5 text-left transition-colors ${
        selected
          ? 'border-azure-400 bg-azure-500/10'
          : 'border-line-700 bg-ink-800 hover:border-line-700 hover:bg-ink-750'
      }`}
    >
      <span className="font-display text-sm font-bold text-white">
        {prop.line} {STAT_TYPE_ABBREVIATIONS[prop.statType]}
      </span>
      <span className="tabular mt-0.5 text-xs text-slate-500">
        O {formatAmericanOdds(prop.overOdds)} | U{' '}
        {formatAmericanOdds(prop.underOdds)}
      </span>
    </button>
  );
}

function SummaryStat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-l border-line-800 pl-4 first:border-0 first:pl-0">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <span className="font-display text-lg font-bold text-white">
        {children}
      </span>
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: number[];
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg border border-line-800 bg-ink-850 p-1">
      {options.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`rounded-md px-3 py-1 text-xs font-bold transition-colors ${
            value === n
              ? 'bg-azure-500 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          L{n}
        </button>
      ))}
    </div>
  );
}

export function PropAnalysis({
  playerName,
  propLines,
  selectedStatType,
  onSelectStatType,
}: {
  playerName: string;
  propLines: PropLineDto[];
  selectedStatType: PropStatType;
  onSelectStatType: (statType: PropStatType) => void;
}) {
  const selected = useMemo(
    () =>
      propLines.find((prop) => prop.statType === selectedStatType) ??
      propLines[0],
    [propLines, selectedStatType]
  );

  const totalGames = selected.games.length;
  const options = useMemo(() => windowOptions(totalGames), [totalGames]);
  const defaultWindow = options.includes(15) ? 15 : options[options.length - 1];

  const [timeframe, setTimeframe] = useState(defaultWindow);
  const [altLine, setAltLine] = useState(selected.line);
  const [hovered, setHovered] = useState<number | null>(null);

  // Switching markets resets the alt line to that market's consensus line and
  // re-clamps the timeframe to what the new series supports.
  useEffect(() => {
    setAltLine(selected.line);
    setHovered(null);
    setTimeframe((current) =>
      options.includes(current) ? current : defaultWindow
    );
  }, [selected.line, options, defaultWindow]);

  const windowGames = useMemo(
    () => selected.games.slice(-timeframe),
    [selected.games, timeframe]
  );

  const atAltLine = summarizeWindow(windowGames, altLine);
  const atConsensus = summarizeWindow(windowGames, selected.line);
  const seasonAtConsensus = summarizeWindow(selected.games, selected.line);
  const evidence = evidenceLevel(windowGames);

  const label = STAT_TYPE_LABELS[selected.statType];
  const isAltLine = altLine !== selected.line;

  const sliderMax = Math.max(4, Math.ceil(atAltLine.max * 1.1));

  // Scale is fixed by the data and the slider's full range, NOT the live alt
  // line — so dragging the slider glides the reference line without rescaling
  // (and jiggling) the bars underneath it.
  const niceMax = useMemo(() => {
    const peak = Math.max(atAltLine.max, selected.line, sliderMax, 1);
    return Math.max(4, Math.ceil(peak / 4) * 4);
  }, [atAltLine.max, selected.line, sliderMax]);

  const ticks = [1, 0.75, 0.5, 0.25, 0].map((f) =>
    Math.round(niceMax * f * 10) / 10
  );

  return (
    <section className="flex flex-col gap-6">
      {/* Market selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {propLines.map((prop) => (
          <StatPill
            key={prop.statType}
            prop={prop}
            selected={prop.statType === selectedStatType}
            onSelect={() => onSelectStatType(prop.statType)}
          />
        ))}
      </div>

      <h2 className="font-display text-2xl font-extrabold tracking-tight text-white">
        {playerName} {label} Prop
      </h2>

      {/* Summary row */}
      <div className="flex flex-wrap gap-6 rounded-xl border border-line-800 bg-ink-800 px-6 py-5">
        <SummaryStat label="Consensus Line">
          <span className="tabular">{selected.line}</span>{' '}
          <span className="text-xs font-medium text-slate-400">
            O {formatAmericanOdds(selected.overOdds)} / U{' '}
            {formatAmericanOdds(selected.underOdds)}
          </span>
        </SummaryStat>
        <SummaryStat label="Projection">
          <span className="tabular">{selected.projection}</span>{' '}
          <span className="text-xs font-medium text-slate-400">
            {selected.projection > selected.line ? 'over' : 'under'}
          </span>
        </SummaryStat>
        <SummaryStat label="Season Record">
          <span className="tabular">
            {seasonAtConsensus.overCount}-{seasonAtConsensus.underCount}
          </span>{' '}
          <span className="text-xs font-medium text-slate-400">O-U</span>
        </SummaryStat>
        <SummaryStat label="Evidence">
          <span className={EVIDENCE_COLORS[evidence]}>{evidence}</span>
        </SummaryStat>
      </div>

      {/* Chart card */}
      <div className="rounded-xl border border-line-800 bg-ink-800 p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold text-white">
              Prop Analysis
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              The Over hit{' '}
              <span className="font-bold text-mint-400">
                {atConsensus.overCount}/{atConsensus.count}
              </span>{' '}
              in the last {atConsensus.count} games at a line of{' '}
              <span className="tabular font-semibold text-white">
                {selected.line}
              </span>
              .
            </p>
          </div>
          <Segmented
            options={options}
            value={timeframe}
            onChange={setTimeframe}
          />
        </div>

        {/* Plot */}
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="flex gap-3">
              {/* y axis */}
              <div className="relative h-64 w-9 shrink-0">
                {ticks.map((t, i) => (
                  <span
                    key={t}
                    className="tabular absolute right-0 -translate-y-1/2 text-[10px] text-slate-600"
                    style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* plot area */}
              <div className="relative h-64 flex-1">
                {/* gridlines */}
                {ticks.map((t, i) => (
                  <div
                    key={t}
                    className="absolute inset-x-0 border-t border-line-800/60"
                    style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
                  />
                ))}

                {/* reference line at the (alt) line */}
                <div
                  className="absolute inset-x-0 z-10 flex items-center transition-[bottom] duration-150 ease-out"
                  style={{ bottom: `${(altLine / niceMax) * 100}%` }}
                >
                  <div
                    className={`h-0.5 w-full ${
                      isAltLine ? 'bg-gold-400' : 'bg-white/85'
                    }`}
                  />
                  <span
                    className={`tabular absolute right-0 -top-5 rounded px-1.5 py-0.5 text-xs font-bold ${
                      isAltLine
                        ? 'bg-gold-400 text-ink-900'
                        : 'bg-white/90 text-ink-900'
                    }`}
                  >
                    {altLine}
                  </span>
                </div>

                {/* bars */}
                <div
                  className="absolute inset-0 flex items-end gap-1.5"
                  onMouseLeave={() => setHovered(null)}
                >
                  {windowGames.map((game, index) => {
                    const isOver = game.value > altLine;
                    const heightPct = (game.value / niceMax) * 100;
                    const dimmed = hovered !== null && hovered !== index;
                    return (
                      <div
                        key={`${game.gameId}-${index}`}
                        onMouseEnter={() => setHovered(index)}
                        className="relative flex h-full min-w-[24px] flex-1 items-end"
                      >
                        <div
                          className="w-full rounded-t-[4px] transition-[height,background-color,opacity] duration-200 ease-out"
                          style={{
                            height: `${heightPct}%`,
                            opacity: dimmed ? 0.55 : 1,
                            backgroundColor: isOver
                              ? 'var(--color-chart-over)'
                              : 'var(--color-chart-under)',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Single floating tooltip for the hovered bar. Anchored near
                    the top so it never has to overflow the plot, and clamped
                    left/right so edge bars don't push it off the chart. */}
                {hovered !== null &&
                  hovered < windowGames.length &&
                  (() => {
                    const game = windowGames[hovered];
                    const isOver = game.value > altLine;
                    const leftPct = ((hovered + 0.5) / windowGames.length) * 100;
                    const transform =
                      leftPct < 20
                        ? 'translateX(0)'
                        : leftPct > 80
                          ? 'translateX(-100%)'
                          : 'translateX(-50%)';

                    return (
                      <div
                        className="pointer-events-none absolute top-2 z-30 w-56 rounded-xl border border-line-700 bg-ink-950/95 p-3 shadow-xl"
                        style={{ left: `${leftPct}%`, transform }}
                      >
                        <div className="flex items-center justify-between border-b border-line-800 pb-2">
                          <span className="font-display text-sm font-bold text-white">
                            {game.isHome ? '' : '@'}
                            {game.opponentAbbreviation}
                          </span>
                          <span className="tabular text-xs text-slate-500">
                            {formatTooltipDate(game.date)}
                          </span>
                        </div>
                        <ul className="mt-2.5 flex flex-col gap-2 text-sm">
                          <li className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-slate-400">
                              <span
                                className="h-2.5 w-2.5 rounded-sm"
                                style={{
                                  backgroundColor: isOver
                                    ? 'var(--color-chart-over)'
                                    : 'var(--color-chart-under)',
                                }}
                              />
                              Result
                            </span>
                            <span
                              className={`tabular font-bold ${
                                isOver ? 'text-mint-400' : 'text-coral-400'
                              }`}
                            >
                              {game.value}
                            </span>
                          </li>
                          <li className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-slate-400">
                              <span className="h-0.5 w-3 rounded bg-white/85" />
                              Current Line
                            </span>
                            <span className="tabular font-semibold text-slate-200">
                              {altLine}
                            </span>
                          </li>
                          <li className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-slate-400">
                              <span className="h-2.5 w-2.5 rounded-full bg-azure-400/70" />
                              Consensus Line
                            </span>
                            <span className="tabular font-semibold text-slate-200">
                              {selected.line}
                            </span>
                          </li>
                        </ul>
                      </div>
                    );
                  })()}
              </div>
            </div>

            {/* x axis labels */}
            <div className="mt-2 flex gap-3">
              <div className="w-9 shrink-0" />
              <div className="flex flex-1 gap-1.5">
                {windowGames.map((game, index) => (
                  <div
                    key={`${game.gameId}-${index}-label`}
                    className="min-w-[24px] flex-1 text-center"
                  >
                    <div className="text-[10px] font-semibold text-slate-400">
                      {game.isHome ? '' : '@'}
                      {game.opponentAbbreviation}
                    </div>
                    <div className="tabular text-[10px] text-slate-600">
                      {formatChartDate(game.date)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend + alt line */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-6 border-t border-line-800 pt-5">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: 'var(--color-chart-over)' }}
              />
              Over
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: 'var(--color-chart-under)' }}
              />
              Under
            </span>
          </div>

          <div className="flex flex-1 items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Alt Line
              </span>
              <span className="tabular font-display text-sm font-bold text-white">
                {altLine}
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={sliderMax}
              step={0.5}
              value={altLine}
              onChange={(event) => setAltLine(Number(event.target.value))}
              className="h-1.5 flex-1 cursor-pointer accent-gold-400"
              aria-label={`Alternate ${label} line`}
            />
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Over Win %
              </span>
              <span className="tabular font-display text-sm font-bold text-mint-400">
                {atAltLine.overCount}/{atAltLine.count} (
                {formatPct(atAltLine.overRate)})
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
