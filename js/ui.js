// Helpers de DOM y plantillas de render. `el` y `clear` son utilidades
// genéricas; las funciones `render*` saben cómo dibujar piezas concretas
// del UI a partir del JSON que devuelve la API.

(function (global) {
  "use strict";

  // Crea un elemento con atributos y/o hijos en una sola llamada.
  // Ejemplo: el("div", { class: "card" }, [el("h2", {}, ["Hola"])])
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v === false || v === null || v === undefined) continue;
        if (k === "class") node.className = v;
        else if (k.startsWith("on") && typeof v === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), v);
        } else {
          node.setAttribute(k, v);
        }
      }
    }
    if (children) {
      for (const c of children) {
        if (c == null) continue;
        node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      }
    }
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  // Resuelve la URL absoluta de una imagen subida al backend. Si el juego
  // no tiene portada, cae al placeholder local.
  function coverFor(game) {
    if (!game.image_path) return "assets/placeholder.png";
    // Las rutas que devuelve el backend son del estilo `/uploads/1_cover.jpg`.
    return `${global.api.base}${game.image_path}`;
  }

  // Construye el bloque de progreso de horas — solo aparece si hay datos.
  function progressFor(game) {
    if (game.hours_played == null && game.total_hours == null) return null;
    const played = game.hours_played ?? 0;
    const total = game.total_hours ? ` / ${game.total_hours}` : "";
    return el("p", { class: "card-progress" }, [
      `🕹️ ${played}${total} h jugadas`,
    ]);
  }

  // Render de una sola tarjeta de juego.
  function renderCard(game) {
    return el("article", { class: "card", "data-id": game.id }, [
      el("img", {
        class: "card-cover",
        src: coverFor(game),
        alt: `Portada de ${game.title}`,
        onerror: (e) => { e.target.src = "assets/placeholder.png"; },
      }),
      el("div", { class: "card-body" }, [
        el("h2", { class: "card-title" }, [game.title]),
        el("p", { class: "card-meta" }, [
          game.genre ? `${game.genre} · ` : "",
          el("span", { class: `status-badge ${game.status}` }, [game.status]),
        ]),
        progressFor(game),
      ]),
    ]);
  }

  // Render del grid completo. Si no hay juegos muestra un estado vacío.
  function renderList(games) {
    if (!games || games.length === 0) {
      return el("p", { class: "empty" }, [
        "Todavía no hay juegos. Pronto podrás añadir el primero.",
      ]);
    }
    return el(
      "div",
      { class: "game-grid" },
      games.map(renderCard)
    );
  }

  function renderError(message) {
    return el("p", { class: "error" }, [message]);
  }

  global.ui = { el, clear, renderCard, renderList, renderError };
})(window);
