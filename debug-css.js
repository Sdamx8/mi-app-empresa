#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const cssFile = path.join(__dirname, 'src/modules/historial-trabajos/components/AdministrarRemisiones.css');

try {
  const content = fs.readFileSync(cssFile, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Buscar caracteres problemáticos
    const lineNumber = index + 1;
    
    // Buscar patrones problemáticos específicos
    if (line.includes('/') && !line.includes('/*') && !line.includes('*/') && !line.includes('//') && !line.includes('http')) {
      console.log(`Línea ${lineNumber}: ${line.trim()}`);
    }
    
    // Buscar caracteres no-ASCII
    if (/[^\x00-\x7F]/.test(line) && !line.includes('/*') && !line.includes('*/')) {
      console.log(`Línea ${lineNumber} (no-ASCII): ${line.trim()}`);
    }
  });
  
} catch (error) {
  console.error('Error:', error.message);
}
