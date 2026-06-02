import { useState, useEffect } from 'react';
import { api } from '../api';

interface Props {
  onGoToBonus: () => void;
}

export default function BonusReminder({ onGoToBonus }: Props) {
  const [missing, setMissing] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [deadlineStr, setDeadlineStr] = useState('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pools = await api.pools.list();
        if (pools.length === 0) return;
        // Controleer alle poules; toon de poule met de meeste open vragen.
        let worstMissing = 0;
        let questionTotal = 0;
        let deadlinePassed = false;
        let deadline = '';
        for (const pool of pools) {
          const data = await api.bonus.get(pool.id);
          if (data.deadlinePassed) { deadlinePassed = true; break; }
          deadline = data.deadline;
          questionTotal = data.questions.length;
          const answered = new Set(data.predictions.filter((p) => p.answer.trim()).map((p) => p.question));
          const openCount = data.questions.filter((q) => !answered.has(q.key)).length;
          if (openCount > worstMissing) worstMissing = openCount;
        }
        if (cancelled || deadlinePassed) return;
        setTotal(questionTotal);
        setMissing(worstMissing);
        if (deadline) {
          setDeadlineStr(new Date(deadline).toLocaleString('nl-NL', {
            day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
          }));
        }
      } catch {
        /* stil falen — herinnering is niet kritiek */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (dismissed || missing === null || missing === 0) return null;

  return (
    <div className="bg-gradient-to-r from-wk-orange/20 to-wk-gold/10 border border-wk-orange rounded-xl p-4 mb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⭐</span>
          <div>
            <p className="font-semibold text-white">Vergeet je bonusvragen niet!</p>
            <p className="text-sm text-gray-300 mt-0.5">
              Het WK is nog niet begonnen. Je hebt nog <span className="text-wk-orange font-bold">{missing} van de {total}</span> bonusvragen niet ingevuld.
              {deadlineStr && <> Deadline: <span className="text-wk-gold">{deadlineStr}</span>.</>}
            </p>
            <button
              onClick={onGoToBonus}
              className="mt-2 bg-wk-orange hover:bg-wk-orange-dark text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              Nu invullen →
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-white text-lg leading-none shrink-0"
          aria-label="Sluiten"
        >
          ×
        </button>
      </div>
    </div>
  );
}
