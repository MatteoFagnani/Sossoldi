import assert from 'node:assert/strict';
import { adjustedInitialBalance } from './src/services/accountBalance.ts';

assert.deepEqual([adjustedInitialBalance(100, 150, 120), adjustedInitialBalance(0.1, 0.3, 0.2)], [70, 0]);
console.log('Account balance check passed');
