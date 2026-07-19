import { z } from 'zod';
import {
  CONFERENCES,
  GAME_STATUSES,
  GAME_TYPES,
  PLAYER_POSITIONS,
} from '@props-analyzer/shared-types';

export const conferenceSchema = z.enum(CONFERENCES);
export const playerPositionSchema = z.enum(PLAYER_POSITIONS);
export const gameStatusSchema = z.enum(GAME_STATUSES);
export const gameTypeSchema = z.enum(GAME_TYPES);
