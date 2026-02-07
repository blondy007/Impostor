# Despliegue en Android y Hosting Gratis (guia practica)

Fecha: 2026-02-07
Proyecto: `El Impostor`

## Resumen corto

1. Sin cambiar codigo, si puedes publicarla como web estatica (GitHub Pages) y usarla en Android.
2. Para que se "instale como app" en Android de forma buena, necesitas cambios minimos tipo PWA (manifest + iconos + service worker + HTTPS).
3. GitHub Pages es valido y gratuito para uso bajo.

---

## Estado actual de esta app (importante)

Segun el codigo actual:
- Es una app React + Vite estatica.
- No hay manifiesto PWA ni service worker configurados.
- La clave de Gemini se inyecta en frontend durante build (`vite.config.ts`), por lo que puede quedar expuesta en cliente si se usa IA.

Conclusion:
- Publicar web: si, directo.
- Instalable estilo app (PWA solida): no todavia, faltan piezas.

---

## Se puede instalar en Android sin cambiar codigo?

### Opcion A: usar como web (cero cambios)
- Subes a GitHub Pages.
- En Android, abres en Chrome y usas "Anadir a pantalla de inicio".
- Funciona, pero suele comportarse mas como acceso directo web (menos app nativa).

### Opcion B: instalacion real estilo app PWA (cambios minimos)
Necesitas:
1. `manifest.webmanifest` con `name/short_name/start_url/display/icons`.
2. Iconos al menos `192x192` y `512x512`.
3. Service worker registrado.
4. Servir por HTTPS (GitHub Pages ya cumple).

Con eso, Android/Chrome puede ofrecer instalacion en modo app de forma consistente.

---

## Donde puedes alojarla gratis (recomendacion)

### Recomendado para tu caso: GitHub Pages
- Gratis.
- Ideal para estaticas con poco trafico.
- HTTPS incluido.

Alternativas tambien gratis:
- Cloudflare Pages
- Netlify
- Vercel (estatico)

---

## Cambios necesarios para GitHub Pages (minimos)

### 1) Ajustar `base` en Vite
Si publicas en `https://USUARIO.github.io/REPO/`, configura:
- `base: '/REPO/'` en `vite.config.ts`.

Si publicas en `https://USUARIO.github.io/`, puedes dejar `base: '/'` (o sin `base`, que ya es `/`).

### 2) Build de produccion
- `npm run build`

### 3) Publicar carpeta `dist`
Dos formas tipicas:
- Rama `gh-pages`.
- GitHub Actions que publique `dist` automaticamente en cada push.

---

## Si quieres Android instalable bien (PWA), que habria que tocar

Impacto estimado: bajo/medio (no hay que cambiar de framework).

Cambios:
1. Anadir manifiesto PWA.
2. Anadir iconos PWA.
3. Anadir service worker (manual o con `vite-plugin-pwa`).
4. Registrar service worker en app.
5. Probar instalacion en Android Chrome.

No requiere rehacer la app.

---

## Riesgo importante antes de publicar

Actualmente la clave de IA puede terminar expuesta en frontend.

Para publicar seguro:
1. Mantener IA desactivada por defecto (ya lo esta).
2. Idealmente mover llamadas IA a backend/edge function.
3. O restringir clave por dominio/cuotas (si aplica), sabiendo que no es proteccion total.

---

## Recomendacion practica (orden)

1. Publicar ya en GitHub Pages para uso interno.
2. Decidir si quereis instalacion real PWA.
3. Si si: aplicar paquete minimo PWA (manifest + SW + iconos).
4. Luego, si interesa tienda Android, valorar TWA/Capacitor.

---

## Estimacion de esfuerzo

- Publicar web en GitHub Pages: 30-60 min.
- PWA instalable basica: 2-4 h.
- Pulido PWA (offline, update UX, tests en Android): 4-8 h.

---

## Fuentes de referencia (verificadas)

- Vite - Deploying a static site (incluye GitHub Pages):
  https://vite.dev/guide/static-deploy.html
- GitHub Docs - What is GitHub Pages:
  https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- GitHub Docs - Configuring a publishing source for GitHub Pages:
  https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- web.dev - PWA installation:
  https://web.dev/learn/pwa/installation/
- web.dev - Web app manifest:
  https://web.dev/learn/pwa/web-app-manifest/
- web.dev - Install criteria:
  https://web.dev/articles/install-criteria
- web.dev - Service workers (PWA):
  https://web.dev/learn/pwa/service-workers
