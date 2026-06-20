import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Match, Prediction, Pool } from '../api';
import MatchCard from '../components/MatchCard';
import CountdownTimer from '../components/CountdownTimer';

// Vaste volgorde van de toernooirondes voor de navigatie.
const ROUND_ORDER = [
  'Groepsfase',
  'Zestiende finale',
  'Achtste finale',
  'Kwartfinale',
  'Halve finale',
  'Troostfinale',
  'Finale',
];

// Korte labels voor de rondeknoppen.
const ROUND_LABELS: Record<string, string> = {
  'Groepsfase': 'Groepsfase',
  'Zestiende finale': '1/16 finale',
  'Achtste finale': '1/8 finale',
  'Kwartfinale': 'Kwartfinale',
  'Halve finale': 'Halve finale',
  'Troostfinale': 'Troostfinale',
  'Finale': 'Finale',
};

// Speciale weergaves: alleen de wedstrijden van gisteren of vandaag.
const VANDAAG = '__vandaag__';
const GISTEREN = '__gisteren__';

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.matches.list(), api.pools.list()])
      .then(([m, p]) => {
        setMatches(m);
        setPools(p);
        if (p.length > 0) setSelectedPool(p[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  // Kies bij het laden automatisch de actuele ronde: die van de eerstvolgende
  // nog te spelen wedstrijd (of de laatste ronde als het toernooi voorbij is).
  useEffect(() => {
    if (matches.length === 0 || selectedRound) return;
    const now = new Date();
    const upcoming = matches
      .filter((m) => new Date(m.matchDate) > now)
      .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())[0];
    const round = upcoming?.round ?? ROUND_ORDER[ROUND_ORDER.length - 1];
    setSelectedRound(round);
  }, [matches, selectedRound]);

  useEffect(() => {
    if (selectedPool) {
      api.predictions.list(selectedPool).then((preds) => {
        const map: Record<string, Prediction> = {};
        preds.forEach((p) => { map[p.matchId] = p; });
        setPredictions(map);
      });
    }
  }, [selectedPool]);

  const handleSave = async (matchId: string, homeScore: number, awayScore: number, toto: string) => {
    const pred = await api.predictions.save({ matchId, poolId: selectedPool, homeScore, awayScore, toto });
    setPredictions((prev) => ({ ...prev, [matchId]: pred }));
  };

  const NL_TZ = 'Europe/Amsterdam';

  // Vergelijk datums altijd in Nederlandse tijdzone (CEST/CET), niet in browsertijdzone.
  const dayKeyNL = (d: Date) =>
    d.toLocaleDateString('nl-NL', { timeZone: NL_TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  const todayNL = dayKeyNL(new Date());
  const yesterdayNL = dayKeyNL(new Date(Date.now() - 24 * 60 * 60 * 1000));

  const filteredMatches = matches.filter((m) => {
    if (selectedRound === VANDAAG) return dayKeyNL(new Date(m.matchDate)) === todayNL;
    if (selectedRound === GISTEREN) return dayKeyNL(new Date(m.matchDate)) === yesterdayNL;
    return m.round === selectedRound;
  }).filter((m) => {
    // Binnen de groepsfase kun je nog op poulegroep filteren.
    if (selectedRound === 'Groepsfase' && selectedGroup && m.group) return m.group === selectedGroup;
    return true;
  });

  const nextMatch = matches.find((m) => new Date(m.matchDate) > new Date());

  // Alleen rondes tonen die ook echt wedstrijden hebben, in vaste volgorde.
  const roundsPresent = new Set(matches.map((m) => m.round));
  const availableRounds = ROUND_ORDER.filter((r) => roundsPresent.has(r));

  const groups = [...new Set(matches.filter((m) => m.group).map((m) => m.group!))].sort();

  // Bij de dagweergaves (gisteren/vandaag): toon het totaal behaalde punten van
  // die dag, op basis van de al toegekende punten in de geselecteerde poule.
  const isDayView = selectedRound === VANDAAG || selectedRound === GISTEREN;
  const dayPoints =
    isDayView && selectedPool
      ? filteredMatches.reduce((sum, m) => sum + (predictions[m.id]?.pointsEarned ?? 0), 0)
      : null;
  const dayHasScored = filteredMatches.some(
    (m) => m.homeScore !== null && predictions[m.id]?.pointsEarned != null
  );

  const matchesByDate = filteredMatches.reduce<Record<string, Match[]>>((acc, m) => {
    const dateKey = new Date(m.matchDate).toLocaleDateString('nl-NL', {
      timeZone: NL_TZ,
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    (acc[dateKey] ||= []).push(m);
    return acc;
  }, {});

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Wedstrijden laden...</div>;
  }

  return (
    <div className="space-y-6">
      {nextMatch && (
        <CountdownTimer
          targetDate={nextMatch.matchDate}
          label={`Volgende wedstrijd: ${nextMatch.homeTeam} - ${nextMatch.awayTeam}`}
        />
      )}

      {pools.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-400">Poule:</span>
          {pools.map((pool) => (
            <button
              key={pool.id}
              onClick={() => setSelectedPool(pool.id)}
              className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                selectedPool === pool.id
                  ? 'bg-wk-orange text-white'
                  : 'bg-wk-card text-gray-300 hover:bg-wk-card-hover'
              }`}
            >
              {pool.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => { setSelectedRound(GISTEREN); setSelectedGroup(''); }}
          className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
            selectedRound === GISTEREN
              ? 'bg-wk-green text-white'
              : 'bg-wk-card text-gray-300 hover:bg-wk-card-hover'
          }`}
        >
          Gisteren
        </button>
        <button
          onClick={() => { setSelectedRound(VANDAAG); setSelectedGroup(''); }}
          className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
            selectedRound === VANDAAG
              ? 'bg-wk-green text-white'
              : 'bg-wk-card text-gray-300 hover:bg-wk-card-hover'
          }`}
        >
          Vandaag
        </button>
        {availableRounds.map((r) => (
          <button
            key={r}
            onClick={() => { setSelectedRound(r); setSelectedGroup(''); }}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
              selectedRound === r
                ? 'bg-wk-green text-white'
                : 'bg-wk-card text-gray-300 hover:bg-wk-card-hover'
            }`}
          >
            {ROUND_LABELS[r] ?? r}
          </button>
        ))}
      </div>

      {selectedRound === 'Groepsfase' && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs text-gray-400 mr-1">Groep:</span>
          <button
            onClick={() => setSelectedGroup('')}
            className={`text-xs px-2 py-1 rounded ${!selectedGroup ? 'bg-wk-orange text-white' : 'bg-wk-card text-gray-400'}`}
          >
            Alle
          </button>
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGroup(g)}
              className={`text-xs px-2 py-1 rounded ${selectedGroup === g ? 'bg-wk-orange text-white' : 'bg-wk-card text-gray-400'}`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap text-sm text-gray-400">
        <div>
          <span className="text-gray-200 font-semibold">
            {selectedRound === VANDAAG
              ? 'Vandaag'
              : selectedRound === GISTEREN
              ? 'Gisteren'
              : (ROUND_LABELS[selectedRound] ?? selectedRound)}
          </span>
          {' · '}
          {filteredMatches.length} wedstrijd{filteredMatches.length !== 1 ? 'en' : ''}
        </div>
        {dayPoints !== null && dayHasScored && (
          <span className="bg-wk-gold/20 text-wk-gold font-bold px-3 py-1 rounded-lg">
            {selectedRound === GISTEREN ? 'Gisteren behaald' : 'Vandaag behaald'}: {dayPoints} {dayPoints === 1 ? 'punt' : 'punten'}
          </span>
        )}
      </div>

      {Object.entries(matchesByDate).map(([date, dayMatches]) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-wk-gold mb-3 capitalize">{date}</h3>
          <div className="space-y-3">
            {dayMatches.map((match) => (
              <MatchCard
                key={`${selectedPool}-${match.id}`}
                match={match}
                prediction={predictions[match.id]}
                poolId={selectedPool}
                onSave={selectedPool ? handleSave : undefined}
                showPrediction={!!selectedPool}
              />
            ))}
          </div>
        </div>
      ))}

      {filteredMatches.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {selectedRound === VANDAAG
            ? 'Vandaag worden er geen wedstrijden gespeeld.'
            : selectedRound === GISTEREN
            ? 'Gisteren zijn er geen wedstrijden gespeeld.'
            : 'Geen wedstrijden in deze ronde.'}
        </div>
      )}
    </div>
  );
}
