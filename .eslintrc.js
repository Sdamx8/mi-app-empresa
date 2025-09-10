module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Reglas de rendimiento
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    
    // Reglas de código limpio
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': 'warn',
    
    // Reglas de React
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/no-unescaped-entities': 'warn',
    
    // Reglas de accesibilidad
    'jsx-a11y/alt-text': 'warn',
    'jsx-a11y/anchor-is-valid': 'warn',
    
    // Reglas de imports
    'import/no-unused-modules': 'warn',
    'import/order': ['warn', {
      'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always'
    }]
  },
  overrides: [
    {
      files: ['src/**/*.js', 'src/**/*.jsx'],
      rules: {
        // Reglas específicas para archivos de React
        'react/jsx-no-useless-fragment': 'warn',
        'react/jsx-boolean-value': 'warn'
      }
    }
  ]
};
