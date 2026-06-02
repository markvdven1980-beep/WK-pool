import type { BonusQuestion } from '../api';
import { ALL_TEAMS, GROUPS, getFlag } from '../teams';

interface Props {
  question: BonusQuestion;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function BonusInput({ question, value, onChange, disabled }: Props) {
  const base =
    'w-full bg-wk-darker border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-wk-orange disabled:opacity-50';

  if (question.type === 'team' || question.type === 'groupWinner') {
    const options = question.type === 'groupWinner' && question.group
      ? GROUPS[question.group] ?? []
      : ALL_TEAMS;
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={base}
      >
        <option value="">— Kies een land —</option>
        {options.map((team) => (
          <option key={team} value={team}>
            {getFlag(team)} {team}
          </option>
        ))}
      </select>
    );
  }

  if (question.type === 'number') {
    return (
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={question.placeholder}
        className={base}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={question.placeholder}
      className={base}
    />
  );
}
