import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import type { Pool, BonusData, BonusQuestion } from '../api';
import BonusInput from '../components/BonusInput';

export default function BonusPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [data, setData] = useState<BonusData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});
  const [loading, setLoading] = useState(true);
  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    api.pools.list().then((p) => {
      setPools(p);
      if (p.length > 0) setSelectedPool(p[0].id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedPool) return;
    api.bonus.get(selectedPool).then((d) => {
      setData(d);
      const map: Record<string, string> = {};
      d.predictions.forEach((p) => { map[p.question] = p.answer; });
      setAnswers(map);
    });
  }, [selectedPool]);

  const save = useCallback(async (question: string, answer: string) => {
    if (!selectedPool || !answer.trim()) return;
    setStatus((s) => ({ ...s, [question]: 'saving' }));
    try {
      await api.bonus.save(selectedPool, question, answer.trim());
      setStatus((s) => ({ ...s, [question]: 'saved' }));
      setTimeout(() => setStatus((s) => ({ ...s, [question]: 'idle' })), 2000);
    } catch {
      setStatus((s) => ({ ...s, [question]: 'error' }));
    }
  }, [selectedPool]);

  const handleChange = (q: BonusQuestion, value: string) => {
    setAnswers((a) => ({ ...a, [q.key]: value }));
    if (debounceRefs.current[q.key]) clearTimeout(debounceRefs.current[q.key]);
    // Dropdowns slaan direct op; vrije tekst/getal met korte vertraging.
    const delay = q.type === 'team' || q.type === 'groupWinner' ? 0 : 800;
    debounceRefs.current[q.key] = setTimeout(() => save(q.key, value), delay);
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Laden...</div>;

  if (pools.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">⭐</div>
        <h3 className="text-xl font-semibold mb-2">Geen poules</h3>
        <p className="text-gray-400">Neem eerst deel aan een poule om bonusvragen in te vullen.</p>
      </div>
    );
  }

  const deadlinePassed = data?.deadlinePassed ?? false;
  const deadlineStr = data?.deadline
    ? new Date(data.deadline).toLocaleString('nl-NL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    : '';

  const generalQuestions = data?.questions.filter((q) => q.type !== 'groupWinner') ?? [];
  const groupQuestions = data?.questions.filter((q) => q.type === 'groupWinner') ?? [];

  const renderQuestion = (q: BonusQuestion) => {
    const official = data?.officialAnswers.find((a) => a.question === q.key);
    const pred = data?.predictions.find((p) => p.question === q.key);
    const st = status[q.key] ?? 'idle';
    return (
      <div key={q.key} className="bg-wk-card rounded-xl p-4 border border-gray-700 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm">{q.label}</h3>
          <span className="text-xs bg-wk-gold/20 text-wk-gold px-2 py-0.5 rounded font-bold shrink-0">
            {q.points}p
          </span>
        </div>
        <BonusInput
          question={q}
          value={answers[q.key] ?? ''}
          onChange={(v) => handleChange(q, v)}
          disabled={deadlinePassed}
        />
        <div className="flex items-center justify-between text-xs min-h-[16px]">
          <span>
            {st === 'saving' && <span className="text-gray-400">Opslaan...</span>}
            {st === 'saved' && <span className="text-green-400">Opgeslagen ✓</span>}
            {st === 'error' && <span className="text-red-400">Fout bij opslaan</span>}
          </span>
          {official && (
            <span className="text-gray-400">
              Officieel: <span className="text-white">{official.answer}</span>
              {pred?.correct === true && <span className="text-green-400 font-bold ml-1">✓ +{pred.points}</span>}
              {pred?.correct === false && <span className="text-red-400 ml-1">✗</span>}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Bonusvragen</h2>
        <p className="text-gray-400 text-sm mt-1">
          Vul deze vragen vóór de start van het WK in. Deadline: <span className="text-wk-gold">{deadlineStr}</span>
        </p>
      </div>

      {pools.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          {pools.map((pool) => (
            <button
              key={pool.id}
              onClick={() => setSelectedPool(pool.id)}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                selectedPool === pool.id ? 'bg-wk-orange text-white' : 'bg-wk-card text-gray-300 hover:bg-wk-card-hover'
              }`}
            >
              {pool.name}
            </button>
          ))}
        </div>
      )}

      {deadlinePassed && (
        <div className="bg-red-900/30 text-red-300 rounded-lg p-3 text-sm">
          De deadline is verstreken — je kunt je bonusvragen niet meer aanpassen.
        </div>
      )}

      <div className="space-y-3">
        {generalQuestions.map(renderQuestion)}
      </div>

      {groupQuestions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-wk-gold mb-3">Poulewinnaars (elk 10 punten)</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {groupQuestions.map(renderQuestion)}
          </div>
        </div>
      )}
    </div>
  );
}
