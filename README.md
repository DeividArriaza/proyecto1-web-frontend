# Games Tracker — Frontend

Cliente web del proyecto Games Tracker. HTML + CSS + JavaScript vanilla. Sin frameworks, sin librerías, sin bundlers: solo `fetch()` nativo y manipulación directa del DOM.

La API que consume vive en el repo [`games-tracker-backend`](../games-tracker-backend), que también incluye el `docker-compose.yml` que levanta el stack completo (DB + API + frontend en Nginx).

> 🌐 **Demo público:** _pendiente de despliegue_ — se publicará en un VPS Contabo y el enlace se añadirá aquí.

---

## Estructura

```text
.
├── index.html
├── nginx.conf
├── Dockerfile
├── css/
│   └── styles.css
├── js/
│   ├── api.js     ← envoltorios fetch() centralizados
│   ├── ui.js      ← helpers de DOM (creación de nodos, limpiado)
│   └── main.js    ← entry point: arranca al DOMContentLoaded
└── assets/
    └── placeholder.png
```

Los tres archivos JS se cargan en el orden `api → ui → main` desde `index.html`. `api.js` y `ui.js` exponen sus funciones bajo `window.api` y `window.ui` respectivamente, así que `main.js` (y los próximos commits) las consume sin imports.

---

## Cómo correrlo

### Opción A — Junto con el resto del stack (recomendado)

Desde el repo del backend, con ambos repos clonados al mismo nivel:

```bash
cd ../games-tracker-backend
docker compose up --build
```

El frontend queda servido por Nginx en **http://localhost:4567**.

### Opción B — Solo el frontend, contra una API ya corriendo

Cualquier servidor estático sirve, por ejemplo:

```bash
python3 -m http.server 4567
```

…y luego abrí http://localhost:4567 en el navegador. Por defecto el cliente apunta a `http://localhost:8787` para la API; si tu backend corre en otra URL, definí `window.__API_BASE__` antes de cargar `js/api.js` (por ejemplo añadiendo un `<script>` con `window.__API_BASE__ = "https://api.midominio.com";`).

---

## Decisiones de diseño

- **Estética:** dark theme gamer-oriented con acentos neón (violeta + cian, badges de status diferenciados por color). Pensado para encajar con el público objetivo de la app — un jugador de videojuegos. La paleta completa vive en custom properties al inicio de `css/styles.css`, así que retematizar es cambiar variables.
- **Sin librerías:** todas las llamadas usan `fetch()` y `URLSearchParams`; el CSV se construye en memoria y se descarga vía `Blob` + `URL.createObjectURL`.
- **Sin server-side rendering:** el servidor nunca devuelve HTML. Toda la UI se compone en el cliente a partir de JSON.

---

## Repositorios relacionados

- Backend (Go + PostgreSQL + Docker Compose): [[games-tracker-backend](../games-tracker-backend)](https://github.com/DeividArriaza/proyecto1-web-backend) 
