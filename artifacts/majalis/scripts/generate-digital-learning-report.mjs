#!/usr/bin/env node
import { generateDigitalLearningReport } from "../lib/digital-learning/report.mjs";

generateDigitalLearningReport()
  .then((report) => {
    console.log(`Report generated — ${report.completion_pct}% complete`);
    console.log(`Paths: ${report.metrics.paths_count}, Quizzes: ${report.metrics.quizzes_count}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
