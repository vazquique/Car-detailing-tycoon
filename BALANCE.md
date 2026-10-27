# BALANCE

Resultado de `tests/balance.test.ts`: un bot juega solo, sin navegador, dos partidas seguidas
(semilla 1). Los tiempos son minutos reales de juego.

| Hito | Ventana objetivo | Partida 1 | Partida 2 | Más rápido |
| --- | --- | --- | --- | --- |
| Primer lavado a mano y Hidrolavadora | 0–2 min | 1.1 min | 0.1 min | 8.2× |
| Primer empleado contratado | 3–6 min | 4.1 min | 0.7 min | 6.0× |
| Mudanza al Local en la colonia | 12–25 min | 19.2 min | 7.5 min | 2.6× |
| Mudanza a la Nave en avenida | 45–90 min | 81.4 min | 29.1 min | 2.8× |
| Mudanza al Estudio premium | 150–270 min | 196.4 min | 88.3 min | 2.2× |
| Primera franquicia | 180–360 min | 196.4 min | 88.3 min | 2.2× |

- Puntos de Franquicia en la primera franquicia: **13** (objetivo: 8 a 15).
- Estancamiento más largo del ingreso por minuto (promedio de 20 min): 10 min en la partida 1 y 4 min en la partida 2 (máximo permitido: 20).
- En cada tick se verificó: dinero finito, reputación entre 1 y 5, fila dentro de su capacidad y ningún empleado en dos bahías.

## Cómo juega el bot

- Cada 5 s compra lo que antes se paga (tiempo para juntar el dinero + tiempo para recuperarlo), entre equipo, bahías, mejoras, contrataciones, cursos, publicidad permanente y mudanza. Mientras ahorra para algo grande, compra cosas baratas que se pagan en menos de 15 min.
- Sigue el tutorial: después de la Hidrolavadora contrata a su primer ayudante.
- Precios: fila llena → +5%; bahías vacías → −5%; siempre entre 80% y 140% del precio justo.
- Acepta contratos que puede cumplir y usa volantes/influencer cuando la fila está vacía.
- Durante la primera hora lava a mano la mitad de los autos de Tu bahía (unos 3 s por paso).
- Franquicia en cuanto puede y reparte sus PF antes de la segunda partida.
