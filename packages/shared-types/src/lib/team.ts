import type { Conference } from './enums.js';

export interface TeamDto {
  id: string;
  name: string;
  abbreviation: string;
  conference: Conference;
  division: string;
  createdAt: string;
  updatedAt: string;
}
