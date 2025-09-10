// Configuración PostCSS para Tailwind CSS v3
// PostCSS configuration — use the dedicated Tailwind PostCSS plugin when available
// This is the recommended explicit configuration for postcss-loader + Tailwind

try {
  // Prefer the new separate package
  module.exports = {
    plugins: [
      require('@tailwindcss/postcss'),
      require('autoprefixer')
    ]
  };
} catch (e) {
  // Fallback: try the older 'tailwindcss' package (v2/3)
  try {
    module.exports = {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer')
      ]
    };
  } catch (err) {
    // Last resort: export autoprefixer only to avoid hard failure
    module.exports = {
      plugins: {
        autoprefixer: {}
      }
    };
  }
}
