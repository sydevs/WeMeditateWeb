import globals from 'globals'
import react from 'eslint-plugin-react'
import prettierConfig from 'eslint-config-prettier'
import prettier from 'eslint-plugin-prettier'
import tseslint from 'typescript-eslint'

// `name`, `value` and `id` also take strings, but those are identifiers rather
// than copy, so they stay out. `alt` is handled on its own, below.
const COPY_PROPS = '/^(aria-label|label|placeholder|subtitle|title)$/'

/** Prose, not punctuation: two consecutive ASCII letters. */
const PROSE = '/[A-Za-z]{2}/'

const NOT_CODE_ELEMENT = 'JSXElement:not([openingElement.name.name=/^(script|style)$/])'

/** Every spelling of a literal string: `'x'`, and `` `x` `` with no substitution. */
const copyIn = (parent) =>
  `${parent} > Literal[value=${PROSE}], ${parent} > TemplateLiteral > TemplateElement[value.raw=${PROSE}]`

/** The same, written directly on a prop, in a brace, or in either arm of a ternary. */
const copyOn = (prop) => {
  const attribute = `JSXAttribute[name.name=${prop}]`

  return [
    copyIn(attribute),
    copyIn(`${attribute} > JSXExpressionContainer`),
    copyIn(`${attribute} > JSXExpressionContainer > ConditionalExpression`),
  ].join(', ')
}

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
    // `useT()` (AGENTS.md). The guards under `tests/guards/` match source text,
    // so neither sees a JSX text node or a quoted prop at all; these selectors
    // do (#165).
    //
    // The combinator is `>` and never a descendant: the key inside
    // `title={t('a.b')}` is a Literal too, just not the attribute's own child.
    // A value these selectors cannot read — an identifier, or a call's return —
    // passes, so this bounds the spellings rather than proving intent.
    files: ['components/**/*.tsx', 'layouts/**/*.tsx', 'pages/**/*.tsx'],
    ignores: ['**/*.stories.tsx', '**/*.test.tsx', 'components/ladle/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: [
            `JSXText[value=${PROSE}]`,
            // A `<style>` or `<script>` child is code, not copy.
            copyIn(`${NOT_CODE_ELEMENT} > JSXExpressionContainer`),
          ].join(', '),
          message:
            "Visible text must come from SahajCloud: render t('group.key') instead of an English literal.",
        },
        {
          selector: copyOn(COPY_PROPS),
          message:
            "This prop carries copy a visitor reads: pass t('group.key') instead of an English literal.",
        },
        {
          // `alt` has a second right answer the other props do not: an image
          // that carries no meaning takes `alt=""`, as `role="presentation"`
          // and the decorative svgs do.
          selector: copyOn("'alt'"),
          message:
            'An English alt text ships untranslated: pass t(\'group.key\'), or alt="" when the image is decorative.',
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
