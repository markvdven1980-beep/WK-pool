import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Match, SyncResult, BonusQuestion, AdminUser, AdminPool } from '../api';
import { getFlag, ALL_TEAMS } from '../teams';
import BonusInput from '../components/BonusInput';

export default function AdminPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filter, setFilter] = useState<'upcoming' | 'all'>('upcoming');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<SyncResult | null>(null);

  const loadMatches = () => api.matches.list().then(setMatches);

  useEffect(() => {
    loadMatches().finally(() => setLoading(false));
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const result = await api.admin.sync();
      setSyncMsg(result);
      if (result.updated > 0) await loadMatches();
    } catch (err: any) {
      setSyncMsg({ ok: false, checked: 0, updated: 0, message: err.message, updatedMatches: [] });
    } finally {
      setSyncing(false);
    }
  };

  const filtered = matches.filter((m) => {
    if (filter === 'upcoming') return m.homeScore === null;
    return true;
  });

  const handleResult = async (match: Match, homeScore: string, awayScore: string) => {
    const h = parseInt(homeScore);
    const a = parseInt(awayScore);
    if (isNaN(h) || isNaN(a)) return;
    const result = await api.admin.setResult(match.id, h, a);
    setMatches((prev) =>
      prev.map((m) => (m.id === match.id ? { ...m, homeScore: h, awayScore: a } : m))
    );
    alert(`Uitslag opgeslagen! ${result.predictionsUpdated} voorspellingen bijgewerkt.`);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Beheerder</h2>

      <div className="bg-wk-card rounded-xl p-4 border border-gray-700 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-semibold">Automatische uitslagen-sync</h3>
            <p className="text-xs text-gray-400">
              Uitslagen worden automatisch elke 5 minuten opgehaald via football-data.org en de punten direct herberekend.
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-wk-green hover:bg-wk-green-light text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50 shrink-0"
          >
            {syncing ? 'Synchroniseren...' : '🔄 Sync nu'}
          </button>
        </div>
        <FixTimesButton />
        <SyncPredictionsButton />
        {syncMsg && (
          <div className={`text-sm rounded-lg p-3 ${syncMsg.ok ? 'bg-wk-darker text-gray-300' : 'bg-red-900/30 text-red-300'}`}>
            <p>{syncMsg.message}{syncMsg.ok && ` (${syncMsg.checked} wedstrijden gecontroleerd)`}</p>
            {syncMsg.updatedMatches.length > 0 && (
              <ul className="mt-1 text-xs text-gray-400">
                {syncMsg.updatedMatches.map((m) => (
                  <li key={m.matchNum}>#{m.matchNum} {m.homeTeam} {m.score} {m.awayTeam}</li>
                ))}
              </ul>
            )}
            {syncMsg.teamsFilled && syncMsg.teamsFilled.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-wk-gold">Automatisch ingevulde knockout-teams (controleer ze):</p>
                <ul className="mt-1 text-xs text-gray-400">
                  {syncMsg.teamsFilled.map((m) => (
                    <li key={m.matchNum}>#{m.matchNum} {m.homeTeam} - {m.awayTeam}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <AdminPoolsPanel />

      <AdminUsersPanel />

      <AdminBonusPanel />

      <KnockoutTeamsPanel />

      <div className="flex gap-2">
        <button
          onClick={() => setFilter('upcoming')}
          className={`text-sm px-3 py-1.5 rounded-lg ${filter === 'upcoming' ? 'bg-wk-orange text-white' : 'bg-wk-card text-gray-300'}`}
        >
          Nog in te vullen
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`text-sm px-3 py-1.5 rounded-lg ${filter === 'all' ? 'bg-wk-orange text-white' : 'bg-wk-card text-gray-300'}`}
        >
          Alle wedstrijden
        </button>
      </div>

      <div className="space-y-3">
        {filtered.map((match) => (
          <AdminMatchRow key={match.id} match={match} onSubmit={handleResult} />
        ))}
      </div>
    </div>
  );
}

function AdminPoolsPanel() {
  const [pools, setPools] = useState<AdminPool[]>([]);

  useEffect(() => {
    api.admin.getPools().then(setPools);
  }, []);

  const handleDelete = async (pool: AdminPool) => {
    if (!confirm(`Poule "${pool.name}" verwijderen?\n\nAlle voorspellingen en scores in deze poule worden ook verwijderd. Dit kan niet ongedaan worden gemaakt.`)) return;
    await api.admin.deletePool(pool.id);
    setPools((prev) => prev.filter((p) => p.id !== pool.id));
  };

  return (
    <div className="bg-wk-card rounded-xl p-4 border border-gray-700 space-y-3">
      <div>
        <h3 className="font-semibold">Poule beheer</h3>
        <p className="text-xs text-gray-400">Verwijder poules inclusief alle voorspellingen en scores.</p>
      </div>

      {pools.length === 0 ? (
        <p className="text-sm text-gray-500">Geen poules aangemaakt.</p>
      ) : (
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {pools.map((pool) => (
            <div key={pool.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-wk-darker">
              <div>
                <span className="text-sm font-medium">{pool.name}</span>
                <span className="text-xs text-gray-500 ml-2">
                  {pool._count.members} deelnemer{pool._count.members !== 1 ? 's' : ''} · code: <span className="font-mono text-wk-orange">{pool.inviteCode}</span>
                </span>
              </div>
              <button
                onClick={() => handleDelete(pool)}
                className="text-xs text-gray-400 hover:text-red-400 border border-gray-600 hover:border-red-400 px-2 py-1 rounded transition-colors shrink-0"
              >
                Verwijderen
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [resetResult, setResetResult] = useState<{ username: string; newPassword: string } | null>(null);

  useEffect(() => {
    api.admin.getUsers().then(setUsers);
  }, []);

  const handleReset = async (user: AdminUser) => {
    if (!confirm(`Wachtwoord resetten voor ${user.name} (${user.username})?`)) return;
    const result = await api.admin.resetPassword(user.id);
    setResetResult(result);
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Gebruiker "${user.name}" (@${user.username}) verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
    await api.admin.deleteUser(user.id);
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    setResetResult(null);
  };

  return (
    <div className="bg-wk-card rounded-xl p-4 border border-gray-700 space-y-3">
      <div>
        <h3 className="font-semibold">Gebruikersbeheer</h3>
        <p className="text-xs text-gray-400">Wachtwoord resetten voor een deelnemer — het nieuwe wachtwoord wordt eenmalig getoond.</p>
      </div>

      {resetResult && (
        <div className="bg-wk-darker border border-wk-gold/50 rounded-lg p-3 space-y-1">
          <p className="text-xs text-gray-400">Nieuw wachtwoord voor <span className="text-white font-semibold">{resetResult.username}</span>:</p>
          <p className="font-mono text-wk-gold font-bold text-lg tracking-widest">{resetResult.newPassword}</p>
          <p className="text-xs text-gray-500">Geef dit door aan de deelnemer — daarna is het niet meer zichtbaar.</p>
          <button onClick={() => setResetResult(null)} className="text-xs text-gray-400 hover:text-white mt-1">Sluiten</button>
        </div>
      )}

      <div className="space-y-1 max-h-60 overflow-y-auto">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-wk-darker">
            <div className="flex items-center gap-2">
              <span>{user.avatar}</span>
              <div>
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-gray-500 ml-1">@{user.username}</span>
              </div>
              {user.isAdmin && <span className="text-xs bg-wk-gold/20 text-wk-gold px-1.5 rounded">Admin</span>}
            </div>
            {!user.isAdmin && (
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleReset(user)}
                  className="text-xs text-gray-400 hover:text-wk-orange border border-gray-600 hover:border-wk-orange px-2 py-1 rounded transition-colors"
                >
                  Reset wachtwoord
                </button>
                <button
                  onClick={() => handleDelete(user)}
                  className="text-xs text-gray-400 hover:text-red-400 border border-gray-600 hover:border-red-400 px-2 py-1 rounded transition-colors"
                >
                  Verwijderen
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminBonusPanel() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<BonusQuestion[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.pools.list().then((pools) => {
      if (pools.length > 0) {
        api.bonus.get(pools[0].id).then((d) => {
          setQuestions(d.questions);
          const map: Record<string, string> = {};
          d.officialAnswers.forEach((a) => { map[a.question] = a.answer; });
          setAnswers(map);
        });
      }
    });
  }, []);

  const handleSave = async (question: string) => {
    if (!answers[question]?.trim()) return;
    const result = await api.admin.setBonusAnswer(question, answers[question].trim());
    setMsg(`Antwoord opgeslagen — ${result.predictionsUpdated} voorspelling(en) beoordeeld.`);
    setTimeout(() => setMsg(''), 3000);
  };

  if (questions.length === 0) return null;

  return (
    <div className="bg-wk-card rounded-xl p-4 border border-gray-700 space-y-3">
      <div>
        <h3 className="font-semibold">Bonusvragen beoordelen</h3>
        <p className="text-xs text-gray-400">Vul het officiële antwoord in; de punten worden automatisch toegekend.</p>
      </div>
      {questions.map((q) => (
        <div key={q.key} className="flex items-center gap-2">
          <span className="text-sm flex-1 min-w-0">{q.label} <span className="text-wk-gold text-xs">({q.points}p)</span></span>
          <div className="flex-1 min-w-0">
            <BonusInput
              question={q}
              value={answers[q.key] ?? ''}
              onChange={(v) => setAnswers((a) => ({ ...a, [q.key]: v }))}
            />
          </div>
          <button
            onClick={() => handleSave(q.key)}
            className="bg-wk-green hover:bg-wk-green-light text-white text-sm px-3 py-1.5 rounded shrink-0"
          >
            Opslaan
          </button>
        </div>
      ))}
      {msg && <p className="text-green-400 text-sm">{msg}</p>}
    </div>
  );
}

function FixTimesButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleFix = async () => {
    if (!confirm('Wedstrijdtijden bijwerken naar officiële UTC-tijden?\n\nVoorspellingen en scores worden NIET gewijzigd.')) return;
    setLoading(true);
    try {
      const r = await api.admin.fixMatchTimes();
      setResult(`✅ ${r.message}`);
    } catch (err: any) {
      setResult(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-gray-700 pt-3 space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-medium text-gray-300">⏰ Wedstrijdtijden corrigeren</p>
          <p className="text-xs text-gray-500">Zet alle groepsfase-tijden op officiële UTC-waarden (o.b.v. CBS/FIFA schema). Voorspellingen blijven intact.</p>
        </div>
        <button
          onClick={handleFix}
          disabled={loading}
          className="text-xs text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 px-3 py-1.5 rounded transition-colors disabled:opacity-50 shrink-0"
        >
          {loading ? 'Bezig...' : 'Tijden bijwerken'}
        </button>
      </div>
      {result && <p className="text-xs text-gray-400">{result}</p>}
    </div>
  );
}

// Een team is nog niet bekend zolang het een placeholder is (geen echt land).
function isPlaceholder(team: string): boolean {
  return !ALL_TEAMS.includes(team);
}

function KnockoutTeamsPanel() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [savingId, setSavingId] = useState<string>('');
  const [msg, setMsg] = useState('');

  const load = () =>
    api.matches.list().then((ms) => setMatches(ms.filter((m) => !m.group).sort((a, b) => a.matchNum - b.matchNum)));

  useEffect(() => { load(); }, []);

  const handleSave = async (match: Match, homeTeam: string, awayTeam: string) => {
    setSavingId(match.id);
    try {
      await api.admin.setTeams(match.id, homeTeam, awayTeam);
      setMsg(`Wedstrijd #${match.matchNum} bijgewerkt: ${homeTeam} - ${awayTeam}`);
      setMatches((prev) => prev.map((m) => (m.id === match.id ? { ...m, homeTeam, awayTeam } : m)));
      setTimeout(() => setMsg(''), 4000);
    } catch (err: any) {
      setMsg(`Fout: ${err.message}`);
    } finally {
      setSavingId('');
    }
  };

  if (matches.length === 0) return null;

  // Groepeer per ronde, in de volgorde waarin ze gespeeld worden.
  const byRound = matches.reduce<Record<string, Match[]>>((acc, m) => {
    (acc[m.round] ||= []).push(m);
    return acc;
  }, {});
  const openCount = matches.filter((m) => isPlaceholder(m.homeTeam) || isPlaceholder(m.awayTeam)).length;

  return (
    <div className="bg-wk-card rounded-xl p-4 border border-gray-700 space-y-3">
      <div>
        <h3 className="font-semibold">Knockout-teams instellen</h3>
        <p className="text-xs text-gray-400">
          Vul per wedstrijd de teams in zodra ze bekend zijn. {openCount > 0
            ? `Nog ${openCount} wedstrijd${openCount !== 1 ? 'en' : ''} met onbekende teams.`
            : 'Alle knockout-teams zijn ingevuld.'}
          {' '}Voorspellingen blijven ongewijzigd.
        </p>
      </div>

      {msg && <p className="text-sm text-wk-gold">{msg}</p>}

      <div className="space-y-4 max-h-[28rem] overflow-y-auto">
        {Object.entries(byRound).map(([round, roundMatches]) => (
          <div key={round}>
            <h4 className="text-xs font-bold text-wk-gold uppercase tracking-wide mb-2">{round}</h4>
            <div className="space-y-2">
              {roundMatches.map((match) => (
                <KnockoutTeamRow
                  key={match.id}
                  match={match}
                  saving={savingId === match.id}
                  onSave={handleSave}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KnockoutTeamRow({
  match,
  saving,
  onSave,
}: {
  match: Match;
  saving: boolean;
  onSave: (match: Match, homeTeam: string, awayTeam: string) => void;
}) {
  // Begin met het echte team als dat al is ingevuld, anders leeg (placeholder als hint).
  const [home, setHome] = useState(isPlaceholder(match.homeTeam) ? '' : match.homeTeam);
  const [away, setAway] = useState(isPlaceholder(match.awayTeam) ? '' : match.awayTeam);

  const homePlaceholder = isPlaceholder(match.homeTeam) ? match.homeTeam : '';
  const awayPlaceholder = isPlaceholder(match.awayTeam) ? match.awayTeam : '';
  const changed = home !== (isPlaceholder(match.homeTeam) ? '' : match.homeTeam)
    || away !== (isPlaceholder(match.awayTeam) ? '' : match.awayTeam);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-500 w-8 shrink-0">#{match.matchNum}</span>
      <select
        value={home}
        onChange={(e) => setHome(e.target.value)}
        className="flex-1 min-w-0 bg-wk-darker border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-wk-orange"
      >
        <option value="">{homePlaceholder || '— kies thuisteam —'}</option>
        {ALL_TEAMS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <span className="text-gray-500 text-sm">-</span>
      <select
        value={away}
        onChange={(e) => setAway(e.target.value)}
        className="flex-1 min-w-0 bg-wk-darker border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-wk-orange"
      >
        <option value="">{awayPlaceholder || '— kies uitteam —'}</option>
        {ALL_TEAMS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <button
        onClick={() => onSave(match, home, away)}
        disabled={saving || !home || !away || !changed}
        className="bg-wk-green hover:bg-wk-green-light text-white text-sm px-3 py-1.5 rounded shrink-0 disabled:opacity-40"
      >
        {saving ? '...' : 'Opslaan'}
      </button>
    </div>
  );
}

function SyncPredictionsButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleSync = async () => {
    if (!confirm('Voorspellingen synchroniseren naar alle poules?\n\nDit maakt ontbrekende voorspellingen aan voor deelnemers die in meerdere poules zitten. Bestaande voorspellingen worden NIET gewijzigd.')) return;
    setLoading(true);
    try {
      const r = await api.admin.syncPredictions();
      setResult(`✅ ${r.message}`);
    } catch (err: any) {
      setResult(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-gray-700 pt-3 space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-medium text-gray-300">🔁 Voorspellingen synchroniseren</p>
          <p className="text-xs text-gray-500">Zorgt dat voorspellingen in álle poules van een deelnemer meetellen. Maakt alleen ontbrekende records aan — bestaande blijven intact.</p>
        </div>
        <button
          onClick={handleSync}
          disabled={loading}
          className="text-xs text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 px-3 py-1.5 rounded transition-colors disabled:opacity-50 shrink-0"
        >
          {loading ? 'Bezig...' : 'Synchroniseren'}
        </button>
      </div>
      {result && <p className="text-xs text-gray-400">{result}</p>}
    </div>
  );
}

function AdminMatchRow({
  match,
  onSubmit,
}: {
  match: Match;
  onSubmit: (match: Match, homeScore: string, awayScore: string) => void;
}) {
  const [homeScore, setHomeScore] = useState(match.homeScore?.toString() ?? '');
  const [awayScore, setAwayScore] = useState(match.awayScore?.toString() ?? '');

  const date = new Date(match.matchDate).toLocaleDateString('nl-NL', {
    timeZone: 'Europe/Amsterdam',
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="bg-wk-card rounded-xl p-4 border border-gray-700 flex flex-col sm:flex-row items-center gap-3">
      <div className="text-xs text-gray-400 w-24 shrink-0">
        #{match.matchNum} · {date}
      </div>
      <div className="flex-1 flex items-center justify-center gap-2">
        <span className="text-sm text-right flex-1">
          {getFlag(match.homeTeam)} {match.homeTeam}
        </span>
        <input
          type="number"
          min="0"
          value={homeScore}
          onChange={(e) => setHomeScore(e.target.value)}
          className="w-12 h-9 bg-wk-darker border border-gray-600 rounded text-center text-white text-sm focus:outline-none focus:border-wk-orange"
        />
        <span className="text-gray-500">-</span>
        <input
          type="number"
          min="0"
          value={awayScore}
          onChange={(e) => setAwayScore(e.target.value)}
          className="w-12 h-9 bg-wk-darker border border-gray-600 rounded text-center text-white text-sm focus:outline-none focus:border-wk-orange"
        />
        <span className="text-sm flex-1">
          {match.awayTeam} {getFlag(match.awayTeam)}
        </span>
      </div>
      <button
        onClick={() => onSubmit(match, homeScore, awayScore)}
        className="bg-wk-green hover:bg-wk-green-light text-white text-sm px-4 py-2 rounded-lg shrink-0"
      >
        Opslaan
      </button>
    </div>
  );
}
