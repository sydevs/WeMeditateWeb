import globals from 'globals'
import react from 'eslint-plugin-react'
import prettierConfig from 'eslint-config-prettier'
import prettier from 'eslint-plugin-prettier'
import tseslint from 'typescript-eslint'

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
      'no-console': 'warn',
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
  // `no-console` is a warning everywhere, and `eslint .` exits 0 on warnings —
  // which is how a `console.log` of the Mapbox token survived in a shipped
  // component (#105). Raise it to an error for the tree a visitor's console
  // sees, so a stray debug log fails the gate instead of joining the backlog.
  // `server/` stays a warning on purpose: its `[PayloadCMS] GET … → …` lines
  // are the request log AGENTS.md tells you to read when debugging.
  {
    files: ['components/**', 'hooks/**', 'layouts/**', 'lib/**', 'pages/**'],
    rules: {
      // `error` and `warn` report a real failure to whoever opens the console.
      'no-console': ['error', { allow: ['error', 'warn'] }],
    },
  },
  {
    // Neither a story nor a test reaches a visitor. A story logs a callback's
    // payload to show what the callback receives, and a test is where someone
    // debugging reaches for a log first.
    files: ['**/*.stories.tsx', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-console': 'warn',
    },
  },
]
