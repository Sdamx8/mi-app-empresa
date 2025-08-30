// Configuración PostCSS compatible con distintas versiones de Tailwind
// Detecta si la integración nueva '@tailwindcss/postcss' está instalada (Tailwind v4+)
// y cae en 'tailwindcss' como fallback (Tailwind v2/3). Incluye autoprefixer si está disponible.

let tailwindPlugin;
try {
  tailwindPlugin = require('@tailwindcss/postcss');
} catch (e) {
  try {
    tailwindPlugin = require('tailwindcss');
  } catch (err) {
    tailwindPlugin = null;
  }
}

let autoprefixerPlugin;
try {
  autoprefixerPlugin = require('autoprefixer');
} catch (e) {
  autoprefixerPlugin = null;
}

const plugins = [];
if (tailwindPlugin) plugins.push(tailwindPlugin);
if (autoprefixerPlugin) plugins.push(autoprefixerPlugin);

module.exports = { plugins };
