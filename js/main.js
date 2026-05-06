// Punto de entrada del cliente. Orquesta la carga inicial del listado y
// delegará en los siguientes commits las acciones de crear, editar, votar
// y eliminar.

(function () {
  "use strict";

  const ui = window.ui;
  const api = window.api;

  document.addEventListener("DOMContentLoaded", () => {
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
})();
