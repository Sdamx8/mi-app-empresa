// performance-analyzer.js - Herramienta para analizar el rendimiento de la aplicación

const fs = require('fs');
const path = require('path');

class PerformanceAnalyzer {
  constructor() {
    this.srcPath = path.join(__dirname, 'src');
    this.issues = [];
    this.suggestions = [];
  }

  // Analizar todos los archivos JS/JSX
  analyzeProject() {
    console.log('🔍 Iniciando análisis de rendimiento...\n');
    
    this.analyzeDirectory(this.srcPath);
    this.generateReport();
  }

  analyzeDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.analyzeDirectory(filePath);
      } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
        this.analyzeFile(filePath);
      }
    });
  }

  analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    
    // Análisis 1: Archivos muy grandes
    if (content.length > 50000) {
      this.issues.push({
        type: 'large-file',
        file: fileName,
        size: content.length,
        severity: 'warning'
      });
    }

    // Análisis 2: Muchos console.log
    const consoleCount = (content.match(/console\.(log|warn|error)/g) || []).length;
    if (consoleCount > 5) {
      this.issues.push({
        type: 'too-many-console',
        file: fileName,
        count: consoleCount,
        severity: 'info'
      });
    }

    // Análisis 3: Componentes sin React.memo
    if (content.includes('function ') && content.includes('return (') && !content.includes('memo(')) {
      const componentMatches = content.match(/function\s+([A-Z][a-zA-Z]*)/g);
      if (componentMatches && componentMatches.length > 0) {
        this.suggestions.push({
          type: 'missing-memo',
          file: fileName,
          components: componentMatches.length,
          severity: 'suggestion'
        });
      }
    }

    // Análisis 4: useEffect sin dependencias
    const useEffectMatches = content.match(/useEffect\s*\(\s*\(\s*\)\s*=>\s*{[\s\S]*?},\s*\[\s*\]\s*\)/g);
    if (useEffectMatches && useEffectMatches.length > 3) {
      this.issues.push({
        type: 'many-empty-deps',
        file: fileName,
        count: useEffectMatches.length,
        severity: 'warning'
      });
    }

    // Análisis 5: Imports no utilizados (básico)
    const imports = content.match(/import\s+.*\s+from\s+['"`].*['"`]/g) || [];
    const unusedImports = imports.filter(imp => {
      const importName = imp.match(/import\s+(?:{[^}]*}|\w+)/)?.[0];
      if (importName && !importName.includes('{')) {
        const name = importName.replace('import ', '').trim();
        return !content.includes(name + '(') && !content.includes('<' + name);
      }
      return false;
    });

    if (unusedImports.length > 0) {
      this.suggestions.push({
        type: 'unused-imports',
        file: fileName,
        count: unusedImports.length,
        severity: 'info'
      });
    }
  }

  generateReport() {
    console.log('📊 REPORTE DE RENDIMIENTO\n');
    console.log('=' .repeat(50));
    
    // Problemas críticos
    const criticalIssues = this.issues.filter(i => i.severity === 'error');
    if (criticalIssues.length > 0) {
      console.log('\n🚨 PROBLEMAS CRÍTICOS:');
      criticalIssues.forEach(issue => this.printIssue(issue));
    }

    // Advertencias
    const warnings = this.issues.filter(i => i.severity === 'warning');
    if (warnings.length > 0) {
      console.log('\n⚠️  ADVERTENCIAS:');
      warnings.forEach(issue => this.printIssue(issue));
    }

    // Información
    const info = [...this.issues, ...this.suggestions].filter(i => i.severity === 'info');
    if (info.length > 0) {
      console.log('\n💡 INFORMACIÓN:');
      info.forEach(issue => this.printIssue(issue));
    }

    // Sugerencias
    const suggestions = this.suggestions.filter(s => s.severity === 'suggestion');
    if (suggestions.length > 0) {
      console.log('\n✨ SUGERENCIAS DE OPTIMIZACIÓN:');
      suggestions.forEach(suggestion => this.printIssue(suggestion));
    }

    console.log('\n' + '=' .repeat(50));
    console.log(`📈 RESUMEN: ${this.issues.length} problemas, ${this.suggestions.length} sugerencias`);
    
    this.generateOptimizationTips();
  }

  printIssue(issue) {
    const emoji = {
      'large-file': '📄',
      'too-many-console': '🗣️',
      'missing-memo': '⚡',
      'many-empty-deps': '🔄',
      'unused-imports': '📦'
    };

    console.log(`${emoji[issue.type] || '•'} ${issue.file}:`);
    
    switch (issue.type) {
      case 'large-file':
        console.log(`   Archivo muy grande: ${Math.round(issue.size / 1000)}KB`);
        break;
      case 'too-many-console':
        console.log(`   Muchos console.log: ${issue.count} encontrados`);
        break;
      case 'missing-memo':
        console.log(`   Considerar React.memo para ${issue.components} componentes`);
        break;
      case 'many-empty-deps':
        console.log(`   ${issue.count} useEffect con dependencias vacías`);
        break;
      case 'unused-imports':
        console.log(`   ${issue.count} imports posiblemente no utilizados`);
        break;
    }
    console.log('');
  }

  generateOptimizationTips() {
    console.log('\n🎯 CONSEJOS DE OPTIMIZACIÓN:');
    console.log('1. 🧹 Eliminar console.log en producción');
    console.log('2. ⚡ Usar React.memo para componentes que no cambian frecuentemente');
    console.log('3. 🎣 Optimizar useCallback y useMemo para funciones costosas');
    console.log('4. 📦 Eliminar imports no utilizados');
    console.log('5. 🔄 Considerar lazy loading para componentes grandes');
    console.log('6. 🗜️  Verificar el tamaño del bundle con npm run build');
  }
}

// Ejecutar análisis
const analyzer = new PerformanceAnalyzer();
analyzer.analyzeProject();
