# Car Detailing Tycoon

Un juego para celular de un negocio de lavado y detallado de autos. Empiezas lavando carros a mano en la cochera de tu casa con una cubeta y una franela, y terminas con un estudio de detallado premium que puedes franquiciar.

## Cómo se juega

- **Tu bahía**: toca el auto que está en Tu bahía y arrastra el dedo para enjabonar, enjuagar y secar. Si te cansas, toca "Que se termine solo".
- **Bahías con empleados**: lavan solas. Tócalas para acelerarlas ("¡Ándale!") y mantenlas presionadas para ver el detalle.
- **La fila**: cada auto muestra su paciencia (carita verde, amarilla o roja) y lo que pidió. Si se le acaba la paciencia, se va enojado y baja tu reputación.
- **Pestañas de abajo**: Taller (bahías, fila, contratos y reseñas), Servicios (precios), Personal (contratar y capacitar), Mejoras (equipo y mejoras), Promo (publicidad) y Negocio (mudanzas, logros, estadísticas y franquicia).
- **Precios**: si cobras de más llegan menos clientes; si cobras de menos se llena la fila pero ganas menos.
- La partida se guarda sola. Cuando regresas, cobras lo que tu equipo ganó mientras no estabas.

## Cómo jugarlo en el celular

### Opción 1: publicado en GitHub Pages

Cada vez que se sube código a la rama `main`, GitHub construye el juego y lo publica solo.

1. En GitHub, entra a tu repositorio → **Settings** → **Pages**.
2. En **Source** elige **GitHub Actions**.
3. Espera 2 o 3 minutos (puedes verlo en la pestaña **Actions**).
4. El juego queda en: `https://<tu-usuario>.github.io/<nombre-del-repositorio>/`

### Opción 2: un solo archivo

`npm run build:single` crea `dist-single/index.html`, un solo archivo con todo adentro. Lo puedes abrir directo en el navegador o subirlo a cualquier hosting.

## Instalarlo en la pantalla de inicio

- **Android (Chrome)**: abre el juego, ve a ⚙️ Ajustes → **Instalar en mi celular** y acepta el aviso. También sirve el menú ⋮ → "Instalar app".
- **iPhone (Safari)**: abre el juego en Safari, toca el botón **Compartir** (el cuadrito con flecha hacia arriba) → **Agregar a pantalla de inicio** → **Agregar**.

Ya instalado se abre en pantalla completa, en vertical, y funciona sin internet después de la primera vez.

## Dónde se cambian las cosas

- **Números del balance** (precios, tiempos, costos, probabilidades): `src/game/data/`.
  - `services.ts` servicios · `vehicles.ts` autos · `equipment.ts` equipo · `locations.ts` locales y bahías
  - `staff.ts` personal · `upgrades.ts` mejoras · `marketing.ts` publicidad · `contracts.ts` contratos
  - `events.ts` clima y eventos · `economy.ts` fórmulas y calendario · `prestige.ts` franquicia · `achievements.ts` logros
- **Textos del juego**: `src/game/data/strings.ts` (reseñas en `reviews.ts`, nombres en `names.ts`, modelos de autos en `carModels.ts`).
- Si cambias números, corre `npm run test`: la prueba de balance juega sola dos partidas y revisa que el ritmo siga bien (el resultado queda en `BALANCE.md`).

## Para programadores

```bash
npm install
npm run dev          # servidor de desarrollo
npm run typecheck    # TypeScript estricto
npm run lint         # ESLint
npm run test         # pruebas (incluye la simulación de balance)
npm run build        # build de producción en dist/
npm run build:single # un solo archivo en dist-single/index.html
npm run shots        # capturas de revisión en screenshots/ (agrega -- --soak para 3 min a ×20)
```

Con `?debug=1` en la dirección aparece un panel para sumar dinero, adelantar el tiempo, cambiar la velocidad y forzar eventos.
