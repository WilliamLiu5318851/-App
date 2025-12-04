import React from 'react';

const DrawProbabilityChart = ({ outs, street, t }) => {
  if (!outs || street > 2 || street < 1) return null;

  const turnProb = outs * 2.1;
  const riverProb = outs * 2.2;
  const turnAndRiverProb = outs * 4.2;

  const probabilities = [];
  if (street === 1) { // Flop
    probabilities.push({ label: t.street_turn, prob: turnProb });
    probabilities.push({ label: `${t.street_turn} or ${t.street_river}`, prob: turnAndRiverProb });
  } else if (street === 2) { // Turn
    probabilities.push({ label: t.street_river, prob: riverProb });
  }

  return (
    <div className="space-y-2">
      {probabilities.map(({ label, prob }) => (
        <div key={label} className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 w-24 text-right">{label}</span>
          <div className="flex-1 bg-slate-900/50 rounded-full h-5 overflow-hidden border border-slate-700">
            <div className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full flex items-center justify-end px-2 transition-all duration-500" style={{ width: `${Math.min(prob, 100)}%` }}>
              <span className="text-white text-[10px] font-bold">{prob.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DrawProbabilityChart;