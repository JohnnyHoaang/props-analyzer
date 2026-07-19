import type { PlayerPosition } from '@props-analyzer/shared-types';

/** `PlayerDto.height` is stored in inches; render it the familiar way. */
export function formatHeight(heightInInches: number): string {
  const feet = Math.floor(heightInInches / 12);
  const inches = heightInInches % 12;
  return `${feet}'${inches}"`;
}

export function formatWeight(weightInPounds: number): string {
  return `${weightInPounds} lb`;
}

const POSITION_LABELS: Record<PlayerPosition, string> = {
  PG: 'Point Guard',
  SG: 'Shooting Guard',
  SF: 'Small Forward',
  PF: 'Power Forward',
  C: 'Center',
};

export function formatPosition(position: PlayerPosition): string {
  return POSITION_LABELS[position];
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatShootingSplit(made: number, attempted: number): string {
  if (attempted === 0) {
    return '0-0';
  }
  return `${made}-${attempted}`;
}

export function formatPlusMinus(plusMinus: number): string {
  return plusMinus > 0 ? `+${plusMinus}` : String(plusMinus);
}
