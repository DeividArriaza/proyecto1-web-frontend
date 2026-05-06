// Punto de entrada del cliente. Orquesta la carga inicial del listado y
// las acciones de la barra de herramientas (crear, editar, eliminar, votar).

(function () {
  "use strict";

  const ui = window.ui;
  const api = window.api;

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn-new").addEventListener("click", openCreateForm);
    refreshList();
  });

  // refreshList vuelve a pedir el listado al backend y reemplaza el contenido
  // del contenedor #app. Mantenerlo aislado permite reusarlo después de
  // crear/editar/eliminar.
  async function refreshList() {
    const root = document.getElementById("app");
    ui.clear(root);
    root.appendChild(ui.el("p", { class: "empty" }, ["Cargando juegos…"]));

    try {
      const res = await api.listGames({ sort: "title", order: "asc", limit: 100 });
      ui.clear(root);
      root.appendChild(ui.renderList(res.data, cardActions));
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
  };

  function openCreateForm() {
    showForm({
      initial: null,
      onSubmit: async (payload) => {
        await api.createGame(payload);
        closeForm();
        await refreshList();
      },
    });
  }

  function openEditForm(game) {
    showForm({
      initial: game,
      onSubmit: async (payload) => {
        await api.updateGame(game.id, payload);
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
