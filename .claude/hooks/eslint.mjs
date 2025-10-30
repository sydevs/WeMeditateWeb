#!/usr/bin/env node

/**
 * ESLint Hook (PostToolUse)
 *
 * Runs after Edit/Write operations on JavaScript/TypeScript files
 * Auto-fixes linting issues when possible and reports unfixable errors to Claude
 */

import { readFileSync } from 'fs';
import { spawn } from 'child_process';

// Read hook input from stdin
let input = '';
try {
  input = readFileSync(0, 'utf-8');
} catch (error) {
  console.error(JSON.stringify({
    continue: true,
    additionalContext: `Failed to read stdin: ${error.message}`
  }));
  process.exit(0);
}

const hookData = JSON.parse(input);
const { filePath } = hookData;

// Only check JS/TS files
if (!filePath || !filePath.match(/\.(js|jsx|ts|tsx|mjs|cjs)$/)) {
  console.log(JSON.stringify({
    continue: true,
    suppressOutput: true
  }));
  process.exit(0);
}

// Run ESLint with auto-fix
const eslint = spawn('npx', ['eslint', '--fix', filePath], {
  cwd: process.env.CLAUDE_PROJECT_DIR,
  stdio: ['ignore', 'pipe', 'pipe']
});

let stdout = '';
let stderr = '';

eslint.stdout.on('data', (data) => {
  stdout += data.toString();
});

eslint.stderr.on('data', (data) => {
  stderr += data.toString();
});

eslint.on('close', (code) => {
  const output = stdout + stderr;

  if (code !== 0 && output.trim()) {
    // Extract error count
    const errorMatch = output.match(/(\d+)\s+error/);
    const warningMatch = output.match(/(\d+)\s+warning/);
    const errors = errorMatch ? parseInt(errorMatch[1]) : 0;
    const warnings = warningMatch ? parseInt(warningMatch[1]) : 0;

    if (errors > 0) {
      console.log(JSON.stringify({
        continue: true,
        additionalContext: `ESLint found ${errors} error(s) and ${warnings} warning(s) in ${filePath}:\n\n${output}\n\nPlease fix these linting issues.`
      }));
    } else {
      // Only warnings - suppress to avoid noise
      console.log(JSON.stringify({
        continue: true,
        suppressOutput: true
      }));
    }
  } else {
    // No errors or successfully auto-fixed - suppress success message
    console.log(JSON.stringify({
      continue: true,
      suppressOutput: true
    }));
  }

  process.exit(0);
});
