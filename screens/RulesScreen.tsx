import React from 'react';

interface Props {
  onBack: () => void;
}

const RulesScreen: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="flex-1 flex flex-col animate-in slide-in-from-left duration-300">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="p-3 bg-slate-900 rounded-2xl text-slate-400 hover:text-white border border-slate-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-3xl font-black ml-4 tracking-tighter italic uppercase">Normas y Puntos</h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Objetivo</p>
          <p className="text-sm text-slate-300">Los civiles intentan descubrir al impostor. El impostor intenta pasar desapercibido.</p>
        </section>

        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Flujo de ronda</p>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>1. Revelar rol por turnos.</li>
            <li>2. Dar pista (orden de mesa).</li>
            <li>3. Debate.</li>
            <li>4. Votacion y expulsion.</li>
            <li>5. Si no termina la partida, nueva ronda.</li>
          </ul>
        </section>

        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Condiciones de victoria</p>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>1. Si no quedan impostores: ganan civiles.</li>
            <li>2. Si no quedan civiles: gana impostor.</li>
            <li>3. Modo `TWO_LEFT`: si quedan 2 jugadores vivos, gana impostor.</li>
            <li>4. Modo `PARITY`: si impostores vivos son iguales o mas que civiles vivos, gana impostor.</li>
          </ul>
        </section>

        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Puntuacion de votos</p>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>1. Voto individual: +2 si votas al expulsado y era impostor.</li>
            <li>2. Voto individual: -2 si votas al expulsado y era civil.</li>
            <li>3. Voto de grupo (consenso): todos +1 si expulsan impostor; todos -2 si expulsan civil.</li>
            <li>4. En voto individualizado dentro de modo grupo, se aplica la misma regla de voto individual.</li>
            <li>5. Abstenerse no suma ni resta por si solo.</li>
          </ul>
        </section>

        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Puntuacion por estado de partida</p>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>1. Impostor que sobrevive ronda: +2 / +4 / +6 / +8 (segun ronda).</li>
            <li>2. Si expulsan a un impostor: cada civil activo +1.</li>
            <li>3. Faccion ganadora: +3 por jugador de esa faccion.</li>
            <li>4. Jugadores que sobreviven al final: +2.</li>
            <li>5. Impostor ganador y no expulsado: +2 extra.</li>
            <li>6. Cierre `TWO_LEFT`: impostor vivo +10 extra.</li>
            <li>7. Cierre `TWO_LEFT`: civiles reciben penalizacion creciente por salida tardia.</li>
          </ul>
        </section>

        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Penalizaciones especiales</p>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>1. Recordatorio nominativo de palabra: civil -2.</li>
            <li>2. Si el objetivo del recordatorio es impostor: -10 y aviso de trampa.</li>
            <li>3. Todos los eventos quedan registrados en el marcador de sesion.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default RulesScreen;
