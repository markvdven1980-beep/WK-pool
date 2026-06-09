import { useState, useEffect, useRef, useCallback } from 'react';
import type { Match, Prediction } from '../api';
import { getFlag } from '../teams';

interface Props {
  match: Match;
  prediction?: Prediction;
  poolId?: string;
  onSave?: (matchId: string, homeScore: number, awayScore: number, toto: string) => Promise<void>;
  showPrediction?: boolean;
}

function getMatchStatus(match: Match): 'upcoming' | 'live' | 'finished' {
  if (match.homeScore !== null && match.awayScore !== null) return 'finished';
  const now = new Date();
  const matchTime = new Date(match.matchDate);
  const endTime = new Date(matchTime.getTime() + 120 * 60000);
  if (now >= matchTime && now <= endTime) return 'live';
  return 'upcoming';
}

function isLocked(match: Match): boolean {
  return new Date() >= new Date(new Date(match.matchDate).getTime() - 60000);
}

const NL_TZ = 'Europe/Amsterdam';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    timeZone: NL_TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('nl-NL', {
    timeZone: NL_TZ,
    hour: '2-digit',
    minute: '2-digit',
  });
}

function deriveToto(home: string, away: string): string {
  const h = parseInt(home);
  const a = parseInt(away);
  if (isNaN(h) || isNaN(a)) return '';
  if (h > a) return '1';
  if (a > h) return '2';
  return 'X';
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function MatchCard({ match, prediction, poolId, onSave, showPrediction = true }: Props) {
  const [homeInput, setHomeInput] = useState<string>(prediction?.homeScore?.toString() ?? '');
  const [awayInput, setAwayInput] = useState<string>(prediction?.awayScore?.toString() ?? '');
  const [toto, setToto] = useState<string>(prediction?.toto ?? '');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSavedRef = useRef<string>('');
  const awayRef = useRef<HTMLInputElement>(null);

  const status = getMatchStatus(match);
  const locked = isLocked(match);
  const isKnockout = !match.group;
  const isDutchMatch = match.homeTeam === 'Nederland' || match.awayTeam === 'Nederland';

  useEffect(() => {
    if (prediction) {
      setHomeInput(prediction.homeScore.toString());
      setAwayInput(prediction.awayScore.toString());
      const t = prediction.toto || deriveToto(prediction.homeScore.toString(), prediction.awayScore.toString());
      setToto(t);
      lastSavedRef.current = `${prediction.homeScore}-${prediction.awayScore}-${t}`;
    }
  }, [prediction]);

  const doSave = useCallback(async (home: string, away: string, totoVal: string) => {
    if (!onSave || !poolId || locked) return;
    const h = parseInt(home);
    const a = parseInt(away);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0 || !totoVal) return;

    const key = `${h}-${a}-${totoVal}`;
    if (key === lastSavedRef.current) return;

    setSaveStatus('saving');
    setErrorMsg('');
    try {
      await onSave(match.id, h, a, totoVal);
      lastSavedRef.current = key;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus((s) => s === 'saved' ? 'idle' : s), 2000);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMsg(err.message);
    }
  }, [onSave, poolId, match.id, locked]);

  const scheduleAutosave = useCallback((home: string, away: string, totoVal: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSave(home, away, totoVal), 800);
  }, [doSave]);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleScoreChange = (field: 'home' | 'away', value: string) => {
    // Alleen cijfers 0-9 toestaan, max 1 karakter (niemand scoort 10+).
    const clean = value.replace(/\D/g, '').slice(0, 1);
    const newHome = field === 'home' ? clean : homeInput;
    const newAway = field === 'away' ? clean : awayInput;
    if (field === 'home') {
      setHomeInput(clean);
      // Spring automatisch naar het uitveld zodra een cijfer is ingevuld.
      if (clean.length === 1) {
        awayRef.current?.focus();
        awayRef.current?.select();
      }
    } else {
      setAwayInput(clean);
    }
    const derived = deriveToto(newHome, newAway);
    const newToto = derived || toto;
    if (derived) setToto(derived);
    scheduleAutosave(newHome, newAway, newToto);
  };

  const handleTotoChange = (val: string) => {
    if (locked) return;
    setToto(val);
    scheduleAutosave(homeInput, awayInput, val);
  };

  const statusColors = {
    upcoming: 'border-gray-600',
    live: 'border-green-500 shadow-green-500/20 shadow-lg',
    finished: 'border-gray-700',
  };

  const roundMultiplier: Record<string, number> = {
    'Groepsfase': 1, 'Zestiende finale': 2, 'Achtste finale': 3,
    'Kwartfinale': 4, 'Halve finale': 5, 'Finale': 6, 'Troostfinale': 4,
  };

  return (
    <div
      className={`rounded-xl p-4 transition-all hover:bg-wk-card-hover ${
        isDutchMatch
          ? 'bg-gradient-to-br from-wk-orange/15 to-wk-card border-2 border-wk-orange shadow-lg shadow-wk-orange/20'
          : `bg-wk-card border ${statusColors[status]}`
      }`}
    >
      {isDutchMatch && (
        <div className="flex items-center justify-center gap-1.5 mb-2 -mt-1">
          <span className="text-xs font-bold text-wk-orange uppercase tracking-wide">
            🇳🇱 Oranje · altijd dubbele punten ×2
          </span>
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {match.group && (
            <span className="bg-wk-orange/20 text-wk-orange text-xs font-bold px-2 py-0.5 rounded">
              Groep {match.group}
            </span>
          )}
          {isKnockout && (
            <span className="bg-wk-gold/20 text-wk-gold text-xs font-bold px-2 py-0.5 rounded">
              {match.round}
            </span>
          )}
          {(roundMultiplier[match.round] ?? 1) > 1 && (
            <span className="text-xs text-wk-gold">x{roundMultiplier[match.round]}</span>
          )}
          {saveStatus === 'saving' && <span className="text-xs text-gray-400 animate-pulse">Opslaan...</span>}
          {saveStatus === 'saved' && <span className="text-xs text-green-400">Opgeslagen ✓</span>}
          {saveStatus === 'error' && <span className="text-xs text-red-400">{errorMsg || 'Fout'}</span>}
        </div>
        <div className="text-right text-xs text-gray-400">
          <div>{formatDate(match.matchDate)}</div>
          <div>{formatTime(match.matchDate)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 text-right">
          <span className="text-lg mr-2">{getFlag(match.homeTeam)}</span>
          <span className="text-sm font-medium">{match.homeTeam}</span>
        </div>

        <div className="flex items-center gap-1 min-w-[100px] justify-center">
          {status === 'finished' ? (
            <div className="text-center">
              <div className="text-xl font-bold">
                {match.homeScore} - {match.awayScore}
              </div>
              {prediction && showPrediction && (
                <div className="text-xs text-gray-400 mt-1">
                  Jouw: {prediction.homeScore} - {prediction.awayScore} (toto: {prediction.toto})
                  {prediction.pointsEarned !== null && (
                    <span className={`ml-1 font-bold ${prediction.pointsEarned > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      (+{prediction.pointsEarned})
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : status === 'live' ? (
            <div className="text-center">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400 text-xs font-bold">LIVE</span>
              </div>
              {prediction && showPrediction && (
                <div className="text-xs text-gray-400 mt-1">
                  Jouw: {prediction.homeScore} - {prediction.awayScore} (toto: {prediction.toto})
                </div>
              )}
            </div>
          ) : showPrediction && poolId && onSave ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength={1}
                value={homeInput}
                onChange={(e) => handleScoreChange('home', e.target.value)}
                onFocus={(e) => e.target.select()}
                disabled={locked}
                className="w-10 h-9 bg-wk-darker border border-gray-600 rounded text-center text-white text-sm focus:outline-none focus:border-wk-orange disabled:opacity-50"
              />
              <span className="text-gray-500">-</span>
              <input
                ref={awayRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength={1}
                value={awayInput}
                onChange={(e) => handleScoreChange('away', e.target.value)}
                onFocus={(e) => e.target.select()}
                disabled={locked}
                className="w-10 h-9 bg-wk-darker border border-gray-600 rounded text-center text-white text-sm focus:outline-none focus:border-wk-orange disabled:opacity-50"
              />
            </div>
          ) : (
            <span className="text-gray-500 text-sm">vs</span>
          )}
        </div>

        <div className="flex-1">
          <span className="text-sm font-medium">{match.awayTeam}</span>
          <span className="text-lg ml-2">{getFlag(match.awayTeam)}</span>
        </div>
      </div>

      {showPrediction && poolId && onSave && status === 'upcoming' && (
        <div className="mt-3 flex items-center justify-center gap-1">
          <span className="text-xs text-gray-400 mr-1">Toto:</span>
          {(['1', 'X', '2'] as const).map((val) => (
            <button
              key={val}
              onClick={() => handleTotoChange(val)}
              disabled={locked}
              className={`w-9 h-8 rounded text-sm font-bold transition-colors disabled:opacity-50 ${
                toto === val
                  ? val === '1'
                    ? 'bg-blue-600 text-white'
                    : val === 'X'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-red-600 text-white'
                  : 'bg-wk-darker border border-gray-600 text-gray-400 hover:border-gray-400'
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      )}

      {locked && status === 'upcoming' && (
        <div className="mt-2 text-center text-xs text-red-400">
          Vergrendeld — deadline verstreken
        </div>
      )}

      <div className="mt-2 text-center text-xs text-gray-500">
        {match.stadium}, {match.city}
      </div>
    </div>
  );
}
