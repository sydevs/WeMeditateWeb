#!/usr/bin/env node

/**
 * TypeScript Type-Checking Hook (PostToolUse)
 *
 * Runs after Edit/Write operations on TypeScript files
 * Checks for type errors and reports them to Claude for automatic fixing
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

// Only check TypeScript files
if (!filePath || !filePath.match(/\.(ts|tsx)$/)) {
  console.log(JSON.stringify({
    continue: true,
    suppressOutput: true
  }));
  process.exit(0);
}

// Run TypeScript compiler
const tsc = spawn('npx', ['tsc', '--noEmit', '--pretty', 'false'], {
  cwd: process.env.CLAUDE_PROJECT_DIR,
  stdio: ['ignore', 'pipe', 'pipe']
});

let stdout = '';
let stderr = '';

tsc.stdout.on('data', (data) => {
  stdout += data.toString();
});

tsc.stderr.on('data', (data) => {
  stderr += data.toString();
});

tsc.on('close', (code) => {
  const output = stdout + stderr;

  // Filter errors related to the file being edited
  const relevantErrors = output.split('\n')
    .filter(line => line.includes(filePath))
    .join('\n');

  if (code !== 0 && relevantErrors) {
    const errorCount = (relevantErrors.match(/error TS\d+:/g) || []).length;

    console.log(JSON.stringify({
      continue: true,
      additionalContext: `TypeScript found ${errorCount} type error(s) in ${filePath}:\n\n${relevantErrors}\n\nPlease fix these type errors.`
    }));
  } else if (code !== 0) {
    // Type errors exist but not in this file - suppress to avoid noise
    console.log(JSON.stringify({
      continue: true,
      suppressOutput: true
    }));
  } else {
    // No errors - suppress success message
    console.log(JSON.stringify({
      continue: true,
      suppressOutput: true
    }));
  }

  process.exit(0);
});
