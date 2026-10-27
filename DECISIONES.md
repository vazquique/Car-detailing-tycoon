# DECISIONES

Decisiones tomadas por mi cuenta, con una línea de por qué.

- **TypeScript 6.0 en vez de 7.0**: typescript-eslint (el lint oficial) todavía no soporta TS 7; 6.0 es la última versión compatible.
- **Playwright fijo en 1.63.0**: es la versión que coincide con el Chromium ya instalado en el entorno, para no descargar otro navegador.
- **Rama `main`**: el repositorio estaba vacío; trabajo directo en `main` porque el workflow de GitHub Pages publica desde ahí.
- **Fuentes solo con el subconjunto latino**: cubre acentos, ñ, ¿ y ¡, y reduce el peso del juego.
- **Dinero abreviado hacia abajo** ($999.9K y no $1.0M): para que nunca parezca que tienes más dinero del que realmente tienes.
- **Íconos PNG generados con @resvg/resvg-js** desde un SVG dibujado en código (`npm run icons`), sin herramientas externas.
