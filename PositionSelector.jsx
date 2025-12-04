import React from 'react';
import { X, MapPin, CheckCircle } from 'lucide-react';

const PositionSelector = ({ show, onClose, onPositionSelect, currentPosition, POSITIONS, lang, t }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-600 shadow-2xl w-full max-w-sm max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between mb-4">
          <h3 className="font-bold text-white flex items-center gap-2"><MapPin className="w-4 h-4" /> {t.select_position}</h3>
          <button onClick={onClose}><X /></button>
        </div>
        <div className="space-y-3">
          {['EP', 'MP', 'LP', 'BLINDS'].map(key => {
            const data = POSITIONS[lang][key];
            return (
              <button
                key={key}
                onClick={() => onPositionSelect(key)}
                className={`w-full text-left p-3 rounded-lg border transition ${currentPosition === key ? 'bg-blue-900/30 border-blue-500' : 'bg-slate-700/30 border-slate-700 hover:bg-slate-700'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-bold text-sm ${currentPosition === key ? 'text-blue-300' : 'text-slate-200'}`}>{data.label}</span>
                  {currentPosition === key && <CheckCircle className="w-3 h-3 text-blue-400" />}
                </div>
                <p className="text-[10px] text-slate-400 mb-1 leading-relaxed">{data.description}</p>
                <p className="text-[10px] text-slate-500 italic">💡 {data.action_plan}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PositionSelector;