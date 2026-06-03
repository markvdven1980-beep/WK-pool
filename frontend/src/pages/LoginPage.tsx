import { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function LoginPage() {
  const { login, register, confirmLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        const pwd = await register(username, name);
        if (pwd) setGeneratedPassword(pwd);
      } else {
        await login(username, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (generatedPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="text-6xl mb-3">🎉</div>
            <h1 className="text-2xl font-bold">Account aangemaakt!</h1>
          </div>
          <div className="bg-wk-card rounded-2xl p-6 border border-wk-orange/50 space-y-4">
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-300 text-sm font-semibold">⚠️ Bewaar dit wachtwoord — het wordt maar één keer getoond!</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Jouw wachtwoord:</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-wk-darker rounded-lg px-4 py-3 font-mono text-xl font-bold text-wk-gold tracking-widest text-center border border-wk-gold/30">
                  {generatedPassword}
                </div>
                <button
                  onClick={handleCopy}
                  className="bg-wk-card border border-gray-600 hover:border-wk-gold text-sm px-3 py-3 rounded-lg transition-colors shrink-0"
                >
                  {copied ? '✓' : '📋'}
                </button>
              </div>
            </div>
            <p className="text-gray-400 text-xs">
              Schrijf dit wachtwoord op of sla het op. Als je het vergeet, kan de beheerder een nieuw wachtwoord aanmaken.
            </p>
            <button
              onClick={() => { setGeneratedPassword(''); confirmLogin(); }}
              className="w-full bg-wk-orange hover:bg-wk-orange-dark text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Doorgaan naar de app →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-7xl mb-4">⚽</div>
          <h1 className="text-4xl font-bold">
            <span className="text-wk-orange">WK</span> Poule 2026
          </h1>
          <p className="text-gray-400 mt-2">FIFA Wereldkampioenschap 2026 — VS / Canada / Mexico</p>
          <p className="text-wk-gold text-sm mt-1">11 juni — 19 juli 2026</p>
        </div>

        <div className="bg-wk-card rounded-2xl p-6 shadow-lg">
          <div className="flex mb-6 bg-wk-darker rounded-lg p-1">
            <button
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${!isRegister ? 'bg-wk-orange text-white' : 'text-gray-400'}`}
            >
              Inloggen
            </button>
            <button
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${isRegister ? 'bg-wk-orange text-white' : 'text-gray-400'}`}
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
                placeholder="bijv. mark_v"
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

            {!isRegister && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Wachtwoord</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-wk-darker border border-gray-600 rounded-lg px-4 py-2.5 pr-11 text-white focus:outline-none focus:border-wk-orange"
                    placeholder="Jouw wachtwoord"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors text-lg"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Verberg wachtwoord' : 'Toon wachtwoord'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            )}

            {isRegister && (
              <div className="bg-wk-darker rounded-lg p-3 text-xs text-gray-400">
                Na registratie krijg je een <span className="text-wk-gold">WK-wachtwoord</span> dat je <strong className="text-white">eenmalig</strong> te zien krijgt. Bewaar het goed!
              </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-wk-orange hover:bg-wk-orange-dark text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Even geduld...' : isRegister ? 'Account aanmaken' : 'Inloggen'}
            </button>
          </form>

          {!isRegister && (
            <p className="text-center text-gray-500 text-xs mt-4">
              Wachtwoord vergeten? Neem contact op met de beheerder.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
