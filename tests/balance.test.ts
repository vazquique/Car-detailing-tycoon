// Balance simulation: a bot plays two full runs without a browser and checks the pacing windows.
import { describe, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { GameState } from '../src/game/types';
import { newBotGame, playRun, spendPf, type BotLog } from './bot';
import { queueCapacity } from '../src/game/sim/economy';

const SEED = 1;

/** Target windows in real minutes. */
const WINDOWS: { id: string; label: string; min: number; max: number }[] = [
  { id: 'pressureWasher', label: 'Primer lavado a mano y Hidrolavadora', min: 0, max: 2 },
  { id: 'firstHire', label: 'Primer empleado contratado', min: 3, max: 6 },
  { id: 'location1', label: 'Mudanza al Local en la colonia', min: 12, max: 25 },
  { id: 'location2', label: 'Mudanza a la Nave en avenida', min: 45, max: 90 },
  { id: 'location3', label: 'Mudanza al Estudio premium', min: 150, max: 270 },
  { id: 'franchise', label: 'Primera franquicia', min: 180, max: 360 },
];
const STALL_LIMIT_MIN = 20;

function invariants(s: GameState): void {
  if (!Number.isFinite(s.money)) throw new Error(`money is not finite: ${s.money}`);
  if (s.reputation < 1 || s.reputation > 5)
    throw new Error(`reputation out of range: ${s.reputation}`);
  if (s.queue.length > queueCapacity(s)) throw new Error(`queue over capacity: ${s.queue.length}`);
  const seen = new Set<number>();
  for (const b of s.bays) {
    if (b.workerId === null) continue;
    if (seen.has(b.workerId)) throw new Error(`worker ${b.workerId} in two bays`);
    seen.add(b.workerId);
  }
}

const min = (log: BotLog, id: string): number => (log.milestones[id] ?? Number.NaN) / 60;

describe('balance simulation', () => {
  it('meets every pacing window in two runs', () => {
    const run1 = playRun(newBotGame(SEED), { maxSeconds: 7 * 3600, check: invariants });
    const run2 = playRun(spendPf(run1.state), { maxSeconds: 6 * 3600, check: invariants });

    const rows = WINDOWS.map((w) => {
      const a = min(run1.log, w.id);
      const b = min(run2.log, w.id);
      return { ...w, a, b, speedup: a / Math.max(b, 0.1) };
    });

    const lines = [
      '# BALANCE',
      '',
      'Resultado de `tests/balance.test.ts`: un bot juega solo, sin navegador, dos partidas seguidas',
      `(semilla ${SEED}). Los tiempos son minutos reales de juego.`,
      '',
      '| Hito | Ventana objetivo | Partida 1 | Partida 2 | Más rápido |',
      '| --- | --- | --- | --- | --- |',
      ...rows.map(
        (r) =>
          `| ${r.label} | ${r.min}–${r.max} min | ${r.a.toFixed(1)} min | ${r.b.toFixed(1)} min | ${r.speedup.toFixed(1)}× |`,
      ),
      '',
      `- Puntos de Franquicia en la primera franquicia: **${run1.log.pf}** (objetivo: 8 a 15).`,
      `- Estancamiento más largo del ingreso por minuto (promedio de 20 min): ${(run1.log.maxStall / 60).toFixed(0)} min en la partida 1 y ${(run2.log.maxStall / 60).toFixed(0)} min en la partida 2 (máximo permitido: ${STALL_LIMIT_MIN}).`,
      '- En cada tick se verificó: dinero finito, reputación entre 1 y 5, fila dentro de su capacidad y ningún empleado en dos bahías.',
      '',
      '## Cómo juega el bot',
      '',
      '- Cada 5 s compra lo que antes se paga (tiempo para juntar el dinero + tiempo para recuperarlo), entre equipo, bahías, mejoras, contrataciones, cursos, publicidad permanente y mudanza. Mientras ahorra para algo grande, compra cosas baratas que se pagan en menos de 15 min.',
      '- Sigue el tutorial: después de la Hidrolavadora contrata a su primer ayudante.',
      '- Precios: fila llena → +5%; bahías vacías → −5%; siempre entre 80% y 140% del precio justo.',
      '- Acepta contratos que puede cumplir y usa volantes/influencer cuando la fila está vacía.',
      '- Durante la primera hora lava a mano la mitad de los autos de Tu bahía (unos 3 s por paso).',
      '- Franquicia en cuanto puede y reparte sus PF antes de la segunda partida.',
    ];
    writeFileSync(resolve(import.meta.dirname, '../BALANCE.md'), lines.join('\n') + '\n');

    for (const r of rows) {
      expect(r.a, `${r.label} (partida 1)`).toBeGreaterThanOrEqual(r.min);
      expect(r.a, `${r.label} (partida 1)`).toBeLessThanOrEqual(r.max);
      expect(r.speedup, `${r.label} debe ser 1.8× más rápido`).toBeGreaterThanOrEqual(1.8);
    }
    expect(run1.log.pf).toBeGreaterThanOrEqual(8);
    expect(run1.log.pf).toBeLessThanOrEqual(15);
    expect(run1.log.maxStall / 60).toBeLessThanOrEqual(STALL_LIMIT_MIN);
    expect(run2.log.maxStall / 60).toBeLessThanOrEqual(STALL_LIMIT_MIN);
  }, 180_000);
});
