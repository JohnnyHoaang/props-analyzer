'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PropLineDto, PropStatType } from '@props-analyzer/shared-types';
import {
  STAT_TYPE_LABELS,
  STAT_TYPE_ABBREVIATIONS,
  formatAmericanOdds,
} from '@props-analyzer/shared-types';
import {
  balancedChartPageSize,
  chartPageCount,
  chartPageSlice,
  CHART_GAMES_PER_PAGE,
  defaultChartPageIndex,
  evidenceLevel,
  filterGamesByBlowout,
  filterGamesByLocation,
  formatChartAxisDate,
  formatChartPageRange,
  gamesSpanMultipleYears,
  MOBILE_CHART_GAMES_PER_PAGE,
  shouldShowChartAxisLabel,
  summarizeWindow,
  windowOptions,
  type EvidenceLevel,
} from './prop-stats';
import {
  ChartFilters,
  DEFAULT_CHART_FILTERS,
  type ChartFilterState,
} from './chart-filters';

/**
 * Tracks whether the viewport is phone-sized so the chart can page through
 * fewer, wider bars there. SSR-safe: renders desktop-first, then corrects
 * after mount (and on resize / orientation change).
 */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return;
    }
    const query = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return isMobile;
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
    <div className="flex flex-col gap-1 sm:border-l sm:border-line-800 sm:pl-4 sm:first:border-0 sm:first:pl-0">
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

function ChartPager({
  pageIndex,
  pageCount,
  rangeLabel,
  onPrevious,
  onNext,
}: {
  pageIndex: number;
  pageCount: number;
  rangeLabel: string;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <div className="mb-4 flex items-center justify-end gap-2">
      <span className="tabular text-xs text-slate-500">{rangeLabel}</span>
      <button
        type="button"
        onClick={onPrevious}
        disabled={pageIndex === 0}
        aria-label="Previous games"
        className="rounded-md border border-line-700 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors hover:border-line-700 hover:bg-ink-750 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      <span className="tabular text-xs font-semibold text-slate-400">
        {pageIndex + 1} / {pageCount}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={pageIndex >= pageCount - 1}
        aria-label="Next games"
        className="rounded-md border border-line-700 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors hover:border-line-700 hover:bg-ink-750 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
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

  const [filters, setFilters] = useState<ChartFilterState>(
    DEFAULT_CHART_FILTERS
  );

  // The whole analysis (bars, hit rates, evidence, record) runs on this
  // filtered subset; `selected` still supplies market metadata (line, odds).
  // Filters are independent predicates, so composition order doesn't matter.
  const filteredGames = useMemo(
    () =>
      filterGamesByBlowout(
        filterGamesByLocation(selected.games, filters.location),
        filters.blowout
      ),
    [selected.games, filters.location, filters.blowout]
  );

  const totalGames = filteredGames.length;
  const options = useMemo(() => windowOptions(totalGames), [totalGames]);
  const defaultWindow = options.includes(15) ? 15 : options[options.length - 1];

  const isMobile = useIsMobile();
  const [timeframe, setTimeframe] = useState(defaultWindow);
  const [chartPage, setChartPage] = useState(0);
  const [altLine, setAltLine] = useState(selected.line);
  const [hovered, setHovered] = useState<number | null>(null);

  // Switching markets — or changing a filter, which reshapes `options`/
  // `defaultWindow` the same way — resets the alt line to the consensus line
  // and re-clamps the timeframe to what the (now smaller) series supports.
  useEffect(() => {
    setAltLine(selected.line);
    setHovered(null);
    setTimeframe((current) =>
      options.includes(current) ? current : defaultWindow
    );
  }, [selected.line, options, defaultWindow]);

  const windowGames = useMemo(
    () => filteredGames.slice(-timeframe),
    [filteredGames, timeframe]
  );

  // On phones, spread the window across more pages of fewer, wider bars so
  // they stay readable and tappable; keep the roomy 20/page on larger screens.
  const pageSize = useMemo(
    () =>
      isMobile
        ? balancedChartPageSize(windowGames.length, MOBILE_CHART_GAMES_PER_PAGE)
        : CHART_GAMES_PER_PAGE,
    [isMobile, windowGames.length]
  );

  const pageCount = chartPageCount(windowGames.length, pageSize);

  // Jump to the most recent page whenever the timeframe (or page size, e.g. on
  // a rotate/resize across the mobile breakpoint) changes.
  useEffect(() => {
    setChartPage(defaultChartPageIndex(windowGames.length, pageSize));
    setHovered(null);
  }, [timeframe, windowGames.length, pageSize]);

  const visibleGames = useMemo(
    () => chartPageSlice(windowGames, chartPage, pageSize),
    [windowGames, chartPage, pageSize]
  );

  const pageRangeLabel = formatChartPageRange(
    chartPage,
    windowGames.length,
    pageSize
  );

  const includeYearOnAxis = useMemo(
    () => gamesSpanMultipleYears(visibleGames),
    [visibleGames]
  );

  const atAltLine = summarizeWindow(windowGames, altLine);
  const atConsensus = summarizeWindow(windowGames, selected.line);
  const seasonAtConsensus = summarizeWindow(filteredGames, selected.line);
  const evidence = evidenceLevel(windowGames);

  const label = STAT_TYPE_LABELS[selected.statType];
  const isAltLine = altLine !== selected.line;

  // Slider tops out just above the window's biggest result, but never below
  // the consensus line — so the line the alt line resets to is always in range.
  const sliderMax = Math.max(
    4,
    Math.ceil(Math.max(atAltLine.max, selected.line) * 1.1)
  );

  // Changing the timeframe can shrink the window to games that never reach the
  // current alt line (e.g. leaving the full-season window for a recent-games
  // one). When that happens the line would sit off the top of the chart with
  // the slider pinned, so snap it back to the consensus/prop line.
  useEffect(() => {
    if (altLine > sliderMax) {
      setAltLine(selected.line);
    }
  }, [altLine, sliderMax, selected.line]);

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

  // Shared across the normal and empty states so the market pills, title, and
  // filters stay put while the analysis below them appears or disappears.
  const header = (
    <>
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

      {/* Filters */}
      <ChartFilters filters={filters} onChange={setFilters} />
    </>
  );

  if (filteredGames.length === 0) {
    return (
      <section className="flex flex-col gap-6">
        {header}
        <div className="rounded-xl border border-line-800 bg-ink-800 px-6 py-10 text-center text-sm text-slate-400">
          No games match the current filters.
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      {header}

      {/* Summary row */}
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-line-800 bg-ink-800 px-5 py-4 sm:flex sm:flex-wrap sm:gap-6 sm:px-6 sm:py-5">
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
      <div className="rounded-xl border border-line-800 bg-ink-800 p-4 sm:p-6">
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
            onChange={(n) => {
              setHovered(null);
              setTimeframe(n);
              const nextLength = Math.min(n, filteredGames.length);
              const nextPageSize = isMobile
                ? balancedChartPageSize(
                    nextLength,
                    MOBILE_CHART_GAMES_PER_PAGE
                  )
                : CHART_GAMES_PER_PAGE;
              setChartPage(defaultChartPageIndex(nextLength, nextPageSize));
            }}
          />
        </div>

        <ChartPager
          pageIndex={chartPage}
          pageCount={pageCount}
          rangeLabel={pageRangeLabel}
          onPrevious={() => {
            setHovered(null);
            setChartPage((current) => Math.max(0, current - 1));
          }}
          onNext={() => {
            setHovered(null);
            setChartPage((current) => Math.min(pageCount - 1, current + 1));
          }}
        />

        {/* Plot — no horizontal scroll; paginate instead so tooltips stay
            aligned with bar columns. */}
        <div>
          <div>
            <div className="flex gap-3">
              {/* y axis */}
              <div className="relative h-56 w-9 shrink-0 sm:h-64">
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
              <div className="relative h-56 flex-1 sm:h-64">
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

                {/* bars — keyed by timeframe so switching the game window
                    remounts them and replays the grow-up animation. */}
                <div
                  key={`${timeframe}-${chartPage}`}
                  className="absolute inset-0 flex items-end gap-1.5"
                  onMouseLeave={() => setHovered(null)}
                  // Tapping empty space between/around bars dismisses the
                  // touch-opened tooltip.
                  onClick={() => setHovered(null)}
                >
                  {visibleGames.map((game, index) => {
                    const isOver = game.value > altLine;
                    const heightPct = (game.value / niceMax) * 100;
                    const dimmed = hovered !== null && hovered !== index;
                    // Bounded left-to-right stagger: total sweep stays ~250ms
                    // regardless of how many games are in the window.
                    const delayMs =
                      (index / Math.max(visibleGames.length - 1, 1)) * 250;
                    return (
                      <div
                        key={`${game.gameId}-${index}`}
                        onMouseEnter={() => setHovered(index)}
                        // Tap toggles this bar's tooltip (touch has no hover);
                        // stop the tap from bubbling to the dismiss handler.
                        onClick={(event) => {
                          event.stopPropagation();
                          setHovered((current) =>
                            current === index ? null : index
                          );
                        }}
                        className="relative flex h-full min-w-0 flex-1 cursor-pointer items-end"
                      >
                        <div
                          className="animate-bar-grow w-full rounded-t-[4px] transition-[height,background-color,opacity] duration-200 ease-out"
                          style={{
                            height: `${heightPct}%`,
                            opacity: dimmed ? 0.55 : 1,
                            backgroundColor: isOver
                              ? 'var(--color-chart-over)'
                              : 'var(--color-chart-under)',
                            animationDelay: `${delayMs}ms`,
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
                  hovered < visibleGames.length &&
                  (() => {
                    const game = visibleGames[hovered];
                    const isOver = game.value > altLine;
                    const leftPct =
                      ((hovered + 0.5) / visibleGames.length) * 100;
                    const transform =
                      leftPct < 20
                        ? 'translateX(0)'
                        : leftPct > 80
                          ? 'translateX(-100%)'
                          : 'translateX(-50%)';

                    return (
                      <div
                        className="pointer-events-none absolute top-2 z-30 w-[70vw] max-w-56 rounded-xl border border-line-700 bg-ink-950/95 p-3 shadow-xl"
                        style={{ left: `${leftPct}%`, transform }}
                      >
                        <div className="flex items-center justify-between border-b border-line-800 pb-2">
                          <span className="font-display text-sm font-bold text-white">
                            {game.isHome ? '' : '@'}
                            {game.opponentAbbreviation}
                          </span>
                          <span className="tabular text-xs text-slate-500">
                            {formatChartAxisDate(game.date, true)}
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
                {visibleGames.map((game, index) => {
                  const showLabel = shouldShowChartAxisLabel(
                    index,
                    visibleGames.length
                  );

                  return (
                    <div
                      key={`${game.gameId}-${index}-label`}
                      className="min-w-0 flex-1 text-center"
                    >
                    {showLabel ? (
                      <>
                        <div className="text-[10px] font-semibold text-slate-400">
                          {game.isHome ? '' : '@'}
                          {game.opponentAbbreviation}
                        </div>
                        <div className="tabular text-[10px] text-slate-600">
                          {formatChartAxisDate(game.date, includeYearOnAxis)}
                        </div>
                      </>
                    ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Legend + alt line */}
        <div className="mt-6 flex flex-col items-start gap-5 border-t border-line-800 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-6">
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

          <div className="flex w-full items-center gap-4 sm:flex-1">
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
