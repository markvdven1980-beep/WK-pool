import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Pool } from '../api';

export default function PoolsPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newName, setNewName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadPools = () => {
    api.pools.list().then(setPools).finally(() => setLoading(false));
  };

  useEffect(loadPools, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.pools.create(newName);
      setNewName('');
      setShowCreate(false);
      loadPools();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.pools.join(inviteCode.toUpperCase());
      setInviteCode('');
      setShowJoin(false);
      loadPools();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Mijn Poules</h2>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowJoin(true); setShowCreate(false); }}
            className="bg-wk-card hover:bg-wk-card-hover text-white text-sm px-4 py-2 rounded-lg transition-colors border border-gray-600"
          >
            Deelnemen
          </button>
          <button
            onClick={() => { setShowCreate(true); setShowJoin(false); }}
            className="bg-wk-orange hover:bg-wk-orange-dark text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            + Nieuwe poule
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="bg-wk-card rounded-xl p-4 border border-wk-orange/30">
          <h3 className="font-semibold mb-3">Nieuwe poule aanmaken</h3>
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Naam van je poule"
              className="flex-1 bg-wk-darker border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-wk-orange"
              required
            />
            <button type="submit" className="bg-wk-orange hover:bg-wk-orange-dark text-white px-4 py-2 rounded-lg">
              Aanmaken
            </button>
          </form>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
      )}

      {showJoin && (
        <div className="bg-wk-card rounded-xl p-4 border border-wk-green/30">
          <h3 className="font-semibold mb-3">Deelnemen aan poule</h3>
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Uitnodigingscode"
              className="flex-1 bg-wk-darker border border-gray-600 rounded-lg px-4 py-2 text-white uppercase tracking-wider focus:outline-none focus:border-wk-green"
              required
            />
            <button type="submit" className="bg-wk-green hover:bg-wk-green-light text-white px-4 py-2 rounded-lg">
              Deelnemen
            </button>
          </form>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
      )}

      {pools.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold mb-2">Nog geen poules</h3>
          <p className="text-gray-400">Maak een poule aan of neem deel met een uitnodigingscode!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pools.map((pool) => (
            <div key={pool.id} className="bg-wk-card rounded-xl p-5 border border-gray-700 hover:border-wk-orange/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">{pool.name}</h3>
                {pool.role === 'admin' && (
                  <span className="text-xs bg-wk-gold/20 text-wk-gold px-2 py-0.5 rounded">Beheerder</span>
                )}
              </div>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>Uitnodigingscode:</span>
                  <span className="font-mono text-wk-orange font-bold tracking-wider">{pool.inviteCode}</span>
                </div>
                {pool._count && (
                  <div className="flex justify-between">
                    <span>Deelnemers:</span>
                    <span className="text-white">{pool._count.members}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
