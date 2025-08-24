#!/usr/bin/env node

/**
 * Simple test runner for RightHere project
 * This script runs focused tests and can be executed manually
 */

import { exec } from 'child_process';

console.log('Running RightHere Test Suite...\n');

const testCommand = 'npx jest tests/integration tests/simple.test.ts --verbose --detectOpenHandles --forceExit';

exec(testCommand, (error, stdout, stderr) => {
  if (error) {
    console.log('Test execution failed:');
    console.log(stdout);
    console.log(stderr);
    process.exit(1);
  } else {
    console.log('Tests completed successfully:');
    console.log(stdout);
    
    // Extract test results
    const lines = stdout.split('\n');
    const testSuites = lines.find(line => line.includes('Test Suites:'));
    const tests = lines.find(line => line.includes('Tests:'));
    
    if (testSuites && tests) {
      console.log('\n📊 Summary:');
      console.log(`   ${testSuites.trim()}`);
      console.log(`   ${tests.trim()}\n`);
    }
    
    console.log('✅ All tests passed! Ready for deployment.');
    process.exit(0);
  }
});