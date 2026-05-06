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

  // Render de una sola tarjeta de juego. `actions` es opcional y, si llega,
  // recibe { onEdit, onDelete, onVote } para colgar listeners en los controles.
  function renderCard(game, actions) {
    const ratingNode = renderRating(game, actions?.onVote);

    const buttons = actions
      ? el("div", { class: "card-actions" }, [
          el(
            "button",
            { type: "button", class: "btn-small", onclick: () => actions.onEdit(game) },
            ["Editar"]
          ),
          el(
            "button",
            {
              type: "button",
              class: "btn-small danger",
              onclick: () => actions.onDelete(game),
            },
            ["Eliminar"]
          ),
        ])
      : null;

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
        ratingNode,
        buttons,
      ]),
    ]);
  }

  // renderRating dibuja el resumen del rating del juego con un selector
  // 1..10 para votar. El nodo entero se actualiza in-place tras un voto
  // exitoso usando renderRatingScore para no parpadear toda la tarjeta.
  function renderRating(game, onVote) {
    const scoreSpan = renderRatingScore(game.rating);

    if (!onVote) return el("div", { class: "card-rating" }, [scoreSpan]);

    const select = el(
      "select",
      { "aria-label": "Tu nota del 1 al 10" },
      [el("option", { value: "" }, ["Votar…"])].concat(
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) =>
          el("option", { value: String(n) }, [String(n)])
        )
      )
    );
    select.addEventListener("change", async () => {
      const score = parseInt(select.value, 10);
      if (!Number.isFinite(score)) return;
      select.disabled = true;
      try {
        const updated = await onVote(game, score);
        // Actualizamos solo el span del promedio para feedback inmediato.
        const newScore = renderRatingScore(updated);
        scoreSpan.replaceWith(newScore);
        select.value = "";
      } catch (err) {
        window.alert(`No se pudo registrar el voto: ${formatApiError(err)}`);
      } finally {
        select.disabled = false;
      }
    });

    return el("div", { class: "card-rating" }, [
      scoreSpan,
      el("span", { class: "rating-vote" }, ["Tu voto:", select]),
    ]);
  }

  // renderRatingScore acepta un summary { average, count } o nada y produce
  // el span con la nota. Lo mantenemos puro para poder reusarlo al refrescar
  // el rating tras un voto.
  function renderRatingScore(summary) {
    if (!summary || summary.count === 0) {
      return el("span", { class: "rating-score empty" }, ["sin votos"]);
    }
    const avg = Number(summary.average).toFixed(1);
    return el("span", { class: "rating-score" }, [
      `${avg} `,
      el("span", { class: "rating-count" }, [`(${summary.count})`]),
    ]);
  }

  // Render del grid completo. `actions` se propaga a cada tarjeta.
  function renderList(games, actions) {
    if (!games || games.length === 0) {
      return el("p", { class: "empty" }, [
        "Todavía no hay juegos. Pronto podrás añadir el primero.",
      ]);
    }
    return el(
      "div",
      { class: "game-grid" },
      games.map((g) => renderCard(g, actions))
    );
  }

  function renderError(message) {
    return el("p", { class: "error" }, [message]);
  }

  // Status posibles aceptados por el backend. Centralizados aquí para que
  // el form los pueda mostrar como <option> sin duplicar la lista.
  const STATUS_OPTIONS = [
    { value: "playing", label: "playing — jugando ahora" },
    { value: "beaten", label: "beaten — terminado" },
    { value: "dropped", label: "dropped — abandonado" },
    { value: "backlog", label: "backlog — pendiente" },
  ];

  // renderForm crea un formulario de crear/editar. `initial` puede ser un
  // juego existente (modo edición) o null (modo creación). `onSubmit` recibe
  // el payload normalizado y debe devolver una promesa; `onCancel` cierra el
  // formulario sin enviar.
  function renderForm({ initial, onSubmit, onCancel }) {
    const editing = !!initial;
    const errorBox = el("p", { class: "form-error", hidden: "hidden" }, [""]);

    const titleInput = el("input", {
      type: "text", name: "title", required: "required", maxlength: "255",
      value: initial?.title ?? "",
    });
    const genreInput = el("input", {
      type: "text", name: "genre", maxlength: "100",
      value: initial?.genre ?? "",
    });
    const statusSelect = el("select", { name: "status", required: "required" },
      STATUS_OPTIONS.map((s) =>
        el("option", { value: s.value, selected: initial?.status === s.value }, [s.label])
      )
    );
    const hoursInput = el("input", {
      type: "number", name: "hours_played", min: "0", step: "1",
      value: initial?.hours_played ?? 0,
    });
    const totalInput = el("input", {
      type: "number", name: "total_hours", min: "0", step: "1",
      value: initial?.total_hours ?? "",
    });

    const submitBtn = el("button", { type: "submit", class: "btn btn-primary" }, [
      editing ? "Guardar cambios" : "Crear juego",
    ]);
    const cancelBtn = el(
      "button",
      { type: "button", class: "btn btn-ghost", onclick: () => onCancel() },
      ["Cancelar"]
    );

    const form = el("form", {
      class: "game-form",
      onsubmit: async (e) => {
        e.preventDefault();
        errorBox.hidden = true;
        submitBtn.disabled = true;

        const payload = {
          title: titleInput.value.trim(),
          genre: genreInput.value.trim() || null,
          status: statusSelect.value,
          hours_played: parseIntOrZero(hoursInput.value),
        };
        const total = totalInput.value.trim();
        if (total !== "") payload.total_hours = parseIntOrZero(total);

        try {
          await onSubmit(payload);
        } catch (err) {
          errorBox.hidden = false;
          errorBox.textContent = formatApiError(err);
          submitBtn.disabled = false;
        }
      },
    }, [
      el("h3", {}, [editing ? `Editar ${initial.title}` : "Nuevo juego"]),
      errorBox,
      el("label", {}, ["Título *", titleInput]),
      el("label", {}, ["Género", genreInput]),
      el("label", {}, ["Status *", statusSelect]),
      el("label", {}, ["Horas jugadas", hoursInput]),
      el("label", {}, ["Horas totales (estimado)", totalInput]),
      el("div", { class: "form-actions" }, [cancelBtn, submitBtn]),
    ]);

    return form;
  }

  function parseIntOrZero(s) {
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : 0;
  }

  // formatApiError extrae el mensaje útil del Error que lanza api.js. Cuando
  // el body trae `errors[]` listamos todos los problemas para que el usuario
  // los vea de un solo golpe.
  function formatApiError(err) {
    const body = err.body;
    if (body && Array.isArray(body.errors)) {
      return body.errors.map((e) => `${e.field}: ${e.error}`).join(" · ");
    }
    return err.message || "Error desconocido";
  }

  global.ui = {
    el,
    clear,
    renderCard,
    renderList,
    renderError,
    renderForm,
  };
})(window);
