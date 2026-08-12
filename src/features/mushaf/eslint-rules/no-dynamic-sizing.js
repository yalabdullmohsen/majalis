/**
 * src/features/mushaf/eslint-rules/no-dynamic-sizing.js
 * 
 * بوابة ESLint مخصصة: منع الأحجام الديناميكية في مجلد mushaf
 * 
 * القواعد الممنوعة:
 * ✗ clamp(..., '...vw', ...)
 * ✗ clamp(..., '...vh', ...)
 * ✗ 'vw', 'vh', 'dvw', 'dvh' في قيم CSS
 * ✗ @media queries في CSS-in-JS
 * ✗ useEffect(() => { window.innerWidth ... })
 */

const FORBIDDEN_PATTERNS = {
  vw: /\b\d+\.?\d*\s*vw\b/i,
  vh: /\b\d+\.?\d*\s*vh\b/i,
  dvw: /\b\d+\.?\d*\s*dvw\b/i,
  dvh: /\b\d+\.?\d*\s*dvh\b/i,
  clamp: /\bclamp\s*\(/,
  mediaQuery: /@media\s*\(/,
};

/**
 * Rule: no-vw-vh-units
 * منع استخدام vw, vh في وحدات CSS
 */
module.exports = {
  'no-vw-vh-units': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow vw/vh units in mushaf feature — use logical units (1000×1618)',
        category: 'Best Practices',
        recommended: true,
      },
      fixable: 'code',
      messages: {
        vwNotAllowed: 'vw unit forbidden in mushaf — use logical units instead',
        vhNotAllowed: 'vh unit forbidden in mushaf — use logical units instead',
        dvwNotAllowed: 'dvw unit forbidden in mushaf — use logical units instead',
        dvhNotAllowed: 'dvh unit forbidden in mushaf — use logical units instead',
      },
    },
    create(context) {
      return {
        Literal(node) {
          if (typeof node.value !== 'string') return;
          
          const value = node.value;
          const match = value.match(/(\d+\.?\d*)\s*(vw|vh|dvw|dvh)/i);
          
          if (match) {
            const unit = match[2].toLowerCase();
            context.report({
              node,
              messageId: `${unit}NotAllowed`,
            });
          }
        },
        TemplateElement(node) {
          const value = node.value.raw;
          const match = value.match(/(\d+\.?\d*)\s*(vw|vh|dvw|dvh)/i);
          
          if (match) {
            const unit = match[2].toLowerCase();
            context.report({
              node,
              message: `${unit} unit forbidden in mushaf — use logical units instead`,
            });
          }
        },
      };
    },
  },

  'no-clamp-with-viewport': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow clamp() with vw/vh in mushaf',
        category: 'Best Practices',
      },
      messages: {
        clampNotAllowed: 'clamp() with viewport units forbidden in mushaf',
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          if (node.callee.name !== 'clamp') return;
          
          const sourceCode = context.getSourceCode();
          const clampText = sourceCode.getText(node);
          
          if (/\b(vw|vh|dvw|dvh)\b/i.test(clampText)) {
            context.report({
              node,
              messageId: 'clampNotAllowed',
            });
          }
        },
      };
    },
  },

  'no-media-queries': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow @media queries in mushaf — use transform:scale(k) instead',
        category: 'Best Practices',
      },
      messages: {
        mediaQueryNotAllowed: '@media queries forbidden in mushaf — single scale(k) transform',
      },
    },
    create(context) {
      return {
        Literal(node) {
          if (typeof node.value !== 'string' && !node.value?.raw) return;
          
          const value = node.value || node.raw;
          if (/@media\s*\(/.test(value)) {
            context.report({
              node,
              messageId: 'mediaQueryNotAllowed',
            });
          }
        },
      };
    },
  },

  'no-dynamic-font-size': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow dynamic font-size calculations in mushaf — use MUSHAF_SPEC.BASE_FONT_SIZE',
        category: 'Best Practices',
      },
      messages: {
        dynamicFontSizeNotAllowed: 'Dynamic font-size in useEffect/useMemo forbidden — use constant from MUSHAF_SPEC',
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          // منع: useEffect(() => { const size = window.innerWidth * 0.05; setFontSize(size); })
          if (node.callee.name === 'useEffect' || node.callee.name === 'useMemo') {
            const callbackArg = node.arguments[0];
            if (callbackArg && callbackArg.type === 'ArrowFunctionExpression') {
              const sourceCode = context.getSourceCode();
              const bodyText = sourceCode.getText(callbackArg.body);
              
              if (/window\.(innerWidth|innerHeight|devicePixelRatio)|setFontSize|fontSize/.test(bodyText)) {
                context.report({
                  node,
                  messageId: 'dynamicFontSizeNotAllowed',
                });
              }
            }
          }
        },
      };
    },
  },
};
