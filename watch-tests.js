#!/usr/bin/env node

/**
 * Automated test runner that watches for file changes
 * Runs tests whenever source code or test files are modified
 */

import { exec } from 'child_process';
import chokidar from 'chokidar';
import path from 'path';

console.log('🧪 RightHere Test Watcher Starting...');
console.log('📁 Monitoring: client/src, server, shared directories');
console.log('⚡ Tests will run automatically when changes are detected\n');

let isRunning = false;
let lastRunTime = 0;

function runTests() {
  const now = Date.now();
  
  // Prevent running tests too frequently (debounce)
  if (isRunning || (now - lastRunTime) < 2000) {
    return;
  }

  isRunning = true;
  lastRunTime = now;
  
  console.log('\n🔄 Running focused tests...');
  
  const testCommand = 'npx jest tests/integration tests/simple.test.ts --verbose --silent --detectOpenHandles --forceExit';
  
  exec(testCommand, (error, stdout, stderr) => {
    isRunning = false;
    
    if (error) {
      console.log('❌ Tests failed:');
      console.log(stdout);
      if (stderr) console.log(stderr);
    } else {
      // Parse results for clean output
      const lines = stdout.split('\n');
      const passedLine = lines.find(line => line.includes('✓') && line.includes('passed'));
      const summaryLine = lines.find(line => line.includes('Test Suites:'));
      
      if (summaryLine) {
        console.log('✅ Tests passed:', summaryLine.trim());
      } else {
        console.log('✅ Tests completed successfully');
      }
    }
    
    console.log('\n👀 Watching for changes...');
  });
}

// Watch for changes in source files
const watcher = chokidar.watch([
  'client/src/**/*.{ts,tsx}',
  'server/**/*.{ts,tsx}', 
  'shared/**/*.{ts,tsx}',
  'tests/**/*.{ts,tsx}'
], {
  ignored: [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/*.d.ts'
  ],
  persistent: true,
  ignoreInitial: true
});

// Debounce test runs
let timeout;
watcher.on('change', (filePath) => {
  const relativePath = path.relative(process.cwd(), filePath);
  console.log(`\n📝 Changed: ${relativePath}`);
  
  clearTimeout(timeout);
  timeout = setTimeout(runTests, 1000);
});

watcher.on('ready', () => {
  console.log('✅ File watcher ready\n');
  // Run tests once on startup
  runTests();
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping test watcher...');
  watcher.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  watcher.close();
  process.exit(0);
});