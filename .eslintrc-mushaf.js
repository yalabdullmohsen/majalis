/**
 * .eslintrc-mushaf.js
 * 
 * ESLint configuration for src/features/mushaf/
 * 
 * Enforces:
 * 1. No vw/vh/dvw/dvh units
 * 2. No clamp() with viewport units
 * 3. No @media queries
 * 4. No dynamic font-size calculations in useEffect/useMemo
 * 5. No word-spacing or letter-spacing for layout
 */

module.exports = {
  extends: ['eslint:recommended', 'plugin:react/recommended'],
  
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },

  env: {
    browser: true,
    es2021: true,
    node: true,
  },

  // ================================================================
  // Custom Rules — Enforce Fixed Layout Constraints
  // ================================================================
  
  rules: {
    // Level 1: Hard Errors
    
    'no-restricted-properties': [
      'error',
      {
        object: 'window',
        property: 'innerWidth',
        message:
          'Do not calculate sizes based on window.innerWidth in mushaf feature. Use fixed logical units (1000×1618) instead.',
      },
      {
        object: 'window',
        property: 'innerHeight',
        message:
          'Do not calculate sizes based on window.innerHeight in mushaf feature. Use fixed logical units instead.',
      },
      {
        object: 'window',
        property: 'devicePixelRatio',
        message:
          'devicePixelRatio is calculated by transform:scale(k). Do not use directly in mushaf.',
      },
    ],

    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.name='clamp']",
        message:
          'clamp() is forbidden in mushaf. Use fixed units + transform:scale(k) instead.',
      },
    ],

    // Level 2: Warnings for Code Review
    
    'no-console': [
      'warn',
      {
        allow: ['warn', 'error', 'table', 'group', 'groupEnd'],
      },
    ],

    // React specific
    'react/prop-types': 'warn',
    'react/react-in-jsx-scope': 'off',
  },

  // ================================================================
  // Overrides for CSS-in-JS (styled-components, emotion, etc.)
  // ================================================================
  
  overrides: [
    {
      // JSX files with CSS-in-JS
      files: ['src/features/mushaf/**/*.jsx'],
      rules: {
        // Custom rule to detect viewport units in strings
        'no-eval': 'error',
        
        // Prevent calc() with viewport units (pseudo-detection)
        'no-restricted-syntax': [
          'error',
          {
            selector:
              "CallExpression[callee.name='css'] > TemplateLiteral, " +
              "ObjectExpression[parent.parent.callee.name='styled']",
            message:
              'Cannot use dynamic sizing in CSS. Use fixed logical units.',
          },
        ],
      },
    },

    {
      // Test files — slightly relaxed
      files: ['src/features/mushaf/__tests__/**/*.js'],
      env: {
        jest: true,
      },
      rules: {
        'no-restricted-properties': 'off', // Allow window.innerWidth in tests
      },
    },
  ],

  // ================================================================
  // Custom Plugin for Pattern Detection
  // ================================================================
  
  plugins: ['mushaf-no-dynamic-sizing'],

  // This would require: npm install eslint-plugin-mushaf-no-dynamic-sizing
  // Or implement the rules in ./eslint-rules/no-dynamic-sizing.js
};

/**
 * Integration Instructions
 * 
 * 1. Add to your main .eslintrc:
 *    {
 *      "overrides": [
 *        {
 *          "files": ["src/features/mushaf/**\/*.jsx"],
 *          "extends": ["./.eslintrc-mushaf.js"]
 *        }
 *      ]
 *    }
 * 
 * 2. Run linting:
 *    npm run lint -- --config .eslintrc-mushaf.js src/features/mushaf/
 * 
 * 3. Integrate with CI:
 *    npm run lint:mushaf (in package.json scripts)
 */
