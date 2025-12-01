# Development Standards

**Version:** 1.0
**Last Updated:** 2025-01-18
**Scope:** Web Projects (React, Vike, Cloudflare)

## Table of Contents

1. [Overview & Philosophy](#overview--philosophy)
2. [Recommended Technology Stack](#recommended-technology-stack)
3. [Universal Standards](#universal-standards)
   - [Code Formatting (Prettier)](#code-formatting-prettier)
   - [Editor Configuration (EditorConfig)](#editor-configuration-editorconfig)
   - [Version Control (.gitignore)](#version-control-gitignore)
   - [VSCode Settings](#vscode-settings)
   - [VSCode Extensions](#vscode-extensions)
   - [Environment Variables](#environment-variables)
4. [Web Project Standards](#web-project-standards)
   - [ESLint Configuration](#eslint-configuration)
   - [TypeScript Configuration](#typescript-configuration)
   - [TailwindCSS Standards](#tailwindcss-standards)
   - [Component Architecture](#component-architecture)
   - [Testing](#testing)
   - [Accessibility Standards](#accessibility-standards)
   - [Performance Standards](#performance-standards)
   - [Browser Support](#browser-support)
   - [Import Patterns](#import-patterns)
   - [Sentry Configuration](#sentry-configuration)
5. [Implementation Checklist](#implementation-checklist)
6. [Migration Guides](#migration-guides)
7. [Project Audit Checklist](#project-audit-checklist)

---

## Overview & Philosophy

### Purpose

This document establishes team-wide development standards for web projects. These standards ensure:

- **Consistency** across all projects and team members
- **Quality** through automated tooling and best practices
- **Maintainability** with clear patterns and conventions
- **Productivity** by reducing decision fatigue and setup time
- **Onboarding** ease for new team members

### When to Apply Standards

**✅ Apply these standards to:**
- All new web projects
- Existing projects during major refactors
- Projects that need standardization

**⚠️ Project-specific configurations:**
- Framework-specific settings (Vike vs Next.js)
- Deployment configurations (Wrangler for Cloudflare)
- Business logic and application code
- Design system tokens and brand colors

### How to Use This Document

**For New Projects:**
1. Copy all universal configurations from Section 3
2. Apply web project standards from Section 4
3. Use the implementation checklist (Section 5) to verify

**For Existing Projects:**
1. Run through the audit checklist (Section 7)
2. Identify missing or non-compliant configurations
3. Use migration guides (Section 6) to update
4. Test thoroughly after changes

**For Automated Audits:**
This document is designed to be parsed by a Claude slash command that will:
- Analyze project configurations
- Compare against these standards
- Provide specific recommendations
- Generate migration steps

---

## Recommended Technology Stack

These are the preferred solutions for new web projects. Not every project uses all of these, but they represent our standard choices.

### Core Stack

| Category | Recommended | Notes |
|----------|-------------|-------|
| **Frontend Framework** | React | Latest stable version |
| **Meta-Framework** | Vike | For SSR projects. Next.js is used for PayloadCMS but not recommended for new projects. |
| **Styling** | TailwindCSS | v4+ with CSS-first configuration |
| **Package Manager** | pnpm | Fast, efficient, workspace-friendly |

### Development & Testing

| Category | Recommended | Notes |
|----------|-------------|-------|
| **Component Development** | Ladle | Lightweight, Vite-powered story development |
| **E2E Testing** | Playwright | Web only, cross-browser testing |
| **Unit Testing** | Vitest | Fast, Vite-native test runner |

### Services & Deployment

| Category | Recommended | Notes |
|----------|-------------|-------|
| **Deployment** | Cloudflare Workers or Pages | Edge computing, global distribution |
| **Error Tracking** | Sentry | Web and server-side error monitoring |
| **Analytics** | Fathom Analytics | Privacy-focused, GDPR-compliant |

### About Next.js

**Note:** We use Next.js for PayloadCMS projects because Payload is built for Next.js. However, for new projects that don't require PayloadCMS, **use Vike** as the meta-framework. Vike provides more flexibility and integrates better with our Cloudflare Workers deployment model.

---

## Universal Standards

These standards apply to **all web projects** regardless of framework or deployment target.

### Code Formatting (Prettier)

#### Configuration: `.prettierrc`

Create a `.prettierrc` file in the project root:

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "printWidth": 100
}
```

#### Setting Explanations

- **`semi: false`** - No semicolons (cleaner, modern JavaScript style)
- **`singleQuote: true`** - Single quotes for strings (consistent with most JS codebases)
- **`trailingComma: "all"`** - Trailing commas everywhere (cleaner git diffs)
- **`tabWidth: 2`** - 2 spaces for indentation (standard for JavaScript/TypeScript)
- **`printWidth: 100`** - Max line length 100 characters (balances readability and screen usage)

#### Optional: `.prettierignore`

```
# Build outputs
dist
build
.next
.vite

# Dependencies
node_modules
.pnpm-store

# Generated files
*.min.js
*.min.css

# Lock files
pnpm-lock.yaml
```

#### Verification

✅ **How to verify it's working:**

```bash
# Check formatting
pnpm prettier --check .

# Fix formatting
pnpm prettier --write .
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

⚠️ **Common Issues:**

**Issue:** "Prettier conflicts with ESLint"
**Solution:** Use `eslint-config-prettier` to disable formatting rules in ESLint:

```bash
pnpm add -D eslint-config-prettier
```

Then add to ESLint config:

```javascript
// eslint.config.js
import prettier from 'eslint-config-prettier'

export default [
  // ... other configs
  prettier, // Must be last to override other configs
]
```

---

### Editor Configuration (EditorConfig)

#### Configuration: `.editorconfig`

Create a `.editorconfig` file in the project root:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.{js,jsx,ts,tsx,mjs,cjs}]
indent_style = space
indent_size = 2

[*.{json,yml,yaml}]
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

#### Why EditorConfig?

EditorConfig works across **40+ editors** including:
- VS Code
- IntelliJ IDEA / WebStorm
- Vim / Neovim
- Sublime Text
- Atom
- Emacs

This ensures consistency even for team members who don't use VS Code.

#### Setting Explanations

- **`charset = utf-8`** - Universal character encoding
- **`end_of_line = lf`** - Unix-style line endings (prevents Windows CRLF issues)
- **`insert_final_newline = true`** - Adds newline at end of file (POSIX standard)
- **`trim_trailing_whitespace = true`** - Removes trailing spaces (cleaner git diffs)
- **`indent_style = space`** - Use spaces, not tabs
- **`indent_size = 2`** - 2-space indentation for JavaScript/TypeScript
- **Markdown exception:** Don't trim trailing whitespace (some Markdown uses two spaces for line breaks)

#### Verification

✅ **How to verify it's working:**

1. Open a file in your editor
2. Check the status bar shows "LF" (not CRLF)
3. Check indentation is 2 spaces
4. Save a file and verify no trailing whitespace added

Most editors support EditorConfig out of the box. VS Code includes it by default.

---

### Version Control (.gitignore)

#### Configuration: `.gitignore`

Create a comprehensive `.gitignore` file in the project root:

```gitignore
# Dependencies
node_modules
.pnpm-store
.pnpm-debug.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Build outputs
dist
build
.vite
.next
out
.output
.vercel
.netlify

# Cloudflare
.wrangler
wrangler.toml.local

# Testing
coverage
.nyc_output
playwright-report
playwright/.auth/
test-results

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.sentry-build-plugin

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# TypeScript
*.tsbuildinfo
.tsbuildinfo

# Temporary files
*.tmp
*.temp
.cache
.parcel-cache

# IDE - VSCode
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
*.code-workspace

# IDE - IntelliJ
.idea
*.iml
*.ipr
*.iws
.project
.classpath
.settings

# IDE - Sublime Text
*.sublime-project
*.sublime-workspace

# IDE - Vim
[._]*.s[a-v][a-z]
[._]*.sw[a-p]
[._]s[a-rt-v][a-z]
[._]ss[a-gi-z]
[._]sw[a-p]
Session.vim
Sessionx.vim
.netrwhist
*~
tags
[._]*.un~

# OS - macOS
.DS_Store
.AppleDouble
.LSOverride
Icon
._*
.DocumentRevisions-V100
.fseventsd
.Spotlight-V100
.TemporaryItems
.Trashes
.VolumeIcon.icns
.com.apple.timemachine.donotpresent
.AppleDB
.AppleDesktop
Network Trash Folder
Temporary Items
.apdisk

# OS - Windows
Thumbs.db
Thumbs.db:encryptable
ehthumbs.db
ehthumbs_vista.db
*.stackdump
[Dd]esktop.ini
$RECYCLE.BIN/
*.lnk

# OS - Linux
*~
.fuse_hidden*
.directory
.Trash-*
.nfs*

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Misc
*.swp
*.swo
*.swn
.history
```

#### Section Explanations

**Dependencies:** Node modules and package manager caches
**Build outputs:** Compiled/bundled files from build tools
**Testing:** Test coverage, reports, and authentication files
**Environment variables:** Local environment files (never commit secrets!)
**IDE - VSCode:** VSCode files with exceptions for useful configs
**IDE - Others:** Support for IntelliJ, Sublime, Vim
**OS files:** macOS, Windows, Linux system files

#### Important Notes

⚠️ **Never commit:**
- `node_modules/` (always reinstall via `pnpm install`)
- `.env` files with secrets (use `.env.example` instead)
- `playwright/.auth/` (contains authentication state)
- Build outputs (rebuild on deployment)
- IDE-specific files (except standardized VSCode settings)

✅ **Always commit:**
- `.vscode/settings.json` (team settings)
- `.vscode/extensions.json` (recommended extensions)
- `pnpm-lock.yaml` (ensures consistent dependencies)
- `.env.example` (documents required variables)

#### Project-Specific Additions

Some projects may need additional patterns:

```gitignore
# PayloadCMS / Next.js projects
/media
/migration/cache

# Ladle build output
/build

# Storybook build output
/storybook-static
```

---

### VSCode Settings

#### Configuration: `.vscode/settings.json`

Create a `.vscode/settings.json` file:

```json
{
  "npm.packageManager": "pnpm",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.formatOnSaveMode": "file",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "files.eol": "\n",
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit"
    }
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit"
    }
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^\"'`]*)(?:'|\"|`)"]
  ]
}
```

#### Setting Explanations

**Package Manager:**
- `npm.packageManager: "pnpm"` - Use pnpm for all operations

**Formatting:**
- `editor.defaultFormatter` - Use Prettier for all files
- `editor.formatOnSave: true` - Auto-format when saving
- `editor.formatOnSaveMode: "file"` - Format entire file (not just changes)

**Linting:**
- `editor.codeActionsOnSave` - Auto-fix ESLint errors on save
- `source.fixAll.eslint: "explicit"` - Fix all auto-fixable issues

**File Handling:**
- `files.eol: "\n"` - Use LF (Unix) line endings
- `files.trimTrailingWhitespace: true` - Remove trailing spaces
- `files.insertFinalNewline: true` - Add newline at end of file

**TypeScript:**
- `typescript.tsdk` - Use project's TypeScript version (not VS Code's)
- `typescript.updateImportsOnFileMove` - Auto-update imports when moving files
- `typescript.preferences.importModuleSpecifier: "non-relative"` - Prefer `@/*` aliases

**TailwindCSS:**
- `tailwindCSS.experimental.classRegex` - IntelliSense for `cn()` utility function

#### Verification

✅ **How to verify it's working:**

1. Open a TypeScript file with linting errors
2. Save the file (Cmd/Ctrl+S)
3. Verify:
   - File is formatted (Prettier)
   - ESLint errors are auto-fixed
   - Line endings are LF
   - Final newline added

⚠️ **Common Issues:**

**Issue:** "Format on save not working"
**Solution:**
1. Check Prettier extension is installed
2. Check no conflicting formatter is set
3. Reload VS Code window

**Issue:** "ESLint not fixing on save"
**Solution:**
1. Check ESLint extension is installed
2. Check `eslint.config.js` exists and is valid
3. Check ESLint server is running (VS Code output panel)

---

### VSCode Extensions

#### Configuration: `.vscode/extensions.json`

Create a `.vscode/extensions.json` file:

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "lokalise.i18n-ally",
    "usernamehw.errorlens"
  ]
}
```

#### Extension Descriptions

| Extension | Purpose | Essential? |
|-----------|---------|------------|
| **Prettier** (`esbenp.prettier-vscode`) | Code formatting | ✅ Required |
| **ESLint** (`dbaeumer.vscode-eslint`) | Linting and auto-fix | ✅ Required |
| **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) | Autocomplete, syntax highlighting for Tailwind | ✅ Required |
| **Playwright Test for VSCode** (`ms-playwright.playwright`) | Run and debug Playwright tests | Recommended |
| **i18n Ally** (`lokalise.i18n-ally`) | Locale-aware development tools | Recommended for i18n projects |
| **Error Lens** (`usernamehw.errorlens`) | Inline error highlighting | Nice to have |

#### What Happens

When a team member opens the project in VS Code:
1. VS Code detects `.vscode/extensions.json`
2. Shows a notification: "This workspace has extension recommendations"
3. User can install all recommended extensions with one click
4. Ensures everyone has the same tooling

#### Adding Project-Specific Extensions

Some projects may need additional extensions:

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "lokalise.i18n-ally",
    "usernamehw.errorlens",

    // Project-specific additions
    "GraphQL.vscode-graphql",           // For GraphQL projects
    "GraphQL.vscode-graphql-syntax"     // GraphQL syntax highlighting
  ]
}
```

---

### Environment Variables

#### Configuration: `.env.example`

**Always create a `.env.example` file** to document required environment variables:

```bash
# API Configuration
PUBLIC__SAHAJCLOUD_URL=https://cms.example.com
PAYLOAD_API_KEY=your_api_key_here

# Sentry Error Tracking
PUBLIC__SENTRY_DSN=https://your_sentry_dsn
SENTRY_DSN=https://your_sentry_dsn_server
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
SENTRY_AUTH_TOKEN=your_auth_token

# Analytics
PUBLIC__FATHOM_SITE_ID=your_fathom_site_id

# External Services
PUBLIC__MAPBOX_ACCESS_TOKEN=your_mapbox_token

# Cloudflare (for wrangler.toml)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

#### Naming Conventions

**Browser-Exposed Variables:**
- Prefix: `PUBLIC__` (double underscore)
- Example: `PUBLIC__SENTRY_DSN`, `PUBLIC__API_URL`
- These are embedded in the client bundle

**Server-Only Variables:**
- No prefix
- Example: `SENTRY_DSN`, `API_KEY`, `DATABASE_URL`
- Never exposed to the browser

**Why `PUBLIC__`?**

Vike uses `PUBLIC__` as the prefix for environment variables that should be exposed to the browser. This is configured in `vite.config.ts`:

```typescript
export default defineConfig({
  envPrefix: 'PUBLIC__',
})
```

#### .env File Structure

**Never commit `.env` files!** (they're in `.gitignore`)

Create local `.env` file:

```bash
# Copy example and fill in real values
cp .env.example .env

# Edit .env with real values
# Never commit this file!
```

#### Documentation in README

Always document environment variables in `README.md`:

```markdown
## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

### Required Variables

- `PUBLIC__SAHAJCLOUD_URL` - PayloadCMS GraphQL API URL
- `PAYLOAD_API_KEY` - PayloadCMS API authentication key
- `PUBLIC__SENTRY_DSN` - Sentry DSN for browser error tracking

### Optional Variables

- `PUBLIC__FATHOM_SITE_ID` - Fathom Analytics site ID (production only)
- `PUBLIC__MAPBOX_ACCESS_TOKEN` - Mapbox API token (if using maps)
```

#### Verification

✅ **How to verify it's working:**

```bash
# Check if env vars are loaded
pnpm dev

# In browser console (for PUBLIC__ vars):
console.log(import.meta.env.PUBLIC__SENTRY_DSN)

# In server code:
console.log(process.env.PAYLOAD_API_KEY)
```

⚠️ **Common Issues:**

**Issue:** "Environment variable is undefined in browser"
**Solution:** Make sure it has `PUBLIC__` prefix and restart dev server

**Issue:** "Environment variable is undefined in server"
**Solution:** Check `.env` file exists and variable is spelled correctly

**Issue:** "Changes to .env not reflecting"
**Solution:** Restart the dev server (Vite doesn't hot-reload .env changes)

---

## Web Project Standards

These standards apply specifically to **web projects** using React, Vike, TypeScript, and related technologies.

### ESLint Configuration

#### Preferred: Flat Config (ESLint 9+)

**New projects should use the flat config format.** Legacy projects can continue using `.eslintrc.json` until a convenient migration time.

#### Configuration: `eslint.config.js`

Create an `eslint.config.js` file in the project root:

```javascript
import js from '@eslint/js'
import globals from 'globals'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import unusedImports from 'eslint-plugin-unused-imports'
import importPlugin from 'eslint-plugin-import'
import prettier from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      'unused-imports': unusedImports,
      'import': importPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports' },
      ],

      // React
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/prop-types': 'off', // Using TypeScript instead
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // JSX Accessibility
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',

      // Imports
      'unused-imports/no-unused-imports': 'warn',
      'import/order': [
        'warn',
        {
          'groups': [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          'alphabetize': {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],

      // General
      'no-console': 'warn',
      'no-debugger': 'warn',
    },
  },
  prettier, // Must be last to disable conflicting rules
]
```

#### Framework-Specific Variations

**For PayloadCMS / Next.js Projects:**

Add Next.js plugin and rules:

```javascript
import nextPlugin from '@next/eslint-plugin-next'

export default [
  // ... base config
  {
    plugins: {
      '@next': nextPlugin,
    },
    rules: {
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'warn',
      // ... other Next.js rules
    },
  },
]
```

#### Required Dependencies

Install these packages:

```bash
pnpm add -D eslint @eslint/js globals \
  @typescript-eslint/eslint-plugin @typescript-eslint/parser \
  eslint-plugin-react eslint-plugin-react-hooks \
  eslint-plugin-jsx-a11y \
  eslint-plugin-unused-imports \
  eslint-plugin-import \
  eslint-config-prettier
```

#### Rule Explanations

**TypeScript Rules:**
- `no-unused-vars` - Warn on unused variables (allows `_` prefix for intentionally unused)
- `no-explicit-any` - Warn on `any` type usage (prefer proper types)
- `consistent-type-imports` - Use `import type` for type-only imports

**React Rules:**
- `react-in-jsx-scope` - Off (React 17+ doesn't need `import React`)
- `prop-types` - Off (using TypeScript instead)
- `rules-of-hooks` - Error on hooks rule violations
- `exhaustive-deps` - Warn on missing useEffect dependencies

**Accessibility Rules:**
- `alt-text` - Warn on images without alt text
- `anchor-is-valid` - Warn on invalid anchor usage
- `click-events-have-key-events` - Warn on click without keyboard support

**Import Rules:**
- `no-unused-imports` - Auto-remove unused imports
- `import/order` - Enforce import ordering (see [Import Patterns](#import-patterns))

**General Rules:**
- `no-console` - Warn on `console.log` (should use proper logging)
- `no-debugger` - Warn on `debugger` statements

#### Verification

✅ **How to verify it's working:**

Add scripts to `package.json`:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

Run:

```bash
# Check for errors
pnpm lint

# Auto-fix errors
pnpm lint:fix
```

⚠️ **Common Issues:**

**Issue:** "ESLint is not recognizing TypeScript files"
**Solution:** Check `files` glob includes `.ts` and `.tsx`: `files: ['**/*.{js,jsx,ts,tsx}']`

**Issue:** "Import order not being enforced"
**Solution:** Make sure `eslint-plugin-import` is installed and in plugins

**Issue:** "Prettier and ESLint conflicts"
**Solution:** Make sure `eslint-config-prettier` is last in config array

---

### TypeScript Configuration

TypeScript configuration varies slightly by framework. Use the appropriate template for your project.

#### Standard for Vite/Vike Projects

#### Configuration: `tsconfig.json`

```json
{
  "compilerOptions": {
    // Type Checking
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,

    // Module System
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,

    // Emit
    "noEmit": true,
    "skipLibCheck": true,

    // Interop
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,

    // JSX
    "jsx": "react-jsx",
    "jsxImportSource": "react",

    // Types
    "types": ["vite/client", "vike/types"],

    // Path Mapping
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "**/*.jsx",
    "vite.config.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "build"
  ]
}
```

#### Alternative: PayloadCMS / Next.js Projects

```json
{
  "compilerOptions": {
    // Type Checking
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    // Module System
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,

    // Emit
    "noEmit": true,
    "skipLibCheck": true,
    "incremental": true,

    // Interop
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,

    // JSX
    "jsx": "preserve",
    "jsxImportSource": "react",

    // Next.js
    "plugins": [{ "name": "next" }],

    // Path Mapping
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

#### Compiler Option Explanations

**Type Checking:**
- `strict: true` - Enable all strict type checking options
- `noUnusedLocals` - Error on unused local variables
- `noUnusedParameters` - Error on unused function parameters
- `noFallthroughCasesInSwitch` - Error on fallthrough case statements
- `noUncheckedIndexedAccess` - Make array/object access stricter

**Module System:**
- `target: "ES2022"` - Output modern JavaScript
- `module: "ES2022"` - Use ES modules
- `moduleResolution: "Bundler"` - Optimized for Vite/bundlers
- `resolveJsonModule` - Allow importing JSON files

**Emit:**
- `noEmit: true` - Don't output files (Vite/Next.js handles building)
- `skipLibCheck: true` - Skip type checking of declaration files (faster)

**JSX:**
- `jsx: "react-jsx"` (Vike) - Modern JSX transform, no `import React`
- `jsx: "preserve"` (Next.js) - Let Next.js handle JSX transform

**Path Mapping:**
- `@/*` - Alias for root imports (e.g., `import { Button } from '@/components/atoms'`)

#### Verification

✅ **How to verify it's working:**

Add script to `package.json`:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

Run:

```bash
# Check for type errors
pnpm typecheck
```

⚠️ **Common Issues:**

**Issue:** "Cannot find module '@/components/Button'"
**Solution:** Check `paths` mapping is set: `"@/*": ["./*"]`

**Issue:** "JSX element implicitly has type 'any'"
**Solution:**
- For Vike: Check `types` includes `"vike/types"`
- For Next.js: Check `next-env.d.ts` is included

**Issue:** "Unused variable errors in dev but not production"
**Solution:** Make sure `noUnusedLocals` and `noUnusedParameters` are `true`

---

### TailwindCSS Standards

TailwindCSS is the preferred styling solution for all new web projects.

#### Version Recommendation

**Use Tailwind CSS v4+** with the CSS-first configuration approach.

#### Configuration Pattern

**v4 uses CSS for configuration** instead of `tailwind.config.js`.

#### File: `app.css` (or `tailwind.css`)

```css
@import "tailwindcss";

@theme {
  /* Colors */
  --color-primary: #61aaa0;
  --color-primary-light: #83bcb4;
  --color-primary-bg: #ebf4f3;
  --color-secondary: #e08e79;
  --color-secondary-dark: #c54d2e;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'Fira Code', monospace;

  /* Spacing (if custom needed) */
  --spacing-xs: 0.5rem;
  --spacing-sm: 0.75rem;

  /* Shadows (if custom needed) */
  --shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Custom Utilities */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}

/* Custom Components */
@layer components {
  .btn-primary {
    @apply px-6 py-2 bg-teal-600 text-white rounded-lg;
    @apply hover:bg-teal-700 transition-colors;
    @apply focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2;
  }
}
```

#### Required Config File: `tailwind.config.ts`

Even with v4, you need a minimal config for content paths:

```typescript
import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './layouts/**/*.{js,ts,jsx,tsx}',
  ],
} satisfies Config
```

#### Vite Integration: `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

#### Best Practices

**✅ DO:**

1. **Use mobile-first responsive design:**
   ```tsx
   // Default styles are mobile, then enhance for larger screens
   <div className="px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4">
   ```

2. **Use design tokens consistently:**
   ```tsx
   // Use tokens from @theme
   <div className="bg-primary text-white">
   ```

3. **Use semantic spacing:**
   ```tsx
   // Use Tailwind's spacing scale (4, 6, 8, 12, etc.)
   <div className="space-y-4">
   ```

4. **Group related utilities:**
   ```tsx
   // Layout, then spacing, then colors, then effects
   <div className="flex items-center gap-4 px-6 py-4 bg-white rounded-lg shadow-md">
   ```

**❌ DON'T:**

1. **Don't use arbitrary values unnecessarily:**
   ```tsx
   // Bad: Arbitrary values
   <div className="w-[342px] h-[89px]">

   // Good: Use Tailwind tokens
   <div className="w-80 h-20">
   ```

2. **Don't use inline styles:**
   ```tsx
   // Bad: Inline styles
   <div style={{ padding: '16px', backgroundColor: '#61aaa0' }}>

   // Good: Tailwind classes
   <div className="p-4 bg-primary">
   ```

3. **Don't create one-off custom classes:**
   ```tsx
   // Bad: Custom CSS class for one usage
   .my-special-button { ... }

   // Good: Reusable component with Tailwind
   <Button variant="primary">Click me</Button>
   ```

#### Optional Plugins

These plugins are **not required** but can be useful:

```bash
# Typography plugin (for prose content)
pnpm add -D @tailwindcss/typography

# Forms plugin (styled form elements)
pnpm add -D @tailwindcss/forms
```

Usage in `tailwind.config.ts`:

```typescript
export default {
  content: ['...'],
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
} satisfies Config
```

#### Verification

✅ **How to verify it's working:**

1. Start dev server: `pnpm dev`
2. Add Tailwind classes to a component: `<div className="bg-blue-500 text-white p-4">`
3. Check that styles are applied
4. Change a custom token in `@theme` and verify it updates

⚠️ **Common Issues:**

**Issue:** "Tailwind classes not applying"
**Solution:**
1. Check `@import "tailwindcss"` is in your main CSS file
2. Check `content` paths in `tailwind.config.ts` match your file structure
3. Restart dev server

**Issue:** "Custom tokens not working"
**Solution:**
- Check syntax in `@theme` block (no trailing commas)
- Make sure using correct token names (e.g., `bg-primary`, not `bg-color-primary`)

**Issue:** "IntelliSense not working"
**Solution:**
- Install Tailwind CSS IntelliSense extension
- Check `tailwind.config.ts` exists
- Reload VS Code window

---

### Component Architecture

We use **Atomic Design Methodology** for organizing React components.

#### Atomic Design Levels

| Level | Description | Examples |
|-------|-------------|----------|
| **Atoms** | Indivisible UI elements | Button, Input, Icon, Label, Text |
| **Molecules** | Simple groups of atoms | FormField (Label + Input), SearchBar (Input + Button) |
| **Organisms** | Complex sections with multiple molecules | Header, Footer, Navigation, Form |
| **Templates** | Page layouts without content | ArticleLayout, DashboardLayout |
| **Pages** | Specific instances with real content | AboutPage, HomePage |

#### When to Use Each Level

**Atoms:**
- Cannot be broken down further without losing meaning
- Examples: Button, Input, Icon, Image, Text, Label

**Molecules:**
- Combine 2-3 atoms into a functional unit
- Single responsibility
- Examples: FormField (Label + Input + Error), SearchBar (Input + Icon + Button), Author (Avatar + Text)

**Organisms:**
- Complex components with multiple molecules/atoms
- Form distinct sections of the interface
- Examples: Header (Logo + Navigation + SearchBar), Footer, MeditationGrid

**Templates:**
- Define page structure without content
- Show content structure
- Examples: ArticleLayout (header + sidebar + content), DashboardLayout

**Pages:**
- Specific template instances with real content
- Examples: About page, Contact page, Article detail page

#### File Structure

```
components/
├── atoms/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.stories.tsx       # Ladle stories
│   │   ├── Button.test.tsx          # Unit tests
│   │   └── index.ts                 # Barrel export
│   ├── Input/
│   └── Icon/
├── molecules/
│   ├── FormField/
│   │   ├── FormField.tsx
│   │   ├── FormField.stories.tsx
│   │   └── index.ts
│   └── SearchBar/
├── organisms/
│   ├── Header/
│   │   ├── Header.tsx
│   │   ├── Header.stories.tsx
│   │   └── index.ts
│   └── Footer/
└── templates/
    └── ArticleLayout/
```

#### Component Template

```tsx
// components/atoms/Button/Button.tsx
import { ComponentProps } from 'react'

export interface ButtonProps extends ComponentProps<'button'> {
  /**
   * Visual style variant
   */
  variant?: 'primary' | 'secondary' | 'outline'

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Loading state
   */
  isLoading?: boolean
}

/**
 * Button component for user actions.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="lg" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors'

  const variantStyles = {
    primary: 'bg-teal-600 hover:bg-teal-700 text-white',
    secondary: 'bg-coral-600 hover:bg-coral-700 text-white',
    outline: 'border-2 border-teal-600 text-teal-600 hover:bg-teal-50',
  }

  const sizeStyles = {
    sm: 'px-4 py-1 text-sm rounded',
    md: 'px-6 py-2 text-base rounded-md',
    lg: 'px-8 py-3 text-lg rounded-lg',
  }

  return (
    <button
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  )
}
```

#### Barrel Export: `index.ts`

```typescript
// components/atoms/Button/index.ts
export { Button } from './Button'
export type { ButtonProps } from './Button'
```

#### Parent Index: `components/atoms/index.ts`

```typescript
// Export all atoms
export { Button } from './Button'
export type { ButtonProps } from './Button'

export { Input } from './Input'
export type { InputProps } from './Input'

export { Icon } from './Icon'
export type { IconProps } from './Icon'
```

#### Props API Design Patterns

**✅ Best Practices:**

1. **Extend native HTML props:**
   ```tsx
   interface ButtonProps extends ComponentProps<'button'> {
     variant?: 'primary' | 'secondary'
   }
   ```

2. **Use TypeScript interfaces with JSDoc:**
   ```tsx
   /**
    * Button component for user actions
    */
   export interface ButtonProps {
     /** Visual style variant */
     variant?: 'primary' | 'secondary'
   }
   ```

3. **Provide sensible defaults:**
   ```tsx
   function Button({ variant = 'primary', size = 'md' }: ButtonProps) {
     // ...
   }
   ```

4. **Use discriminated unions for variants:**
   ```tsx
   type ButtonProps =
     | { variant: 'link'; href: string }
     | { variant: 'button'; onClick: () => void }
   ```

#### Component Development with Ladle

**All components should have Ladle stories** for:
- Visual documentation
- Isolated development
- Design system reference

See [STORYBOOK.md](./STORYBOOK.md) for complete story patterns.

**Quick Example:**

```tsx
// components/atoms/Button/Button.stories.tsx
import type { Story, StoryDefault } from '@ladle/react'
import { Button } from './Button'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Atoms / Interactive',
} satisfies StoryDefault

export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Variants">
      <div className="flex gap-3">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
      </div>
    </StorySection>

    <StorySection title="Sizes">
      <div className="flex items-center gap-3">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Button'
```

#### Verification

✅ **How to verify it's working:**

1. Components are organized by atomic level
2. Each component has proper TypeScript types
3. Props extend native HTML props where applicable
4. Each component has a story file
5. Barrel exports (`index.ts`) are in place
6. Components follow naming conventions (PascalCase)

---

### Testing

We use two testing tools:
- **Playwright** for end-to-end (E2E) testing
- **Vitest** for unit and integration testing

#### Playwright (E2E Testing)

Playwright tests user flows in real browsers (Chromium, Firefox, WebKit).

#### Configuration: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',

  // Timeout for each test
  timeout: 120000, // 2 minutes

  // Fail fast: stop on first failure
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: 'html',

  use: {
    // Base URL for tests
    baseURL: 'http://localhost:5173',  // or 3000 for Next.js

    // Screenshots and traces
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',

    // Video recording
    video: 'retain-on-failure',
  },

  // Test projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Web server
  webServer: {
    command: 'pnpm dev',
    port: 5173,  // or 3000 for Next.js
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

#### Framework-Specific baseURL

- **Vite/Vike projects:** `baseURL: 'http://localhost:5173'`
- **Next.js projects:** `baseURL: 'http://localhost:3000'`

#### Test Organization

```
tests/
├── e2e/
│   ├── home.spec.ts
│   ├── navigation.spec.ts
│   ├── auth.spec.ts
│   └── forms.spec.ts
└── fixtures/
    └── test-data.ts
```

#### Example Test

```typescript
// tests/e2e/home.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should display hero section', async ({ page }) => {
    await page.goto('/')

    // Check for hero heading
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
    await expect(heading).toContainText('Welcome')
  })

  test('should navigate to about page', async ({ page }) => {
    await page.goto('/')

    // Click about link
    await page.click('a[href="/about"]')

    // Verify URL
    await expect(page).toHaveURL('/about')
  })
})
```

#### Required Dependencies

```bash
pnpm add -D @playwright/test
pnpm exec playwright install
```

#### Scripts: `package.json`

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

#### Verification

✅ **How to verify it's working:**

```bash
# Run tests
pnpm test:e2e

# Run with UI mode (interactive)
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed
```

---

#### Vitest (Unit Testing)

Vitest tests individual functions and components in isolation.

#### Configuration: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.stories.{ts,tsx}',
        '**/dist/**',
        '**/.{vite,next}/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

#### Setup File: `tests/setup.ts`

```typescript
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest matchers with jest-dom
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})
```

#### Test Organization

**Co-locate tests with components:**

```
components/
├── atoms/
│   └── Button/
│       ├── Button.tsx
│       ├── Button.test.tsx    # ← Test file
│       └── Button.stories.tsx
```

#### Example Test

```typescript
// components/atoms/Button/Button.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant classes', () => {
    render(<Button variant="secondary">Click me</Button>)
    const button = screen.getByText('Click me')
    expect(button).toHaveClass('bg-coral-600')
  })

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    const button = screen.getByText('Click me')
    expect(button).toBeDisabled()
  })
})
```

#### Required Dependencies

```bash
pnpm add -D vitest @vitest/ui @vitest/coverage-v8 \
  jsdom @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event
```

#### Scripts: `package.json`

```json
{
  "scripts": {
    "test:unit": "vitest",
    "test:unit:ui": "vitest --ui",
    "test:unit:coverage": "vitest --coverage"
  }
}
```

#### Verification

✅ **How to verify it's working:**

```bash
# Run tests in watch mode
pnpm test:unit

# Run tests once
pnpm test:unit run

# Run with UI
pnpm test:unit:ui

# Run with coverage
pnpm test:unit:coverage
```

#### Coverage Thresholds

Recommended minimum coverage: **80%**

- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

Tests will fail if coverage drops below these thresholds.

---

### Accessibility Standards

All web projects must meet **WCAG 2.1 Level AA** compliance.

#### Requirements

**1. Semantic HTML**

Use appropriate HTML elements for their intended purpose:

```tsx
// ✅ Good: Semantic HTML
<nav>
  <ul>
    <li><a href="/about">About</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>Article Title</h1>
    <p>Content...</p>
  </article>
</main>

<button onClick={handleClick}>Submit</button>

// ❌ Bad: Non-semantic
<div class="nav">
  <div class="link">About</div>
</div>

<div class="main">
  <div class="article">
    <div class="title">Article Title</div>
  </div>
</div>

<div onClick={handleClick}>Submit</div>
```

**2. ARIA Attributes**

Use ARIA when semantic HTML is insufficient:

```tsx
// Accessible dropdown
<button
  aria-expanded={isOpen}
  aria-haspopup="true"
  aria-controls="menu-id"
  onClick={toggleMenu}
>
  Menu
</button>

// Loading state
<button aria-busy={isLoading} disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</button>

// Tab component
<div role="tablist">
  <button role="tab" aria-selected={isActive}>
    Tab 1
  </button>
</div>
```

**3. Keyboard Navigation**

All interactive elements must be keyboard accessible:

- Focusable elements: `<button>`, `<a>`, `<input>`, etc.
- Tab order matches visual order
- Focus indicators are visible
- Escape key closes modals/dropdowns

```tsx
// Example: Keyboard-accessible dropdown
function Dropdown() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>
        Menu
      </button>
      {isOpen && (
        <div role="menu">
          <button role="menuitem">Option 1</button>
          <button role="menuitem">Option 2</button>
        </div>
      )}
    </div>
  )
}
```

**4. Focus Indicators**

Always show visible focus indicators:

```css
/* Tailwind classes */
<button className="focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2">

/* Or custom CSS */
button:focus-visible {
  outline: 2px solid #61aaa0;
  outline-offset: 2px;
}
```

**5. Color Contrast**

Meet minimum contrast ratios:

- **Normal text:** 4.5:1 minimum
- **Large text (18pt+):** 3:1 minimum
- **UI components:** 3:1 minimum

Use tools to verify:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Lighthouse accessibility audit

**6. Alt Text for Images**

All images must have meaningful alt text:

```tsx
// Informative image
<img src="meditation.jpg" alt="Woman meditating in lotus position" />

// Decorative image
<img src="decoration.svg" alt="" role="presentation" />

// Linked image
<a href="/meditation">
  <img src="icon.svg" alt="Go to meditation page" />
</a>
```

**7. Form Accessibility**

Forms must be properly labeled and validated:

```tsx
<div>
  <label htmlFor="email">Email address</label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? 'email-error' : undefined}
  />
  {hasError && (
    <span id="email-error" role="alert">
      Please enter a valid email
    </span>
  )}
</div>
```

#### Tools

**ESLint Plugin (Already Configured):**

```javascript
// eslint.config.js includes:
import jsxA11y from 'eslint-plugin-jsx-a11y'

// Rules:
'jsx-a11y/alt-text': 'warn',
'jsx-a11y/anchor-is-valid': 'warn',
'jsx-a11y/click-events-have-key-events': 'warn',
'jsx-a11y/no-static-element-interactions': 'warn',
```

**Lighthouse Audits:**

Run Lighthouse accessibility audits:

```bash
# In Chrome DevTools
1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Accessibility"
4. Click "Generate report"

# Target: 100 score
```

**Manual Keyboard Testing:**

Test all interactive elements:

```
1. Tab through the page
2. Verify focus indicators are visible
3. Test keyboard shortcuts (Escape, Enter, Space)
4. Verify no keyboard traps
5. Verify tab order is logical
```

#### Verification

✅ **How to verify it's working:**

1. Run ESLint: `pnpm lint` (catches common a11y issues)
2. Run Lighthouse accessibility audit (target: 100 score)
3. Manual keyboard testing (Tab, Enter, Escape)
4. Test with screen reader (VoiceOver on Mac, NVDA on Windows)
5. Check color contrast with online tools

---

### Performance Standards

All web projects should meet these performance targets.

#### Targets

**Lighthouse Scores:**
- Performance: **90+**
- Accessibility: **90+**
- Best Practices: **90+**
- SEO: **90+**

**Core Web Vitals:**

| Metric | Target | What It Measures |
|--------|--------|------------------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Loading performance |
| **FID** (First Input Delay) | < 100ms | Interactivity |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Visual stability |

#### Strategies

**1. Code Splitting**

Split code at route level:

```typescript
// Vike example: pages/+Page.tsx
import { lazy } from 'react'

// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'))

export function Page() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyComponent />
    </Suspense>
  )
}
```

**2. Dynamic Imports**

Load heavy components on demand:

```typescript
import { useState, lazy, Suspense } from 'react'

// Only load when needed
const VideoPlayer = lazy(() => import('./VideoPlayer'))

function MediaSection() {
  const [showVideo, setShowVideo] = useState(false)

  return (
    <div>
      <button onClick={() => setShowVideo(true)}>
        Watch Video
      </button>

      {showVideo && (
        <Suspense fallback={<Spinner />}>
          <VideoPlayer />
        </Suspense>
      )}
    </div>
  )
}
```

**3. Image Optimization**

Use modern formats and lazy loading:

```tsx
// Modern formats with fallback
<picture>
  <source type="image/webp" srcSet={webpSrc} />
  <source type="image/jpeg" srcSet={jpgSrc} />
  <img src={jpgSrc} alt="Description" loading="lazy" />
</picture>

// Or use Next.js Image (for Next.js projects)
import Image from 'next/image'

<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  loading="lazy"
/>
```

**4. Bundle Size Monitoring**

Monitor bundle size in development:

```bash
# Analyze bundle
pnpm build
pnpm vite-bundle-analyzer

# Or add to package.json
{
  "scripts": {
    "analyze": "vite-bundle-visualizer"
  }
}
```

#### Verification

✅ **How to verify it's working:**

1. Run Lighthouse audit (target: 90+ all categories)
2. Check Core Web Vitals in Chrome DevTools
3. Test on slow 3G network (Chrome DevTools Network throttling)
4. Run `pnpm build` and check bundle sizes
5. Use `vite-bundle-visualizer` to analyze bundle composition

⚠️ **Common Issues:**

**Issue:** "Large bundle size"
**Solution:**
- Use dynamic imports for heavy components
- Check for duplicate dependencies
- Remove unused dependencies

**Issue:** "Poor LCP score"
**Solution:**
- Optimize images (WebP, proper sizes)
- Use code splitting
- Defer non-critical JavaScript
- Use Cloudflare CDN for static assets

**Issue:** "High CLS score"
**Solution:**
- Add explicit width/height to images
- Reserve space for dynamic content
- Avoid inserting content above existing content

---

### Browser Support

Define target browsers using browserslist.

#### Configuration

Add to `package.json`:

```json
{
  "browserslist": [
    "last 2 versions",
    "> 0.5%",
    "not dead"
  ]
}
```

Or create `.browserslistrc`:

```
# Browsers we support
last 2 versions
> 0.5%
not dead
```

#### What This Means

- `last 2 versions` - Last 2 versions of each browser
- `> 0.5%` - Browsers with >0.5% global usage
- `not dead` - Browsers with official support

**Typical Support:**
- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)
- **Not supported:** IE 11

#### How It's Used

Browserslist configuration is used by:
- **PostCSS/Autoprefixer** - Adds vendor prefixes
- **Babel** - Transpiles JavaScript for older browsers
- **ESBuild/Vite** - Optimizes build output

#### Verification

✅ **How to verify it's working:**

```bash
# See which browsers are targeted
pnpx browserslist
```

Output:
```
chrome 120
chrome 119
edge 120
edge 119
firefox 121
firefox 120
safari 17.2
safari 17.1
```

---

### Import Patterns

Consistent import patterns improve code readability and maintainability.

#### Path Aliases

**Use `@/*` for root imports:**

```typescript
// ✅ Good: Path alias
import { Button } from '@/components/atoms'
import { useAuth } from '@/hooks/useAuth'
import type { User } from '@/types'

// ❌ Bad: Relative paths from deep files
import { Button } from '../../../components/atoms'
import { useAuth } from '../../../hooks/useAuth'
```

**Configuration is in `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

And `vite.config.ts`:

```typescript
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

#### Import Ordering

**Enforced by ESLint** (see [ESLint Configuration](#eslint-configuration)):

```typescript
// 1. React/framework imports
import { useState, useEffect } from 'react'
import { usePageContext } from 'vike-react/usePageContext'

// 2. External dependencies (alphabetical)
import { format } from 'date-fns'
import { motion } from 'framer-motion'

// 3. Internal imports (alphabetical)
import { Button, Input } from '@/components/atoms'
import { FormField } from '@/components/molecules'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/api'

// 4. Types (using type imports)
import type { User } from '@/types/User'
import type { ApiResponse } from '@/types/Api'

// 5. Styles (if any CSS modules)
import styles from './Component.module.css'
```

#### Type Imports

**Use `import type` for type-only imports:**

```typescript
// ✅ Good: Type imports
import type { User } from '@/types/User'
import type { ComponentProps } from 'react'

// ❌ Bad: Regular imports for types
import { User } from '@/types/User'
```

This is enforced by ESLint:

```javascript
'@typescript-eslint/consistent-type-imports': [
  'warn',
  { prefer: 'type-imports' },
],
```

#### Barrel Exports

**Use barrel exports (`index.ts`) for cleaner imports:**

```typescript
// components/atoms/index.ts
export { Button } from './Button'
export type { ButtonProps } from './Button'

export { Input } from './Input'
export type { InputProps } from './Input'

// Usage:
import { Button, Input } from '@/components/atoms'
```

#### Verification

✅ **How to verify it's working:**

1. ESLint will warn if imports are not ordered correctly
2. Run `pnpm lint:fix` to auto-fix import order
3. Type imports will be enforced by TypeScript

⚠️ **Common Issues:**

**Issue:** "Path alias not working"
**Solution:**
- Check `tsconfig.json` has correct `paths` config
- Check `vite.config.ts` has correct `resolve.alias`
- Restart TypeScript server in VS Code

**Issue:** "Import order not being enforced"
**Solution:**
- Make sure `eslint-plugin-import` is installed
- Check ESLint config includes import plugin
- Run `pnpm lint:fix`

---

### Sentry Configuration

Sentry provides error tracking and performance monitoring for web applications.

#### When to Use

Use Sentry for:
- Production error tracking
- Performance monitoring
- User feedback on errors
- Release tracking

**Not all projects need Sentry.** Only add if:
- Project is production-facing
- Team wants error monitoring
- Budget allows (Sentry has usage-based pricing)

#### Browser Configuration

#### File: `sentry.browser.config.ts`

```typescript
import * as Sentry from '@sentry/react'

Sentry.init({
  // DSN from Sentry dashboard
  dsn: import.meta.env.PUBLIC__SENTRY_DSN,

  // Environment
  environment: import.meta.env.MODE, // 'development' or 'production'

  // Only enable in production
  enabled: import.meta.env.PROD,

  // Performance monitoring
  tracesSampleRate: 1.0, // 100% of transactions

  // Session replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
})
```

#### Server Configuration (SSR Projects)

#### File: `sentry.server.config.ts`

```typescript
import * as Sentry from '@sentry/node'

Sentry.init({
  // Server-side DSN
  dsn: process.env.SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV,

  // Performance monitoring
  tracesSampleRate: 1.0,
})
```

#### Environment Variables

Add to `.env.example`:

```bash
# Sentry Error Tracking
PUBLIC__SENTRY_DSN=https://your_public_sentry_dsn@sentry.io/project_id
SENTRY_DSN=https://your_server_sentry_dsn@sentry.io/project_id

# Sentry Build Plugin (for source maps)
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
SENTRY_AUTH_TOKEN=your_auth_token
```

Add to `.env`:

```bash
PUBLIC__SENTRY_DSN=https://actual_public_dsn@sentry.io/12345
SENTRY_DSN=https://actual_server_dsn@sentry.io/12345
SENTRY_ORG=my-organization
SENTRY_PROJECT=my-project
SENTRY_AUTH_TOKEN=actual_auth_token
```

#### Source Maps Upload

For better error tracking, upload source maps to Sentry.

#### Vite Plugin: `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  plugins: [
    // ... other plugins

    // Sentry plugin (only in production)
    process.env.NODE_ENV === 'production' &&
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
      }),
  ],

  build: {
    sourcemap: true, // Required for Sentry
  },
})
```

#### Initialize in App

**Vike:**

```typescript
// pages/+client.ts
import './sentry.browser.config'
```

**Next.js:**

```typescript
// pages/_app.tsx
import '../sentry.browser.config'
```

#### Required Dependencies

```bash
# Browser
pnpm add @sentry/react

# Server (for SSR)
pnpm add @sentry/node

# Vite plugin
pnpm add -D @sentry/vite-plugin
```

#### Testing Sentry

Create a test page to verify Sentry is working:

```typescript
// pages/sentry-test/+Page.tsx
export function Page() {
  const throwError = () => {
    throw new Error('Test error for Sentry')
  }

  return (
    <div>
      <h1>Sentry Test Page</h1>
      <button onClick={throwError}>Throw Test Error</button>
    </div>
  )
}
```

Visit `/sentry-test` in production and click the button. Error should appear in Sentry dashboard.

#### Verification

✅ **How to verify it's working:**

1. Build for production: `pnpm build`
2. Run production preview: `pnpm preview`
3. Visit test page and throw error
4. Check Sentry dashboard for error

⚠️ **Common Issues:**

**Issue:** "Sentry not capturing errors"
**Solution:**
- Check `enabled: import.meta.env.PROD` is set
- Check DSN is correct
- Check Sentry is initialized before app render

**Issue:** "Source maps not uploaded"
**Solution:**
- Check `SENTRY_AUTH_TOKEN` is set
- Check `sourcemap: true` in Vite config
- Check Sentry plugin is enabled in production

**Issue:** "Errors show minified code"
**Solution:**
- Source maps not uploaded or not matching
- Rebuild and redeploy with source map upload enabled

---

## Implementation Checklist

Use this checklist when setting up a new project or standardizing an existing one.

### Phase 1: Universal Standards

- [ ] **Code Formatting**
  - [ ] Create `.prettierrc` with standard settings
  - [ ] Add format scripts to `package.json`
  - [ ] Verify: Run `pnpm format` successfully

- [ ] **Editor Configuration**
  - [ ] Create `.editorconfig` with standard settings
  - [ ] Verify: Open file and check LF line endings

- [ ] **Version Control**
  - [ ] Create comprehensive `.gitignore` (158+ lines)
  - [ ] Add project-specific patterns if needed
  - [ ] Verify: Check `node_modules`, `dist`, `.env` are ignored

- [ ] **VSCode Settings**
  - [ ] Create `.vscode/settings.json` with standard settings
  - [ ] Create `.vscode/extensions.json` with recommended extensions
  - [ ] Verify: Format on save and ESLint auto-fix work

- [ ] **Environment Variables**
  - [ ] Create `.env.example` documenting all variables
  - [ ] Add `PUBLIC__` prefix to browser-exposed variables
  - [ ] Document variables in README.md
  - [ ] Verify: Variables load correctly in dev and build

### Phase 2: Web Project Standards

- [ ] **ESLint**
  - [ ] Create `eslint.config.js` (flat config preferred)
  - [ ] Install required dependencies
  - [ ] Add lint scripts to `package.json`
  - [ ] Configure framework-specific rules if needed
  - [ ] Verify: Run `pnpm lint` successfully

- [ ] **TypeScript**
  - [ ] Create `tsconfig.json` with recommended settings
  - [ ] Configure path aliases (`@/*`)
  - [ ] Add typecheck script to `package.json`
  - [ ] Verify: Run `pnpm typecheck` successfully

- [ ] **TailwindCSS**
  - [ ] Install Tailwind v4+
  - [ ] Create CSS file with `@import "tailwindcss"`
  - [ ] Define design tokens in `@theme` block
  - [ ] Create minimal `tailwind.config.ts`
  - [ ] Add Tailwind plugin to Vite config
  - [ ] Verify: Tailwind classes work in components

- [ ] **Component Architecture**
  - [ ] Create atomic design directory structure
  - [ ] Set up Ladle for component development
  - [ ] Create example stories following patterns
  - [ ] Verify: Run `pnpm ladle` successfully

- [ ] **Testing**
  - [ ] **Playwright (E2E):**
    - [ ] Create `playwright.config.ts`
    - [ ] Create `tests/e2e/` directory
    - [ ] Write example E2E test
    - [ ] Add test scripts to `package.json`
    - [ ] Verify: Run `pnpm test:e2e` successfully
  - [ ] **Vitest (Unit):**
    - [ ] Create `vitest.config.ts`
    - [ ] Create `tests/setup.ts`
    - [ ] Write example unit test
    - [ ] Add test scripts to `package.json`
    - [ ] Verify: Run `pnpm test:unit` successfully

- [ ] **Accessibility**
  - [ ] Verify `eslint-plugin-jsx-a11y` is configured
  - [ ] Run Lighthouse accessibility audit
  - [ ] Test keyboard navigation
  - [ ] Verify: Lighthouse score 90+

- [ ] **Performance**
  - [ ] Run Lighthouse performance audit
  - [ ] Check Core Web Vitals
  - [ ] Verify: Lighthouse score 90+

- [ ] **Browser Support**
  - [ ] Add `browserslist` to `package.json`
  - [ ] Verify: Run `pnpx browserslist` to see targets

- [ ] **Sentry (Optional)**
  - [ ] Create `sentry.browser.config.ts`
  - [ ] Create `sentry.server.config.ts` (if SSR)
  - [ ] Add Sentry environment variables
  - [ ] Configure source map upload
  - [ ] Verify: Test error in production shows in Sentry

### Phase 3: Documentation

- [ ] Update `README.md` with:
  - [ ] Setup instructions
  - [ ] Environment variables documentation
  - [ ] Available scripts
  - [ ] Architecture overview
- [ ] Commit all standard configs to git
- [ ] Verify team members can clone and run project

---

## Migration Guides

### ESLint: Legacy → Flat Config

#### Why Migrate?

- **Flat config is the future:** ESLint 9+ uses flat config by default
- **Better TypeScript support:** Easier to configure with TypeScript
- **Simpler syntax:** No more complex extends chains
- **Better performance:** Faster configuration loading

**Note:** Migration is not urgent. New projects should use flat config, existing projects can migrate when convenient.

#### Step-by-Step Migration

**1. Check Current ESLint Version**

```bash
pnpm list eslint
# Need ESLint 8.21.0 or higher
```

**2. Install New Dependencies**

```bash
# Remove old config format packages
pnpm remove eslint-config-react-app

# Install flat config compatible packages
pnpm add -D @eslint/js globals \
  @typescript-eslint/eslint-plugin @typescript-eslint/parser \
  eslint-plugin-react eslint-plugin-react-hooks \
  eslint-plugin-jsx-a11y eslint-plugin-unused-imports \
  eslint-plugin-import eslint-config-prettier
```

**3. Create New Config File**

Rename `.eslintrc.json` to `.eslintrc.json.backup` and create `eslint.config.js`:

```javascript
import js from '@eslint/js'
import globals from 'globals'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import unusedImports from 'eslint-plugin-unused-imports'
import importPlugin from 'eslint-plugin-import'
import prettier from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      'unused-imports': unusedImports,
      'import': importPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // Copy your existing rules here
      // See full config in ESLint Configuration section
    },
  },
  prettier,
]
```

**4. Test the New Config**

```bash
# Test linting
pnpm lint

# If errors, compare with backup config
```

**5. Update Scripts (if needed)**

Usually no changes needed, but verify:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

**6. Remove Old Files**

Once verified working:

```bash
rm .eslintrc.json.backup
rm .eslintignore  # Config now handles ignore patterns
```

#### Side-by-Side Comparison

**Legacy (.eslintrc.json):**

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "react", "unused-imports"],
  "rules": {
    "no-console": "warn"
  }
}
```

**Flat Config (eslint.config.js):**

```javascript
import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import prettier from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  {
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      'no-console': 'warn',
    },
  },
  prettier,
]
```

#### Common Pitfalls

⚠️ **Issue:** "Config not found"
**Solution:** Make sure file is named `eslint.config.js` (not `.eslintrc.js`)

⚠️ **Issue:** "Plugins not working"
**Solution:** Check plugins are imported and added to `plugins` object

⚠️ **Issue:** "Prettier conflicts"
**Solution:** Make sure `eslint-config-prettier` is last in config array

---

### Adding Prettier to Projects Using ESLint-Integrated Formatting

Some older projects have Prettier integrated into ESLint. This is not ideal.

#### Why Separate?

- **Separation of concerns:** ESLint for linting, Prettier for formatting
- **Faster:** Prettier is faster than ESLint for formatting
- **Editor integration:** Better editor support with standalone Prettier

#### Step-by-Step

**1. Install Prettier**

```bash
pnpm add -D prettier eslint-config-prettier
```

**2. Create `.prettierrc`**

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "printWidth": 100
}
```

**3. Update ESLint Config**

Add `eslint-config-prettier` to disable formatting rules:

```javascript
// eslint.config.js
import prettier from 'eslint-config-prettier'

export default [
  // ... other configs
  prettier, // Must be last
]
```

**4. Update VSCode Settings**

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true
}
```

**5. Add Scripts**

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

**6. Format Entire Codebase**

```bash
# Format all files
pnpm format

# Check formatting in CI
pnpm format:check
```

---

### Adding Missing Configurations

#### Adding EditorConfig

```bash
# Create .editorconfig
cat > .editorconfig << 'EOF'
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.{js,jsx,ts,tsx,mjs,cjs}]
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
EOF
```

#### Adding VSCode Settings

```bash
# Create directory
mkdir -p .vscode

# Create settings.json
cat > .vscode/settings.json << 'EOF'
{
  "npm.packageManager": "pnpm",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
EOF

# Create extensions.json
cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss"
  ]
}
EOF
```

#### Updating .gitignore

```bash
# Backup current .gitignore
cp .gitignore .gitignore.backup

# Append comprehensive patterns
cat >> .gitignore << 'EOF'
# Add comprehensive patterns from this document
# See "Version Control (.gitignore)" section
EOF
```

---

## Project Audit Checklist

Use this checklist to audit existing projects for compliance with these standards.

### Universal Standards

- [ ] **`.prettierrc`** exists with standard settings:
  - [ ] `semi: false`
  - [ ] `singleQuote: true`
  - [ ] `trailingComma: "all"`
  - [ ] `tabWidth: 2`
  - [ ] `printWidth: 100`

- [ ] **`.editorconfig`** exists with standard settings:
  - [ ] `end_of_line = lf`
  - [ ] `indent_style = space`
  - [ ] `indent_size = 2`
  - [ ] `insert_final_newline = true`
  - [ ] `trim_trailing_whitespace = true`

- [ ] **`.gitignore`** is comprehensive (158+ lines):
  - [ ] Ignores `node_modules`, `.pnpm-store`
  - [ ] Ignores build outputs (`dist`, `build`, `.vite`, `.next`)
  - [ ] Ignores environment files (`.env`, `.env.local`)
  - [ ] Ignores `playwright/.auth/`
  - [ ] Includes VSCode exceptions (`.vscode/*` but `!.vscode/settings.json`)

- [ ] **`.vscode/settings.json`** exists:
  - [ ] `npm.packageManager: "pnpm"`
  - [ ] `editor.formatOnSave: true`
  - [ ] `editor.defaultFormatter: "esbenp.prettier-vscode"`
  - [ ] ESLint auto-fix on save configured

- [ ] **`.vscode/extensions.json`** exists:
  - [ ] Recommends Prettier extension
  - [ ] Recommends ESLint extension
  - [ ] Recommends Tailwind CSS extension

- [ ] **`.env.example`** exists:
  - [ ] Documents all required environment variables
  - [ ] Uses `PUBLIC__` prefix for browser-exposed variables
  - [ ] Contains no actual secrets

- [ ] **`package.json`** standards:
  - [ ] Uses `pnpm` as package manager
  - [ ] Has `"type": "module"`
  - [ ] Has standard scripts: `dev`, `build`, `lint`, `format`, `typecheck`
  - [ ] Has `pnpm-lock.yaml` committed

### Web Project Standards

- [ ] **ESLint Configuration**:
  - [ ] Has `eslint.config.js` (flat config) OR `.eslintrc.json` (legacy)
  - [ ] Includes TypeScript rules
  - [ ] Includes React rules
  - [ ] Includes `jsx-a11y` rules
  - [ ] Includes `unused-imports` plugin
  - [ ] Includes `import` plugin with ordering
  - [ ] `no-console: 'warn'` rule
  - [ ] Has `eslint-config-prettier` to prevent conflicts

- [ ] **TypeScript Configuration**:
  - [ ] Has `tsconfig.json`
  - [ ] `strict: true`
  - [ ] `noUnusedLocals: true`
  - [ ] `noUnusedParameters: true`
  - [ ] `noFallthroughCasesInSwitch: true`
  - [ ] Path aliases configured (`@/*`)
  - [ ] Framework-specific types (Vike or Next.js)

- [ ] **TailwindCSS**:
  - [ ] Tailwind v4+ configured
  - [ ] Uses CSS-first configuration (`@import "tailwindcss"`)
  - [ ] Design tokens defined in `@theme` block
  - [ ] Has `tailwind.config.ts` with content paths
  - [ ] Tailwind plugin in `vite.config.ts`

- [ ] **Component Architecture**:
  - [ ] Follows Atomic Design (atoms, molecules, organisms, templates)
  - [ ] Components are organized by level
  - [ ] Each component has barrel export (`index.ts`)
  - [ ] Props extend native HTML props where appropriate

- [ ] **Component Development (Ladle)**:
  - [ ] Has Ladle configured (`pnpm ladle` works)
  - [ ] Components have story files (`.stories.tsx`)
  - [ ] Stories follow standard patterns from STORYBOOK.md

- [ ] **Testing - Playwright**:
  - [ ] Has `playwright.config.ts`
  - [ ] Tests in `tests/e2e/` directory
  - [ ] `baseURL` matches framework (5173 for Vite, 3000 for Next.js)
  - [ ] `reuseExistingServer: !process.env.CI` pattern
  - [ ] Screenshot/trace on failure configured

- [ ] **Testing - Vitest**:
  - [ ] Has `vitest.config.ts`
  - [ ] Has `tests/setup.ts`
  - [ ] Coverage thresholds set (80%+ recommended)
  - [ ] Tests co-located with components (`.test.tsx`)

- [ ] **Accessibility**:
  - [ ] `eslint-plugin-jsx-a11y` configured
  - [ ] Lighthouse accessibility audit passes (90+)
  - [ ] Components use semantic HTML
  - [ ] Interactive elements have keyboard support
  - [ ] Focus indicators visible

- [ ] **Performance**:
  - [ ] Lighthouse performance audit passes (90+)
  - [ ] Core Web Vitals meet targets (LCP < 2.5s, FID < 100ms, CLS < 0.1)
  - [ ] Code splitting implemented for routes
  - [ ] Images optimized (WebP, lazy loading)

- [ ] **Browser Support**:
  - [ ] Has `browserslist` configuration in `package.json` or `.browserslistrc`

- [ ] **Import Patterns**:
  - [ ] Path aliases (`@/*`) configured and used
  - [ ] Import ordering enforced by ESLint
  - [ ] Type imports use `import type`

- [ ] **Sentry (if using)**:
  - [ ] Has `sentry.browser.config.ts`
  - [ ] Has `sentry.server.config.ts` (if SSR)
  - [ ] Environment variables configured (`PUBLIC__SENTRY_DSN`, `SENTRY_DSN`)
  - [ ] Only enabled in production (`enabled: import.meta.env.PROD`)
  - [ ] Source maps uploaded to Sentry

### Framework-Specific

- [ ] **Vike Projects**:
  - [ ] Has Vike types in `tsconfig.json`: `"types": ["vike/types"]`
  - [ ] Uses `jsx: "react-jsx"` in tsconfig

- [ ] **PayloadCMS/Next.js Projects**:
  - [ ] Has Next.js ESLint rules (`@next/eslint-plugin-next`)
  - [ ] Has Next.js plugin in `tsconfig.json`
  - [ ] Uses `jsx: "preserve"` in tsconfig

### Documentation

- [ ] **README.md** includes:
  - [ ] Setup instructions
  - [ ] Environment variables documentation
  - [ ] Available scripts
  - [ ] Architecture overview (or link to separate doc)

---

## Summary

This document establishes comprehensive standards for web project development, covering:

- ✅ Code formatting (Prettier)
- ✅ Editor configuration (EditorConfig, VSCode)
- ✅ Version control (.gitignore)
- ✅ Linting (ESLint with flat config)
- ✅ Type checking (TypeScript)
- ✅ Styling (TailwindCSS v4)
- ✅ Component architecture (Atomic Design + Ladle)
- ✅ Testing (Playwright E2E + Vitest unit)
- ✅ Accessibility (WCAG 2.1 AA)
- ✅ Performance (Core Web Vitals)
- ✅ Error tracking (Sentry)

**Next Steps:**
1. Use the [Implementation Checklist](#implementation-checklist) for new projects
2. Use the [Project Audit Checklist](#project-audit-checklist) for existing projects
3. Refer to [Migration Guides](#migration-guides) when updating legacy configs
4. Keep this document updated as standards evolve

**Questions or Suggestions:**
This is a living document. If you find issues or have suggestions for improvements, discuss with the team and update accordingly.

---

**Document Version:** 1.0
**Last Updated:** 2025-01-18
**Maintainer:** Development Team
