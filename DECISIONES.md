# DECISIONES

Decisiones tomadas por mi cuenta, con una línea de por qué.

- **TypeScript 6.0 en vez de 7.0**: typescript-eslint (el lint oficial) todavía no soporta TS 7; 6.0 es la última versión compatible.
- **Playwright fijo en 1.63.0**: es la versión que coincide con el Chromium ya instalado en el entorno, para no descargar otro navegador.
- **Rama `main`**: el repositorio estaba vacío; trabajo directo en `main` porque el workflow de GitHub Pages publica desde ahí.
- **Fuentes solo con el subconjunto latino**: cubre acentos, ñ, ¿ y ¡, y reduce el peso del juego.
- **Dinero abreviado hacia abajo** ($999.9K y no $1.0M): para que nunca parezca que tienes más dinero del que realmente tienes.
- **Íconos PNG generados con @resvg/resvg-js** desde un SVG dibujado en código (`npm run icons`), sin herramientas externas.
- **Etiquetas de pestañas cortas** ("Promo" en vez de "Marketing"): con 6 pestañas en 360 px de ancho y letra mínima de 14 px, "Marketing" no cabe. Dentro de la hoja el título dice "Publicidad".
- **El primer cliente ya está esperando** al iniciar una partida, para que el jugador lave su primer auto en los primeros segundos.
- **Clientes VIP solo desde el Local en la colonia**: en la cochera la calidad máxima ronda 79% y cada VIP bajaría reputación sin que el jugador pueda evitarlo.
- **Autos de contrato**: no pagan individualmente; el pago total llega al cumplir el contrato. Las comisiones e insumos sí se pagan por auto (ese es el riesgo de fallar). No pierden la paciencia.
- **Clientes que piden un servicio que no tienes** (5%): se van sin contar como "perdidos", solo dejan la pista.
- **"Que se termine solo"**: los pasos a mano ya hechos conservan la calidad de lavado a mano; el resto lo termina tu bahía a velocidad de dueño. No se puede reabrir el minijuego para ese mismo auto.
- **Cliente enojado**: cuenta como reseña de 1 estrella en el promedio de reputación (además a veces deja la reseña escrita).
- **Textos de reseñas, nombres y modelos** viven en sus propios archivos de datos (`reviews.ts`, `names.ts`, `carModels.ts`); el resto de la interfaz está en `strings.ts`.
- **Mudanza**: solo al siguiente local, en orden. El costo no cuenta como gasto del día.
