// Cliente HTTP centralizado: todas las llamadas al backend pasan por aquí.
// Mantenemos el resto del código libre de detalles de red.

(function (global) {
  "use strict";

  // Base de la API. Cuando el frontend se sirve por nginx en docker-compose
  // y el backend en un puerto distinto del mismo host, esta URL se resuelve
  // contra `localhost` del navegador. Si despliegas en otro dominio, ajusta
  // este valor (o léelo de un <meta>/window.config) sin tocar el resto del JS.
  const API_BASE =
    (global.__API_BASE__ && String(global.__API_BASE__)) ||
    "http://localhost:8787";

  // Lanza una excepción descriptiva cuando la respuesta no es 2xx, para que
  // los llamadores puedan envolverla con try/catch si lo desean.
  async function handle(response) {
    if (response.status === 204) return null;
    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const body = isJson ? await response.json() : await response.text();
    if (!response.ok) {
      const err = new Error(
        (isJson && (body.error || (body.errors && body.errors[0]?.error))) ||
          `HTTP ${response.status}`
      );
      err.status = response.status;
      err.body = body;
      throw err;
    }
    return body;
  }

  function buildQuery(params) {
    if (!params) return "";
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === "") continue;
      usp.set(k, v);
    }
    const s = usp.toString();
    return s ? `?${s}` : "";
  }

  const api = {
    base: API_BASE,

    async listSeries(params) {
      const res = await fetch(`${API_BASE}/series${buildQuery(params)}`);
      return handle(res);
    },

    async getSeries(id) {
      const res = await fetch(`${API_BASE}/series/${encodeURIComponent(id)}`);
      return handle(res);
    },

    async createSeries(payload) {
      const res = await fetch(`${API_BASE}/series`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return handle(res);
    },

    async updateSeries(id, payload) {
      const res = await fetch(`${API_BASE}/series/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return handle(res);
    },

    async deleteSeries(id) {
      const res = await fetch(`${API_BASE}/series/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return handle(res);
    },

    async uploadImage(id, file) {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(
        `${API_BASE}/series/${encodeURIComponent(id)}/image`,
        { method: "POST", body: fd }
      );
      return handle(res);
    },

    async submitRating(id, score) {
      const res = await fetch(
        `${API_BASE}/series/${encodeURIComponent(id)}/rating`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score }),
        }
      );
      return handle(res);
    },

    async getRating(id) {
      const res = await fetch(
        `${API_BASE}/series/${encodeURIComponent(id)}/rating`
      );
      return handle(res);
    },
  };

  global.api = api;
})(window);
