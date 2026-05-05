// Punto de entrada del cliente. Por ahora solo hacemos un ping inicial al
// backend para confirmar conectividad; los siguientes commits irán
// añadiendo el listado, el formulario, la subida de imágenes, etc.

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async () => {
    const root = document.getElementById("app");
    try {
      // En la fase 1 todavía no existe /series; usamos /healthz como ping.
      const res = await fetch(`${window.api.base}/healthz`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      window.ui.clear(root);
      root.appendChild(
        window.ui.el("p", { class: "empty" }, [
          `Backend conectado (${body.status}). Listado de series próximamente…`,
        ])
      );
    } catch (e) {
      window.ui.clear(root);
      root.appendChild(
        window.ui.el("p", { class: "empty" }, [
          `No se pudo conectar al backend en ${window.api.base}: ${e.message}`,
        ])
      );
    }
  });
})();
