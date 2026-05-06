// Helpers de DOM. Aquí vivirán las funciones que pintan la lista de juegos,
// el formulario de creación/edición, etc. Por ahora solo exponemos un
// utilitario de creación de elementos para que los siguientes commits lo usen.

(function (global) {
  "use strict";

  // Crea un elemento con etiquetas de atributos y/o hijos en una sola llamada.
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

  global.ui = { el, clear };
})(window);
