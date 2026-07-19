import { apiFetch, type ApiRequestOptions } from './http.js';

export interface HealthStatus {
  status: 'ok';
  timestamp: string;
}

/** `GET /health` */
export function getHealth(options?: ApiRequestOptions): Promise<HealthStatus> {
  return apiFetch<HealthStatus>('/health', options);
}
