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
      root.appendChild(ui.renderList(res.data));
    } catch (e) {
      ui.clear(root);
      root.appendChild(
        ui.renderError(
          `No se pudo cargar el listado desde ${api.base}: ${e.message}`
        )
      );
    }
  }

  // openCreateForm muestra el form vacío para crear un juego nuevo.
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
