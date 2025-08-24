#!/usr/bin/env node

const { exec } = require('child_process');
const chokidar = require('chokidar');
const path = require('path');

console.log('🧪 Test Runner: Watching for file changes...');
console.log('📁 Monitoring: client/src, server, shared, tests directories');
console.log('⚡ Will run tests automatically when changes are detected\n');

let isRunning = false;

function runTests() {
  if (isRunning) {
    console.log('⏳ Tests already running, skipping...');
    return;
  }

  isRunning = true;
  console.log('\n🔄 Running tests...');
  
  const testCommand = 'npx jest tests/simple.test.ts tests/integration tests/functionality --verbose --detectOpenHandles';
  
  exec(testCommand, (error, stdout, stderr) => {
    isRunning = false;
    
    if (error) {
      console.log('❌ Test execution failed:');
      console.log(stdout);
      console.log(stderr);
    } else {
      console.log('✅ Tests completed:');
      console.log(stdout);
    }
    
    console.log('\n👀 Waiting for changes...');
  });
}

// Watch for changes in key directories
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
    '**/build/**'
  ],
  persistent: true,
  ignoreInitial: true
});

// Debounce test runs to avoid running too frequently
let timeout;
watcher.on('change', (filePath) => {
  const relativePath = path.relative(process.cwd(), filePath);
  console.log(`\n📝 File changed: ${relativePath}`);
  
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    runTests();
  }, 1000); // Wait 1 second after last change
});

watcher.on('ready', () => {
  console.log('✅ File watcher ready\n');
  // Run tests once on startup
  runTests();
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping test runner...');
  watcher.close();
  process.exit(0);
});