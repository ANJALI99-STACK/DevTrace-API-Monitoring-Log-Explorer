export interface User {
  id: string;
  name: string;
  email: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface Endpoint {
  _id: string;
  name: string;
  url: string;
  method: HttpMethod;
  expectedStatus: number;
  interval: number;
  isActive: boolean;
  consecutiveFailures: number;
  createdAt: string;
}

export interface HealthLogRow {
  endpointName: string;
  statusCode: number;
  responseTime: number;
  success: boolean;
  errorMessage?: string;
  timestamp: string;
}

export interface AlertItem {
  _id: string;
  endpointId: { _id: string; name: string; url: string } | string;
  message: string;
  isResolved: boolean;
  createdAt: string;
}

export interface DashboardData {
  uptimePercent: number;
  avgLatency: number;
  healthyApis: number;
  failedToday: number;
  latencyTrend: { time: string; responseTime: number }[];
  uptimeTrend: { date: string; uptimePercent: number }[];
  statusDistribution: { status: string; count: number }[];
}
