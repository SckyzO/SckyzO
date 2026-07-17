'use strict';

const { defineConfig } = require('eslint/config');
const js = require('@eslint/js');
const globals = require('globals');

module.exports = defineConfig([
  {
    ignores: ['assets/**', 'dist/**', 'node_modules/**']
  },
  js.configs.recommended,
  {
    // Build tooling, template generators and tests: Node.js CommonJS.
    files: ['build/**/*.js', 'src/**/*.js', 'test/**/*.js', 'eslint.config.js'],
    ignores: ['src/scripts/client.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  {
    // build.js passes callbacks to Playwright's page.evaluate/waitForFunction;
    // those run inside the headless browser, so DOM globals are legitimate there.
    files: ['build/build.js'],
    languageOptions: {
      globals: { ...globals.browser }
    }
  },
  {
    // Browser script inlined verbatim into the generated HTML. Its top-level
    // functions are exposed on `window` and invoked from inline onclick
    // handlers, so they legitimately appear "unused" to static analysis;
    // `lucide` is provided by the inlined Lucide bundle at runtime.
    files: ['src/scripts/client.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        ...globals.browser,
        lucide: 'readonly',
        // Functions defined as `window.x = ...` and also called bare within
        // this file; declared here so no-undef still catches real typos.
        clearDebugState: 'writable',
        closeWelcome: 'writable',
        hideSettingsHint: 'writable',
        resetWelcomeTimer: 'writable',
        setWelcomeLang: 'writable',
        toggleTTY: 'writable'
      }
    },
    rules: {
      'no-unused-vars': 'off'
    }
  }
]);
