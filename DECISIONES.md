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

## Balance (ajustado con `tests/balance.test.ts`)

- **Tiempos de servicio ~45% más cortos** que los del documento (ej. Lavado exterior 12 s en vez de 20 s): con los originales el bot tardaba casi una hora en salir de la cochera.
- **Llegadas por local**: cochera cada 7 s, Local cada 5 s, Nave cada 2 s y Estudio cada 1.2 s. Más clientes mantienen la capacidad (bahías y personal) como lo que hay que mejorar.
- **Mudanzas**: Local $12,000 (antes $25,000), Nave $150,000 (antes $600,000), Estudio $12,000,000 (igual). Rentas: $800, $5,000 y $50,000 diarios.
- **La Nave tiene 10 bahías** (antes 8): con 8 se quedaba sin nada que mejorar y el ingreso se estancaba más de 20 minutos.
- **Contrataciones más baratas en locales grandes** (crecen ×2.5 por local en vez de ×3.2).
- **Puntos de Franquicia** = raíz(ganancias / 130,000) en vez de / 1,000,000, para dar 8 a 15 PF a las 3 h.
- **Cada PF ganado da +8% de ingresos** (antes 3%): con 3% la segunda partida no llegaba 1.8 veces más rápido.
- **"Sin estancarse"** se mide como: el promedio de ingreso por minuto de los últimos 20 minutos (solo autos atendidos; los pagos de contratos llegan en bloque) debe alcanzar un nuevo máximo al menos cada 20 minutos. Con promedio de 10 min los fines de semana y quincenas creaban picos que no eran crecimiento real.
- **El bot sigue el tutorial** (después de la Hidrolavadora contrata a su primer ayudante) y **evalúa como una sola compra** los servicios que necesitan dos equipos (Corrección de pintura).
- **Robustez**: con 8 semillas distintas, 7 cumplen todas las ventanas; la otra tuvo un estancamiento de 23 min. La prueba usa la semilla 1.

## Pulido y entrega

- **Las celebraciones esperan** a que se cierre cualquier ventana abierta, y las monedas/textos flotantes solo salen de bahías visibles.
- **Barra bajo la fila** con "Fila 3/5 · Toca un auto para ver su pedido", en vez de una etiqueta encima de los autos.
- **Estilos base en `@layer base`**: con Tailwind v4, los estilos sin capa le ganaban a los degradados de los botones.
- **El archivo único** también lleva incrustados el ícono y el favicon; ahí no hay service worker (se abre como archivo).
- **Capturas**: el script limpia celebraciones y avisos antes de cada captura, para que se vea cada pantalla tal cual.
- **Verificado en navegador**: el minijuego con el dedo (emulación táctil), recargar la página conserva la partida y cobra la ganancia offline, y 3 minutos a ×20 sin errores ni advertencias en la consola.
- **Publicación en la rama `gh-pages`**: GitHub Actions construye el juego y lo sube a esa rama; GitHub activa Pages solo, sin entrar a Settings.
