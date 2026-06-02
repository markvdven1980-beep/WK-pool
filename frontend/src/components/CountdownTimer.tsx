import { useState, useEffect } from 'react';

interface Props {
  targetDate: string;
  label: string;
}

export default function CountdownTimer({ targetDate, label }: Props) {
  const [timeLeft, setTimeLeft] = useState(calcTimeLeft());

  function calcTimeLeft() {
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return null;
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  }

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className="bg-wk-card rounded-xl p-4 border border-wk-orange/30 text-center">
      <p className="text-sm text-gray-400 mb-2">{label}</p>
      <div className="flex justify-center gap-3">
        {[
          { val: timeLeft.days, label: 'dagen' },
          { val: timeLeft.hours, label: 'uur' },
          { val: timeLeft.minutes, label: 'min' },
          { val: timeLeft.seconds, label: 'sec' },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <div className="bg-wk-darker rounded-lg w-14 h-14 flex items-center justify-center text-2xl font-bold text-wk-orange">
              {String(item.val).padStart(2, '0')}
            </div>
            <span className="text-xs text-gray-500 mt-1">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
