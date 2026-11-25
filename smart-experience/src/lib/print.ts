/** Print only the element marked .printable (adds a body class for the duration of printing). */
export function printOnly() { document.body.classList.add('print-only'); window.print(); setTimeout(() => document.body.classList.remove('print-only'), 500) }
