#!/usr/bin/env node
import { generateLessonSyncReport, runKuwaitLessonsSync } from '../lib/kuwait-lessons-sync/sync.mjs';

const action = process.argv[2] || 'report';

if (action === 'sync') {
  const result = await runKuwaitLessonsSync({ useAi: false, dryRun: Boolean(process.env.DRY_RUN) });
  console.log(JSON.stringify(result, null, 2));
} else {
  const report = await generateLessonSyncReport();
  console.log(JSON.stringify(report, null, 2));
}
