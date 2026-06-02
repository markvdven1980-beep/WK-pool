import { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(username, name);
      } else {
        await login(username);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-7xl mb-4">⚽</div>
          <h1 className="text-4xl font-bold">
            <span className="text-wk-orange">WK</span> Poule 2026
          </h1>
          <p className="text-gray-400 mt-2">
            FIFA Wereldkampioenschap 2026 — VS / Canada / Mexico
          </p>
          <p className="text-wk-gold text-sm mt-1">11 juni — 19 juli 2026</p>
        </div>

        <div className="bg-wk-card rounded-2xl p-6 shadow-lg">
          <div className="flex mb-6 bg-wk-darker rounded-lg p-1">
            <button
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                !isRegister ? 'bg-wk-orange text-white' : 'text-gray-400'
              }`}
            >
              Inloggen
            </button>
            <button
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                isRegister ? 'bg-wk-orange text-white' : 'text-gray-400'
              }`}
            >
              Registreren
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Gebruikersnaam</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-wk-darker border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-wk-orange"
                placeholder="jouw_naam"
                required
              />
            </div>
            {isRegister && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Weergavenaam</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-wk-darker border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-wk-orange"
                  placeholder="Jan de Boer"
                  required
                />
              </div>
            )}
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-wk-orange hover:bg-wk-orange-dark text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Even geduld...' : isRegister ? 'Account aanmaken' : 'Inloggen'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          Voorspel alle 104 WK-wedstrijden en strijd met je vrienden!
        </p>
      </div>
    </div>
  );
}
