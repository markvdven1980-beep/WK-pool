// In productie wijst VITE_API_URL naar de backend-host (bijv. https://wk-poule.onrender.com).
// Lokaal blijft '/api' werken via de Vite-proxy.
const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '';
const BASE = `${API_URL}/api`;

function getToken(): string | null {
  return localStorage.getItem('wk-token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  auth: {
    register: (data: { username: string; name: string; email?: string }) =>
      request<{ token: string; user: User; generatedPassword: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (username: string, password: string) =>
      request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    me: () => request<User>('/auth/me'),
  },
  matches: {
    list: (params?: { round?: string; group?: string; date?: string }) => {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return request<Match[]>(`/matches${qs}`);
    },
    get: (id: string) => request<Match>(`/matches/${id}`),
  },
  predictions: {
    list: (poolId?: string) => {
      const qs = poolId ? `?poolId=${poolId}` : '';
      return request<Prediction[]>(`/predictions${qs}`);
    },
    save: (data: { matchId: string; poolId: string; homeScore: number; awayScore: number; toto: string }) =>
      request<Prediction>('/predictions', { method: 'POST', body: JSON.stringify(data) }),
  },
  pools: {
    list: () => request<Pool[]>('/pools'),
    create: (name: string) =>
      request<Pool>('/pools', { method: 'POST', body: JSON.stringify({ name }) }),
    join: (inviteCode: string) =>
      request<Pool>('/pools/join', { method: 'POST', body: JSON.stringify({ inviteCode }) }),
    leaderboard: (poolId: string) =>
      request<LeaderboardEntry[]>(`/pools/${poolId}/leaderboard`),
  },
  admin: {
    setResult: (matchId: string, homeScore: number, awayScore: number) =>
      request<{ match: Match; predictionsUpdated: number }>(`/admin/matches/${matchId}/result`, {
        method: 'PUT',
        body: JSON.stringify({ homeScore, awayScore }),
      }),
    setTeams: (matchId: string, homeTeam: string, awayTeam: string) =>
      request<Match>(`/admin/matches/${matchId}/teams`, {
        method: 'PUT',
        body: JSON.stringify({ homeTeam, awayTeam }),
      }),
    sync: () =>
      request<SyncResult>('/admin/sync', { method: 'POST' }),
    getBonus: () =>
      request<{ questions: BonusQuestion[]; officialAnswers: { question: string; answer: string }[] }>('/admin/bonus'),
    setBonusAnswer: (question: string, answer: string) =>
      request<{ question: string; answer: string; predictionsUpdated: number }>('/admin/bonus', {
        method: 'PUT',
        body: JSON.stringify({ question, answer }),
      }),
    getUsers: () => request<AdminUser[]>('/admin/users'),
    resetPassword: (userId: string) =>
      request<{ username: string; newPassword: string }>(`/admin/users/${userId}/reset-password`, { method: 'POST' }),
    deleteUser: (userId: string) =>
      request<{ deleted: string }>(`/admin/users/${userId}`, { method: 'DELETE' }),
    getPools: () => request<AdminPool[]>('/admin/pools'),
    deletePool: (poolId: string) =>
      request<{ deleted: string }>(`/admin/pools/${poolId}`, { method: 'DELETE' }),
    fixMatchTimes: () =>
      request<{ ok: boolean; updated: number; message: string }>('/admin/fix-match-times', { method: 'POST' }),
    syncPredictions: () =>
      request<{ ok: boolean; created: number; matchesRecalculated: number; message: string }>('/admin/sync-predictions', { method: 'POST' }),
  },
  bonus: {
    get: (poolId: string) => request<BonusData>(`/bonus?poolId=${poolId}`),
    save: (poolId: string, question: string, answer: string) =>
      request<BonusPrediction>('/bonus', {
        method: 'POST',
        body: JSON.stringify({ poolId, question, answer }),
      }),
  },
};

export type BonusInputType = 'text' | 'number' | 'team' | 'groupWinner';

export interface BonusQuestion {
  key: string;
  label: string;
  placeholder?: string;
  points: number;
  type: BonusInputType;
  group?: string;
}

export interface BonusPrediction {
  id: string;
  userId: string;
  poolId: string;
  question: string;
  answer: string;
  correct: boolean | null;
  points: number | null;
}

export interface AdminPool {
  id: string;
  name: string;
  inviteCode: string;
  adminId: string;
  createdAt: string;
  _count: { members: number };
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  avatar: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface BonusData {
  questions: BonusQuestion[];
  deadline: string;
  deadlinePassed: boolean;
  predictions: BonusPrediction[];
  officialAnswers: { question: string; answer: string }[];
}

export interface SyncResult {
  ok: boolean;
  checked: number;
  updated: number;
  message: string;
  updatedMatches: { matchNum: number; homeTeam: string; awayTeam: string; score: string }[];
  unmatched?: string[];
  teamsFilled?: { matchNum: number; homeTeam: string; awayTeam: string }[];
}

export interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  isAdmin: boolean;
  email?: string;
}

export interface Match {
  id: string;
  matchNum: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  stadium: string;
  city: string;
  round: string;
  group: string | null;
  homeScore: number | null;
  awayScore: number | null;
}

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  poolId: string;
  homeScore: number;
  awayScore: number;
  toto: string;
  jokerUsed: boolean;
  pointsEarned: number | null;
  match?: Match;
}

export interface Pool {
  id: string;
  name: string;
  inviteCode: string;
  adminId: string;
  role?: string;
  _count?: { members: number };
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatar: string;
  totalPoints: number;
  bonusPoints: number;
  exactResults: number;
  correctToto: number;
  rank: number;
}
