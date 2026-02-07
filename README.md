# El Impostor

App web de deduccion social hecha con React + Vite.

## Desarrollo local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Publicar en GitHub Pages

Este repo ya incluye workflow en `.github/workflows/deploy-pages.yml`.

Pasos:

1. Sube el proyecto a GitHub en una rama `main`.
2. En GitHub, ve a `Settings > Pages`.
3. En `Source`, selecciona `GitHub Actions`.
4. (Opcional) Crea el secreto `GEMINI_API_KEY` en `Settings > Secrets and variables > Actions` si vas a usar IA.
5. Haz push a `main` y espera a que termine el workflow `Deploy to GitHub Pages`.
6. Tu URL quedara en formato: `https://TU_USUARIO.github.io/TU_REPO/`.

Notas:
- El `base` de Vite se configura con la variable `BASE_PATH` usada por el workflow.
- Para dominio raiz (`https://usuario.github.io/`), usa `BASE_PATH=/`.
