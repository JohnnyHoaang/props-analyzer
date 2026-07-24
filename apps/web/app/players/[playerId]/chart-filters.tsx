'use client';

import { useState } from 'react';
import type { BlowoutFilter, GameLocationFilter } from './prop-stats';

/**
 * Game-context filters applied to a market's series before analysis. Shaped as
 * an object so more filters can be added as `FilterBlock`s without changing
 * this component's contract.
 */
export interface ChartFilterState {
  location: GameLocationFilter;
  blowout: BlowoutFilter;
}

export const DEFAULT_CHART_FILTERS: ChartFilterState = {
  location: 'all',
  blowout: 'all',
};

const LOCATION_OPTIONS: { value: GameLocationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'home', label: 'Home' },
  { value: 'away', label: 'Away' },
];

const BLOWOUT_OPTIONS: { value: BlowoutFilter; label: string }[] = [
  { value: 'all', label: 'Include all games' },
  { value: 'exclude-losses', label: 'Exclude losses of 20+' },
  { value: 'exclude-wins', label: 'Exclude wins of 20+' },
  { value: 'exclude-both', label: 'Exclude both' },
];

/** Small segmented button group, styled to match the chart's timeframe control. */
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex gap-1 self-start rounded-lg border border-line-800 bg-ink-850 p-1"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`rounded-md px-4 py-1.5 text-xs font-bold transition-colors ${
            value === option.value
              ? 'bg-azure-500 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Vertical radio list for options with longer, mutually-exclusive labels. */
function RadioGroup<T extends string>({
  name,
  options,
  value,
  onChange,
  ariaLabel,
}: {
  name: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-col gap-2.5">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-2.5 text-sm"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="h-4 w-4 accent-azure-500"
          />
          <span
            className={
              value === option.value ? 'text-white' : 'text-slate-400'
            }
          >
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}

/** One filter: a label, optional description, and its control. */
function FilterBlock({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-slate-300">{label}</span>
        {description ? (
          <p className="text-xs text-slate-500">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** How many filters are set to a non-default (active) value. */
function activeFilterCount(filters: ChartFilterState): number {
  let count = 0;
  if (filters.location !== 'all') {
    count += 1;
  }
  if (filters.blowout !== 'all') {
    count += 1;
  }
  return count;
}

/**
 * Standalone, collapsible Filters section for the prop analysis. The header
 * toggles the panel open/closed; add more `FilterBlock`s inside as the filter
 * set grows.
 */
export function ChartFilters({
  filters,
  onChange,
}: {
  filters: ChartFilterState;
  onChange: (next: ChartFilterState) => void;
}) {
  const [open, setOpen] = useState(false);
  const activeCount = activeFilterCount(filters);

  return (
    <section className="rounded-xl border border-line-800 bg-ink-800">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="chart-filters-panel"
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left sm:px-6"
      >
        <span className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Filters
          </span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-azure-500/15 px-2 py-0.5 text-[10px] font-bold text-azure-300">
              {activeCount} active
            </span>
          ) : null}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        >
          <polyline points="4 6 8 10 12 6" />
        </svg>
      </button>

      {open ? (
        <div
          id="chart-filters-panel"
          className="flex flex-col gap-5 border-t border-line-800 px-5 py-5 sm:px-6"
        >
          <FilterBlock label="Location">
            <SegmentedControl
              options={LOCATION_OPTIONS}
              value={filters.location}
              onChange={(location) => onChange({ ...filters, location })}
              ariaLabel="Filter games by location"
            />
          </FilterBlock>

          <div className="border-t border-line-800" />

          <FilterBlock
            label="Blowouts"
            description="Exclude games decided by 20+ points so lopsided results don't skew the analysis."
          >
            <RadioGroup
              name="blowout-filter"
              options={BLOWOUT_OPTIONS}
              value={filters.blowout}
              onChange={(blowout) => onChange({ ...filters, blowout })}
              ariaLabel="Exclude blowout games"
            />
          </FilterBlock>
        </div>
      ) : null}
    </section>
  );
}
