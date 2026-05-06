// Punto de entrada del cliente. Orquesta la carga inicial del listado,
// las acciones de la barra de herramientas (crear) y las acciones por
// tarjeta (editar, eliminar, votar).

(function () {
  "use strict";

  const ui = window.ui;
  const api = window.api;

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn-new").addEventListener("click", openCreateForm);
    refreshList();
  });

  // refreshList vuelve a pedir el listado al backend, mezcla cada juego
  // con su rating y lo dibuja en el contenedor #app. La fusión vive aquí
  // porque la API mantiene los endpoints separados (CRUD limpio + rating
  // dedicado), pero el UI los consume juntos.
  async function refreshList() {
    const root = document.getElementById("app");
    ui.clear(root);
    root.appendChild(ui.el("p", { class: "empty" }, ["Cargando juegos…"]));

    try {
      const res = await api.listGames({ sort: "title", order: "asc", limit: 100 });
      const games = res.data;
      const ratings = await Promise.all(
        games.map((g) => api.getRating(g.id).catch(() => null))
      );
      games.forEach((g, i) => { g.rating = ratings[i]; });

      ui.clear(root);
      root.appendChild(ui.renderList(games, cardActions));
    } catch (e) {
      ui.clear(root);
      root.appendChild(
        ui.renderError(
          `No se pudo cargar el listado desde ${api.base}: ${e.message}`
        )
      );
    }
  }

  // cardActions agrupa los handlers que cada tarjeta dispara. Se pasa al
  // render del listado y se reusa para todas las tarjetas.
  const cardActions = {
    onEdit: openEditForm,
    onDelete: confirmAndDelete,
    // onVote devuelve el summary actualizado para que la tarjeta lo pinte
    // sin necesidad de refrescar todo el listado.
    onVote: async (game, score) => {
      return await api.submitRating(game.id, score);
    },
  };

  function openCreateForm() {
    showForm({
      initial: null,
      onSubmit: async (payload, imageFile) => {
        // En creación necesitamos el id del nuevo juego para asociarle la
        // imagen, así que la subimos en un segundo paso.
        const created = await api.createGame(payload);
        if (imageFile) await api.uploadImage(created.id, imageFile);
        closeForm();
        await refreshList();
      },
    });
  }

  function openEditForm(game) {
    showForm({
      initial: game,
      onSubmit: async (payload, imageFile) => {
        await api.updateGame(game.id, payload);
        if (imageFile) await api.uploadImage(game.id, imageFile);
        closeForm();
        await refreshList();
      },
    });
  }

  // confirmAndDelete pide confirmación nativa antes de borrar — pequeño y
  // suficiente para el alcance del lab; se puede sustituir por un modal
  // bonito en la fase de pulido.
  async function confirmAndDelete(game) {
    const ok = window.confirm(
      `¿Eliminar "${game.title}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    try {
      await api.deleteGame(game.id);
      await refreshList();
    } catch (e) {
      window.alert(`No se pudo eliminar: ${e.message}`);
    }
  }

  function showForm({ initial, onSubmit }) {
    const slot = document.getElementById("form-slot");
    ui.clear(slot);
    slot.appendChild(
      ui.renderForm({ initial, onSubmit, onCancel: closeForm })
    );
    slot.hidden = false;
    slot.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeForm() {
    const slot = document.getElementById("form-slot");
    ui.clear(slot);
    slot.hidden = true;
  }
})();
