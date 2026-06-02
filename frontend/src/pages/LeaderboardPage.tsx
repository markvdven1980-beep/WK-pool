import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Pool, LeaderboardEntry } from '../api';
import { useAuth } from '../AuthContext';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.pools.list().then((p) => {
      setPools(p);
      if (p.length > 0) setSelectedPool(p[0].id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedPool) {
      setLoading(true);
      api.pools.leaderboard(selectedPool)
        .then(setLeaderboard)
        .finally(() => setLoading(false));
    }
  }, [selectedPool]);

  if (pools.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">📊</div>
        <h3 className="text-xl font-semibold mb-2">Geen poules</h3>
        <p className="text-gray-400">Neem eerst deel aan een poule om de ranglijst te zien.</p>
      </div>
    );
  }

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Ranglijst</h2>

      <div className="flex items-center gap-2 flex-wrap">
        {pools.map((pool) => (
          <button
            key={pool.id}
            onClick={() => setSelectedPool(pool.id)}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
              selectedPool === pool.id
                ? 'bg-wk-orange text-white'
                : 'bg-wk-card text-gray-300 hover:bg-wk-card-hover'
            }`}
          >
            {pool.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Laden...</div>
      ) : (
        <div className="bg-wk-card rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 text-sm text-gray-400">
                <th className="py-3 px-4 text-left w-12">#</th>
                <th className="py-3 px-4 text-left">Speler</th>
                <th className="py-3 px-2 text-center">Punten</th>
                <th className="py-3 px-2 text-center hidden sm:table-cell">Exact</th>
                <th className="py-3 px-2 text-center hidden sm:table-cell">Toto</th>
                <th className="py-3 px-2 text-center hidden sm:table-cell">Bonus</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr
                  key={entry.userId}
                  className={`border-b border-gray-700/50 transition-colors ${
                    entry.userId === user?.id ? 'bg-wk-orange/10' : 'hover:bg-wk-card-hover'
                  }`}
                >
                  <td className="py-3 px-4 font-bold">
                    {entry.rank <= 3 ? (
                      <span className="text-lg">{medals[entry.rank - 1]}</span>
                    ) : (
                      <span className="text-gray-400">{entry.rank}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{entry.avatar}</span>
                      <span className={`font-medium ${entry.userId === user?.id ? 'text-wk-orange' : ''}`}>
                        {entry.userName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="font-bold text-wk-gold text-lg">{entry.totalPoints}</span>
                  </td>
                  <td className="py-3 px-2 text-center hidden sm:table-cell text-green-400">
                    {entry.exactResults}
                  </td>
                  <td className="py-3 px-2 text-center hidden sm:table-cell text-blue-400">
                    {entry.correctToto}
                  </td>
                  <td className="py-3 px-2 text-center hidden sm:table-cell text-wk-gold">
                    {entry.bonusPoints}
                  </td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Nog geen scores — het toernooi is nog niet begonnen!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
