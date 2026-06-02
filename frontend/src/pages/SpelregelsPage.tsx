export default function SpelregelsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold">Spelregels</h2>

      <section className="bg-wk-card rounded-xl p-5 border border-gray-700 space-y-3">
        <h3 className="text-lg font-bold text-wk-orange">Hoe werkt het?</h3>
        <p className="text-gray-300 text-sm leading-relaxed">
          Voorspel de uitslag van alle 104 WK-wedstrijden en verdien punten op basis van je voorspellingen.
          Strijd tegen je vrienden, familie of collega's in een privépoule!
        </p>
        <div className="text-sm text-gray-300 space-y-1">
          <p>1. Maak een account aan of log in</p>
          <p>2. Maak een poule aan of neem deel met een uitnodigingscode</p>
          <p>3. Vul per wedstrijd de verwachte eindstand in + je toto (1/X/2)</p>
          <p>4. Bekijk de ranglijst en volg je voortgang</p>
        </div>
      </section>

      <section className="bg-wk-card rounded-xl p-5 border border-gray-700 space-y-3">
        <h3 className="text-lg font-bold text-wk-orange">Voorspelling invullen</h3>
        <p className="text-gray-300 text-sm leading-relaxed">
          Per wedstrijd vul je twee dingen in:
        </p>
        <div className="bg-wk-darker rounded-lg p-4 space-y-3">
          <div>
            <span className="text-white font-semibold text-sm">Eindstand</span>
            <p className="text-gray-400 text-sm">De exacte einduitslag, bijv. 2-1. In de knock-outfase telt de stand na 120 minuten (verlenging). Strafschoppen tellen niet mee — bij een strafschoppenserie geldt de wedstrijd als gelijkspel.</p>
          </div>
          <div>
            <span className="text-white font-semibold text-sm">Toto (1 / X / 2)</span>
            <p className="text-gray-400 text-sm">
              De toto wordt automatisch ingevuld op basis van je voorspelde uitslag, maar je kunt deze daarna aanpassen.
              Zo kun je bijvoorbeeld 2-1 voorspellen maar toch een X als toto kiezen om je kansen te spreiden.
            </p>
            <div className="flex gap-2 mt-2">
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">1</span>
              <span className="text-gray-400 text-xs">=&nbsp;thuisploeg wint</span>
              <span className="bg-yellow-600 text-white text-xs font-bold px-2 py-1 rounded ml-2">X</span>
              <span className="text-gray-400 text-xs">=&nbsp;gelijkspel</span>
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded ml-2">2</span>
              <span className="text-gray-400 text-xs">=&nbsp;uitploeg wint</span>
            </div>
          </div>
        </div>
        <p className="text-gray-400 text-xs">
          Deadline: je voorspelling wordt vergrendeld 1 minuut vóór de aftrap van de wedstrijd.
        </p>
      </section>

      <section className="bg-wk-card rounded-xl p-5 border border-gray-700 space-y-3">
        <h3 className="text-lg font-bold text-wk-orange">Puntentelling</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="py-2 text-left">Situatie</th>
                <th className="py-2 text-right">Punten</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-gray-700/50">
                <td className="py-2.5">
                  <span className="text-green-400 font-semibold">Exacte uitslag correct</span>
                  <span className="block text-xs text-gray-500">Bijv. je voorspelt 2-1 en het wordt 2-1</span>
                </td>
                <td className="py-2.5 text-right font-bold text-green-400">5 punten</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2.5">
                  <span className="text-blue-400 font-semibold">Toto correct</span>
                  <span className="block text-xs text-gray-500">Je toto (1/X/2) klopt</span>
                </td>
                <td className="py-2.5 text-right font-bold text-blue-400">2 punten</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2.5">
                  <span className="text-yellow-400 font-semibold">Uitslag 1 doelpunt ernaast</span>
                  <span className="block text-xs text-gray-500">Bijv. je voorspelt 2-1 en het wordt 2-0 of 3-1 (niet exact)</span>
                </td>
                <td className="py-2.5 text-right font-bold text-yellow-400">1 punt</td>
              </tr>
              <tr>
                <td className="py-2.5">
                  <span className="text-red-400 font-semibold">Foute voorspelling</span>
                  <span className="block text-xs text-gray-500">Geen van bovenstaande</span>
                </td>
                <td className="py-2.5 text-right font-bold text-red-400">0 punten</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="bg-wk-darker rounded-lg p-4 space-y-1">
          <p className="text-sm text-white font-semibold">Punten tellen op!</p>
          <p className="text-gray-400 text-xs">
            De toto-punten en de uitslag-punten tellen apart bij elkaar op. Heb je dus zowel de toto
            als de exacte uitslag goed, dan krijg je 2 + 5 = <span className="text-wk-gold font-bold">7 punten</span>.
          </p>
          <p className="text-gray-400 text-xs">
            Voorbeeld: je voorspelt 2-1 met toto 1, en het wordt 2-1 → 7 punten.
            Je voorspelt 2-1 met toto 1, en het wordt 3-0 → alleen toto goed = 2 punten.
          </p>
        </div>
      </section>

      <section className="bg-wk-card rounded-xl p-5 border border-gray-700 space-y-3">
        <h3 className="text-lg font-bold text-wk-orange">Vermenigvuldigers per ronde</h3>
        <p className="text-gray-300 text-sm">
          Naarmate het toernooi vordert worden de punten vermenigvuldigd:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { round: 'Groepsfase', mult: '×1', color: 'text-gray-300' },
            { round: 'Zestiende finale', mult: '×2', color: 'text-blue-400' },
            { round: 'Achtste finale', mult: '×3', color: 'text-green-400' },
            { round: 'Kwartfinale', mult: '×4', color: 'text-yellow-400' },
            { round: 'Halve finale', mult: '×5', color: 'text-wk-orange' },
            { round: 'Finale', mult: '×6', color: 'text-wk-gold' },
          ].map((r) => (
            <div key={r.round} className="bg-wk-darker rounded-lg p-3 text-center">
              <div className={`text-xl font-bold ${r.color}`}>{r.mult}</div>
              <div className="text-xs text-gray-400">{r.round}</div>
            </div>
          ))}
        </div>
        <p className="text-gray-400 text-xs">
          Voorbeeld: een exacte uitslag in de kwartfinale levert 5 × 4 = 20 punten op.
        </p>
      </section>

      <section className="bg-gradient-to-br from-wk-orange/15 to-wk-card rounded-xl p-5 border-2 border-wk-orange space-y-3">
        <h3 className="text-lg font-bold text-wk-orange">🇳🇱 Oranje-wedstrijden</h3>
        <p className="text-gray-300 text-sm leading-relaxed">
          Alle wedstrijden van het Nederlands elftal leveren <span className="text-wk-orange font-bold">altijd dubbele punten</span> op,
          ook zonder dat je een joker inzet. Deze wedstrijden zijn herkenbaar aan het oranje kader.
        </p>
        <div className="bg-wk-darker rounded-lg p-4">
          <p className="text-xs text-gray-400">
            Voorbeeld: heb je een Oranje-groepswedstrijd zowel qua toto als exacte uitslag goed,
            dan krijg je (2 + 5) × 2 = <span className="text-wk-orange font-bold">14 punten</span>.
          </p>
        </div>
      </section>

      <section className="bg-wk-card rounded-xl p-5 border border-gray-700 space-y-3">
        <h3 className="text-lg font-bold text-wk-orange">⭐ Bonusvragen</h3>
        <p className="text-gray-300 text-sm leading-relaxed">
          Vul vóór de start van het WK (deadline 10 juni 23:59) je bonusvragen in en verdien extra punten:
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            { label: 'Wereldkampioen', pts: 25 },
            { label: 'Topscorer van het WK', pts: 25 },
            { label: 'Topscorer van Nederland', pts: 25 },
            { label: 'Totaal doelpunten Curaçao', pts: 10 },
            { label: 'Winnaar van elke poule (12×)', pts: 10 },
          ].map((b) => (
            <div key={b.label} className="bg-wk-darker rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-gray-300">{b.label}</span>
              <span className="text-wk-gold font-bold text-sm">{b.pts} punten</span>
            </div>
          ))}
        </div>
        <p className="text-gray-400 text-xs">
          De poulewinnaars leveren elk 10 punten op (12 poules = max 120 punten). Alle bonuspunten tellen mee in je totaalscore op de ranglijst.
        </p>
      </section>

      <section className="bg-wk-card rounded-xl p-5 border border-gray-700 space-y-3">
        <h3 className="text-lg font-bold text-wk-orange">Ranglijst</h3>
        <p className="text-gray-300 text-sm leading-relaxed">
          De ranglijst wordt gesorteerd op totaal aantal punten. Bij een gelijk puntenaantal
          gaat degene met de meeste exacte uitslagen voor.
        </p>
      </section>

      <section className="bg-wk-card rounded-xl p-5 border border-gray-700 space-y-3">
        <h3 className="text-lg font-bold text-wk-orange">WK 2026 Format</h3>
        <p className="text-gray-300 text-sm leading-relaxed">
          Het WK 2026 wordt gespeeld in de VS, Canada en Mexico met 48 landen verdeeld over 12 groepen van 4.
        </p>
        <div className="bg-wk-darker rounded-lg p-4 text-sm text-gray-400 space-y-1">
          <p>Groepsfase: 72 wedstrijden (11 juni – 27 juni)</p>
          <p>Zestiende finales: 16 wedstrijden (nieuw format!)</p>
          <p>Achtste finales: 8 wedstrijden</p>
          <p>Kwartfinales: 4 wedstrijden</p>
          <p>Halve finales: 2 wedstrijden</p>
          <p>Troostfinale + Finale: 2 wedstrijden (19 juli, MetLife Stadium)</p>
          <p className="text-wk-gold font-semibold pt-1">Totaal: 104 wedstrijden</p>
        </div>
      </section>
    </div>
  );
}
