import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Match, Prediction, Pool } from '../api';
import MatchCard from '../components/MatchCard';
import CountdownTimer from '../components/CountdownTimer';

type Filter = 'alle' | 'groep' | 'knockout' | 'vandaag';

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [filter, setFilter] = useState<Filter>('alle');
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
  const todayNL = new Date().toLocaleDateString('nl-NL', {
    timeZone: NL_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  });

  const filteredMatches = matches.filter((m) => {
    if (filter === 'groep') return m.round === 'Groepsfase';
    if (filter === 'knockout') return m.round !== 'Groepsfase';
    if (filter === 'vandaag') {
      const matchDayNL = new Date(m.matchDate).toLocaleDateString('nl-NL', {
        timeZone: NL_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
      });
      return matchDayNL === todayNL;
    }
    return true;
  }).filter((m) => {
    if (selectedGroup && m.group) return m.group === selectedGroup;
    return true;
  });

  const nextMatch = matches.find((m) => new Date(m.matchDate) > new Date());

  const groups = [...new Set(matches.filter((m) => m.group).map((m) => m.group!))].sort();

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
        {(['alle', 'groep', 'knockout', 'vandaag'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setSelectedGroup(''); }}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors capitalize ${
              filter === f
                ? 'bg-wk-green text-white'
                : 'bg-wk-card text-gray-300 hover:bg-wk-card-hover'
            }`}
          >
            {f === 'alle' ? 'Alle wedstrijden' : f === 'groep' ? 'Groepsfase' : f === 'knockout' ? 'Knock-out' : 'Vandaag'}
          </button>
        ))}
      </div>

      {filter === 'groep' && (
        <div className="flex items-center gap-1 flex-wrap">
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

      <div className="text-sm text-gray-400">
        {filteredMatches.length} wedstrijd{filteredMatches.length !== 1 ? 'en' : ''}
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
          Geen wedstrijden gevonden voor dit filter.
        </div>
      )}
    </div>
  );
}
