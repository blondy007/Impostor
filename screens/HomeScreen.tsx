
import React from 'react';

interface Props {
  bannerSrc?: string;
  onNewGame: () => void;
  onLibrary: () => void;
}

const HomeScreen: React.FC<Props> = ({ bannerSrc, onNewGame, onLibrary }) => {
  const fallbackBanner = `${import.meta.env.BASE_URL}nuevos/noir.png`;

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in duration-500">
      <div className="relative">
        <div className="absolute -inset-4 bg-indigo-600 opacity-20 blur-2xl rounded-full"></div>
        <div className="text-center space-y-1 relative flex flex-col items-center">
          <img
            src={bannerSrc || fallbackBanner}
            alt="El Impostor"
            className="w-full max-w-[300px] h-auto object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]"
          />
          <h1 className="sr-only">EL IMPOSTOR</h1>
          <div className="h-1.5 w-24 bg-red-600 mx-auto rounded-full mt-4"></div>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] pt-4">Infiltración & Engaño</p>
        </div>
      </div>

      <div className="w-full flex flex-col gap-4 max-w-[280px]">
        <button 
          onClick={onNewGame}
          className="w-full bg-white text-slate-950 hover:bg-indigo-50 active:scale-95 transition-all p-6 rounded-[2rem] font-black text-xl shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)]"
        >
          Nueva Partida
        </button>
        <button 
          onClick={onLibrary}
          className="w-full bg-slate-900 text-white hover:bg-slate-800 active:scale-95 transition-all p-5 rounded-[2rem] font-black text-lg border-2 border-slate-800"
        >
          Biblioteca
        </button>
      </div>

      <div className="flex gap-4 items-center">
         <div className="w-8 h-[2px] bg-slate-800"></div>
         <span className="text-slate-500 font-black text-[10px] tracking-widest uppercase italic">Pasar & Jugar</span>
         <div className="w-8 h-[2px] bg-slate-800"></div>
      </div>
    </div>
  );
};

export default HomeScreen;
