import { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './pages/LoginPage';
import MatchesPage from './pages/MatchesPage';
import PoolsPage from './pages/PoolsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminPage from './pages/AdminPage';
import SpelregelsPage from './pages/SpelregelsPage';
import BonusPage from './pages/BonusPage';
import BonusReminder from './components/BonusReminder';

type Page = 'wedstrijden' | 'poules' | 'bonus' | 'ranglijst' | 'spelregels' | 'admin';

function NavBar({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const { user, logout } = useAuth();
  const tabs: { key: Page; label: string; adminOnly?: boolean }[] = [
    { key: 'wedstrijden', label: 'Wedstrijden' },
    { key: 'poules', label: 'Poules' },
    { key: 'bonus', label: 'Bonus' },
    { key: 'ranglijst', label: 'Ranglijst' },
    { key: 'spelregels', label: 'Spelregels' },
    { key: 'admin', label: 'Admin', adminOnly: true },
  ];

  return (
    <nav className="bg-wk-dark border-b border-wk-orange/30 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <button onClick={() => setPage('wedstrijden')} className="flex items-center gap-2 font-bold text-lg">
          <span className="text-2xl">⚽</span>
          <span className="text-wk-orange">WK</span>
          <span className="hidden sm:inline">Poule 2026</span>
        </button>
        <div className="flex items-center gap-1 sm:gap-2">
          {tabs.map((tab) => {
            if (tab.adminOnly && !user?.isAdmin) return null;
            return (
              <button
                key={tab.key}
                onClick={() => setPage(tab.key)}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  page === tab.key
                    ? 'bg-wk-orange text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm hidden sm:inline">{user?.avatar} {user?.name}</span>
          <button onClick={logout} className="text-xs text-gray-400 hover:text-white">
            Uitloggen
          </button>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>('wedstrijden');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">⚽</div>
          <p className="text-gray-400">Laden...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <div className="min-h-screen">
      <NavBar page={page} setPage={setPage} />
      <main className="max-w-5xl mx-auto px-4 py-6">
        {page !== 'bonus' && <BonusReminder onGoToBonus={() => setPage('bonus')} />}
        {page === 'wedstrijden' && <MatchesPage />}
        {page === 'poules' && <PoolsPage />}
        {page === 'bonus' && <BonusPage />}
        {page === 'ranglijst' && <LeaderboardPage />}
        {page === 'spelregels' && <SpelregelsPage />}
        {page === 'admin' && <AdminPage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
