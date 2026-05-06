// Exporta el listado de juegos a CSV sin librerías externas. Construimos
// el string a mano y lo descargamos vía Blob + URL.createObjectURL.

(function (global) {
  "use strict";

  const HEADERS = [
    "id",
    "title",
    "genre",
    "status",
    "hours_played",
    "total_hours",
    "image_path",
    "rating_average",
    "rating_count",
    "created_at",
    "updated_at",
  ];

  // gameToRow proyecta un juego a un array alineado con HEADERS. El rating
  // viene como propiedad inyectada por main.js antes de pasar la lista.
  function gameToRow(g) {
    return [
      g.id,
      g.title,
      g.genre ?? "",
      g.status,
      g.hours_played ?? 0,
      g.total_hours ?? "",
      g.image_path ?? "",
      g.rating ? g.rating.average : "",
      g.rating ? g.rating.count : "",
      g.created_at,
      g.updated_at,
    ];
  }

  // escapeField normaliza un valor a una celda CSV. Si contiene comas,
  // comillas o saltos de línea, se rodea con comillas y se duplican las
  // comillas internas (RFC 4180).
  function escapeField(value) {
    if (value === null || value === undefined) return "";
    const s = String(value);
    if (/[",\r\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  function buildCSV(games) {
    const rows = [HEADERS, ...games.map(gameToRow)];
    return rows.map((row) => row.map(escapeField).join(",")).join("\r\n");
  }

  // download dispara la descarga con el filename indicado. El BOM al inicio
  // ayuda a Excel a reconocer el archivo como UTF-8 cuando el usuario
  // contiene títulos con acentos o caracteres no-ASCII.
  function download(games, filenamePrefix) {
    const csv = "﻿" + buildCSV(games);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenamePrefix}-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    // Limpiamos en el siguiente tick para no cancelar la descarga.
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 0);
  }

  global.csv = { buildCSV, download };
})(window);
