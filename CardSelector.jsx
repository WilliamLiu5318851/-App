import React from 'react';
import { X } from 'lucide-react';
import CardIcon from './CardIcon';

const SUITS = ['s', 'h', 'd', 'c'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

const CardSelector = ({ selectingFor, onClose, onCardSelect, unavailableCards, deckCount, t }) => {
  if (!selectingFor) return null;

  let title = t.selectCard;
  if (selectingFor.type === 'hero') title = `${t.selecting_hero} ${selectingFor.index + 1}/2`;
  if (selectingFor.type === 'board') title = selectingFor.index < 3 ? `${t.selecting_flop} ${selectingFor.index + 1}/3` : selectingFor.index === 3 ? t.selecting_turn : t.selecting_river;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-800 p-4 rounded-xl max-w-lg w-full overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between mb-4 text-white font-bold">
          <span>{title}</span>
          <X onClick={onClose} className="cursor-pointer" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {SUITS.map(suit => (
            <div key={suit} className="flex flex-col gap-2">
              {RANKS.map(rank => {
                const takenCount = unavailableCards.filter(c => c.rank === rank && c.suit === suit).length;
                const isDisabled = takenCount >= deckCount;
                return (
                  <button key={rank + suit} disabled={isDisabled} onClick={() => onCardSelect({ rank, suit })} className={`p-1 rounded flex justify-center hover:bg-slate-700 ${isDisabled ? 'opacity-20 cursor-not-allowed' : ''}`}>
                    <CardIcon rank={rank} suit={suit} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CardSelector;