# PLAN — Car Detailing Tycoon

Checklist de construcción. Se marca cada punto al terminarlo. Cada fase cierra con
`npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` y un commit.

## Fase 0 — Base del proyecto

- [x] Vite + React + TypeScript estricto
- [x] Tailwind v4 + tokens de diseño (tokens.css)
- [x] ESLint + Prettier
- [x] Vitest con prueba real (formato de números)
- [x] Fuentes con @fontsource (Russo One, Inter)
- [x] Estructura de carpetas
- [x] git, PLAN.md, DECISIONES.md
- [x] Workflow de GitHub Pages
- [x] PWA (manifest, íconos generados por código, service worker)
- [x] Meta tags de celular
- [x] Commit fase 0

## Fase 1 — Núcleo jugable

- [x] Tipos, datos, rng con semilla, formato de números, paleta
- [x] Simulación: llegadas, fila, paciencia, bahías, servicios, pago, reputación, reseñas, días y calendario
- [x] Render: 8 autos con suciedad y limpieza, bahías, trabajadores, partículas básicas
- [x] Tu bahía + minijuego de tallado completo
- [x] HUD, pestaña Taller, pestaña Servicios con precios
- [x] Guardado y carga
- [x] Pruebas de economía, simulación y guardado
- [x] Commit fase 1

## Fase 2 — Profundidad

- [x] 12 servicios y todo el equipo
- [x] Personal completo (candidatos, rasgos, XP, cursos, roles de apoyo)
- [x] Mejoras del negocio
- [x] Bahías con niveles
- [x] 4 locales con ambiente
- [x] Marketing
- [x] Clima y pronóstico
- [x] Eventos
- [x] Contratos de flotilla
- [x] Resumen del día
- [x] Progreso offline
- [x] Commit fase 2

## Fase 3 — Meta-progreso y balance

- [ ] Logros (25)
- [ ] Franquicia + árbol completo
- [ ] Estadísticas
- [ ] Simulación de balance (tests/balance.test.ts) con bot
- [ ] Ajustar números hasta cumplir ventanas
- [ ] BALANCE.md
- [ ] Commit fase 3

## Fase 4 — Pulido

- [ ] Respuesta visual y sonora completa (sfx, partículas, monedas, números)
- [ ] Celebraciones y transiciones
- [ ] Mudanza animada
- [ ] Tutorial
- [ ] Ajustes (sonido, vibración, resumen, movimiento, exportar/importar, reiniciar, créditos, instalar)
- [ ] Modo debug (?debug=1)
- [ ] Accesibilidad (reduced motion, contraste, íconos)
- [ ] Todos los tamaños de celular + aviso horizontal
- [ ] scripts/screenshots.ts + revisión visual y correcciones
- [ ] 3 min a ×20 sin errores en consola
- [ ] Commit fase 4

## Fase 5 — Entrega

- [ ] npm run build y npm run build:single
- [ ] README.md en español
- [ ] Verificación de criterios de aceptación
- [ ] Commit fase 5 + push
