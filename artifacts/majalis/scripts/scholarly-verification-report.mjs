#!/usr/bin/env node
import { runScholarlyVerificationScan } from '../lib/scholarly-verification/orchestrator.mjs';

const checkLinks = process.argv.includes('--links');
const useAi = process.argv.includes('--ai');
const persist = process.argv.includes('--persist');

const result = await runScholarlyVerificationScan({
  checkLinks,
  useAi,
  persist,
  trigger: 'script',
});

console.log(JSON.stringify(result.report, null, 2));
