import React from 'react';

const CardIcon = ({ rank, suit }) => {
  const isRed = suit === 'h' || suit === 'd';
  const suitSymbol = { s: '♠', h: '♥', d: '♦', c: '♣' }[suit];
  return (
    <div className={`bg-white border border-gray-300 rounded-md flex flex-col items-center justify-center select-none shadow-sm w-full h-full ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
      <span className="font-bold text-sm leading-none">{rank}</span>
      <span className="text-base leading-none">{suitSymbol}</span>
    </div>
  );
};

export default CardIcon;