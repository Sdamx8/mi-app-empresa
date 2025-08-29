import React from 'react';
import GMSLogo from './GMSLogo';

const CorporateLogo = ({ size = 'medium', showText = true, className = '' }) => {
  const logoSizes = {
    small: 40,
    medium: 60,
    large: 80
  };

  const textSizes = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-2xl'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Opción 1: Con imagen del logo (descomenta si tienes el archivo) */}
      {/* 
      <div className="flex-shrink-0">
        <img 
          src="/images/logo-gms.png" 
          alt="Global Mobility Solutions Logo"
          width={logoSizes[size]}
          height={logoSizes[size]}
          className="object-contain"
        />
      </div>
      */}
      
      {/* Opción 2: Logo SVG personalizado (actual) */}
      <div className="flex-shrink-0">
        <GMSLogo 
          width={logoSizes[size]} 
          height={logoSizes[size]}
          className="drop-shadow-lg hover:drop-shadow-xl transition-all duration-300"
        />
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${textSizes[size]} font-bold leading-tight`} style={{
            background: 'linear-gradient(135deg, #1e3c72, #2a5298)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Global Mobility Solutions
          </h1>
          <p className="text-gray-600 text-xs font-medium tracking-wide">
            INNOVACIÓN • EFICIENCIA • EXCELENCIA
          </p>
        </div>
      )}
    </div>
  );
};

export default CorporateLogo;
