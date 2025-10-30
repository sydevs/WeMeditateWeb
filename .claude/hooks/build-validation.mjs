#!/usr/bin/env node

/**
 * Build Validation Hook (PreToolUse)
 *
 * Runs before git commit/push operations
 * Validates that the build succeeds to prevent broken code from being committed
 */

import { readFileSync } from 'fs';
import { spawn } from 'child_process';

// Read hook input from stdin
let input = '';
try {
  input = readFileSync(0, 'utf-8');
} catch (error) {
  console.error(JSON.stringify({
    continue: false,
    reason: `Failed to read stdin: ${error.message}`
  }));
  process.exit(2);
}

const hookData = JSON.parse(input);
const { command } = hookData;

// Only run on git commit or push
if (!command || !command.match(/git\s+(commit|push)/)) {
  console.log(JSON.stringify({
    continue: true,
    suppressOutput: true
  }));
  process.exit(0);
}

console.log(JSON.stringify({
  continue: true,
  systemMessage: 'Running build validation before commit...'
}));

// Run build
const build = spawn('npm', ['run', 'build'], {
  cwd: process.env.CLAUDE_PROJECT_DIR,
  stdio: ['ignore', 'pipe', 'pipe']
});

let stdout = '';
let stderr = '';

build.stdout.on('data', (data) => {
  stdout += data.toString();
});

build.stderr.on('data', (data) => {
  stderr += data.toString();
});

build.on('close', (code) => {
  if (code !== 0) {
    const output = (stdout + stderr).slice(-2000); // Last 2000 chars to avoid overwhelming output

    console.log(JSON.stringify({
      continue: false,
      reason: `Build failed. Please fix build errors before committing.\n\n${output}`
    }));
    process.exit(2);
  } else {
    console.log(JSON.stringify({
      continue: true,
      systemMessage: 'Build validation passed!'
    }));
    process.exit(0);
  }
});
