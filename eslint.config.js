import globals from 'globals'
import react from 'eslint-plugin-react'
import prettierConfig from 'eslint-config-prettier'
import prettier from 'eslint-plugin-prettier'
import tseslint from 'typescript-eslint'

/** The string-valued props that carry copy a visitor or a screen reader reads. */
const TRANSLATED_PROPS = '/^(alt|aria-label|label|placeholder|subtitle|title)$/'

const TRANSLATED_PROP_MESSAGE =
  "This prop carries copy a visitor reads: pass t('group.key') instead of an English literal."

export default [
  {
    ignores: [
      '.DS_Store',
      'logs/**',
      '*.log',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      'lerna-debug.log*',
      '.pnpm-debug.log*',
      'report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json',
      'pids/**',
      '*.pid',
      '*.seed',
      '*.pid.lock',
      'lib-cov/**',
      'coverage/**',
      '*.lcov',
      '.nyc_output/**',
      '.grunt/**',
      'bower_components/**',
      '.lock-wscript',
      'build/Release/**',
      'build/**',
      'node_modules/**',
      'jspm_packages/**',
      'web_modules/**',
      '*.tsbuildinfo',
      '.npm/**',
      '.eslintcache',
      '.stylelintcache',
      '.rpt2_cache/**',
      '.rts2_cache_cjs/**',
      '.rts2_cache_es/**',
      '.rts2_cache_umd/**',
      '.node_repl_history',
      '*.tgz',
      '.yarn-integrity',
      '.env',
      '.env.development.local',
      '.env.test.local',
      '.env.production.local',
      '.env.local',
      '.cache/**',
      '.parcel-cache/**',
      '.next/**',
      'out/**',
      '.nuxt/**',
      'dist/**',
      '.vuepress/dist/**',
      '.temp/**',
      '.docusaurus/**',
      '.serverless/**',
      '.fusebox/**',
      '.dynamodb/**',
      '.tern-port',
      '.vscode-test/**',
      '.yarn/cache/**',
      '.yarn/unplugged/**',
      '.yarn/build-state.yml',
      '.yarn/install-state.gz',
      '.pnp.*',
      '.wrangler/**',
      '.vercel/**',
      '.env.sentry-build-plugin',
      '.cdk.staging/**',
      'cdk.out/**',
    ],
  },
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  react.configs.flat.recommended,
  prettierConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.es2021,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier,
    },
    rules: {
      // `eslint .` exits 0 on warnings, which is how a `console.log` of the
      // Mapbox token survived in a shipped component (#105). `error` and `warn`
      // stay allowed: they report a real failure to whoever opens the console.
      'no-console': ['error', { allow: ['error', 'warn'] }],
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',
      'react/no-unescaped-entities': 'off',
      'react/react-in-jsx-scope': 'off',
      'prettier/prettier': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_.*?$',
        },
      ],
      'react/self-closing-comp': 'warn',
      'react/jsx-sort-props': [
        'warn',
        {
          callbacksLast: true,
          shorthandFirst: true,
          noSortAlphabetically: false,
          reservedFirst: true,
        },
      ],
      'padding-line-between-statements': [
        'warn',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        {
          blankLine: 'any',
          prev: ['const', 'let', 'var'],
          next: ['const', 'let', 'var'],
        },
      ],
    },
  },
  {
    // Visitor-facing copy is SahajCloud-owned and reaches the markup through
    // `useT()` (AGENTS.md). The two guards under `tests/guards/` match source
    // text, so neither can see a JSX text node or a string-valued prop; these
    // selectors read the AST instead, which is what `aria-label={SOME_CONST}`
    // slipping past the a11y guard asked for (#165).
    //
    // Two consecutive ASCII letters is the prose test: it passes a separator
    // (`·`, `—`), an entity, and a lone initial, and catches a word. A key
    // inside `t('a.b')` is not a Literal child of the attribute, so a resolved
    // call never trips this.
    //
    // Stories, tests and the Ladle scaffolding supply their own English
    // fixtures on purpose.
    files: ['components/**/*.tsx', 'layouts/**/*.tsx', 'pages/**/*.tsx'],
    ignores: ['**/*.stories.tsx', '**/*.test.tsx', 'components/ladle/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXText[value=/[A-Za-z]{2}/]',
          message:
            'Visible text must come from SahajCloud: render t(\'group.key\') instead of an English literal.',
        },
        {
          selector: `JSXAttribute[name.name=${TRANSLATED_PROPS}] > Literal[value=/[A-Za-z]{2}/]`,
          message: TRANSLATED_PROP_MESSAGE,
        },
        {
          selector: `JSXAttribute[name.name=${TRANSLATED_PROPS}] > JSXExpressionContainer > Literal[value=/[A-Za-z]{2}/]`,
          message: TRANSLATED_PROP_MESSAGE,
        },
        {
          selector: `JSXAttribute[name.name=${TRANSLATED_PROPS}] > JSXExpressionContainer > ConditionalExpression > Literal[value=/[A-Za-z]{2}/]`,
          message: TRANSLATED_PROP_MESSAGE,
        },
      ],
    },
  },
  {
    // Nothing below reaches a visitor's console, so a bare log stays a warning
    // here. `server/` logs `[PayloadCMS] GET … → …`, the request log AGENTS.md
    // tells you to read when debugging; a story logs a callback's payload to
    // show what the callback receives; a test is where someone debugging
    // reaches for a log first. Naming the exceptions rather than the covered
    // tree is deliberate — a new top-level directory is covered the day it
    // appears.
    files: [
      'server/**',
      'scripts/**',
      'tests/**',
      '**/*.stories.tsx',
      '**/*.test.ts',
      '**/*.test.tsx',
    ],
    rules: {
      'no-console': 'warn',
    },
  },
]
