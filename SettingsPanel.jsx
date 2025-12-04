import React from 'react';
import { Settings, X } from 'lucide-react';

const SettingsPanel = ({ show, onClose, t, deckCount, onDeckCountChange, buyInAmount, onBuyInChange }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-600 shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between mb-4">
          <h3 className="font-bold text-white flex items-center gap-2"><Settings className="w-4 h-4" /> {t.game_settings}</h3>
          <button onClick={onClose}><X /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">{t.deck_count}: <span className="text-white font-mono">{deckCount}</span></label>
            <input type="range" min="1" max="8" value={deckCount} onChange={onDeckCountChange} className="w-full accent-blue-500" />
            <div className="flex justify-between text-xs text-slate-600 font-mono"><span>1</span><span>8</span></div>
            <p className="text-[10px] text-slate-500 mt-1">{t.deck_info}</p>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">{t.buy_in_amount}</label>
            <div className="flex items-center bg-slate-900 rounded border border-slate-700"><span className="px-3 text-slate-500">$</span><input type="number" value={buyInAmount} onChange={onBuyInChange} className="w-full bg-transparent py-2 text-white font-mono focus:outline-none" /></div>
            <p className="text-[10px] text-slate-500 mt-1">{t.buy_in_info}</p>
          </div>
          <div className="p-3 bg-slate-900 rounded text-xs text-slate-500 border border-slate-700">
            <p>GTO Engine v7.0 Active</p>
            <p className="mt-1 text-emerald-500">• Strict Hand Logic</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;