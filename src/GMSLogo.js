import React from 'react';

const GMSLogo = ({ width = 60, height = 60, className = '' }) => {
  return (
    <div className={`gms-logo ${className}`} style={{ display: 'inline-block' }}>
      <img
        src="/images/logo-gms.png"
        alt="Global Mobility Solutions"
        width={width}
        height={height}
        style={{
          display: 'block',
          objectFit: 'contain',
          maxWidth: '100%',
          height: 'auto'
        }}
        onError={(e) => {
          // Fallback en caso de que la imagen no cargue
          console.warn('No se pudo cargar el logo, usando fallback SVG');
          e.target.style.display = 'none';
          
          // Crear SVG como fallback
          const fallbackSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          fallbackSvg.setAttribute('width', width);
          fallbackSvg.setAttribute('height', height);
          fallbackSvg.setAttribute('viewBox', '0 0 100 100');
          fallbackSvg.innerHTML = `
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#1e3c72" />
                <stop offset="100%" stop-color="#2a5298" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#logoGradient)" stroke="#ffffff" stroke-width="2" />
            <text x="50" y="58" text-anchor="middle" fill="#ffffff" font-size="16" font-weight="bold" font-family="Arial, sans-serif">GMS</text>
          `;
          e.target.parentNode.appendChild(fallbackSvg);
        }}
      />
    </div>
  );
};

export default GMSLogo;
