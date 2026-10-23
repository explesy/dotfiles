#!/usr/bin/env node
import { metricsDirectory, readRuns, summarize, reportMarkdown, recordFeedback } from '../.config/pi/lib/workflow-metrics.ts';

const args = process.argv.slice(2);
const directory = metricsDirectory();
try {
  let summary;
  if (args.length === 0) {
    const { runs, unreadable } = await readRuns(directory);
    summary = summarize(runs, unreadable);
  } else if (args[0] === '--feedback' && (args.length === 3 || args.length === 4)) {
    summary = await recordFeedback(directory, args[1], args[2], args[3]);
  } else if (args.length === 1 && args[0] === '--help') {
    console.log('Usage: node pi/scripts/workflow-report.mjs\n       node pi/scripts/workflow-report.mjs --feedback <run-id> accepted|needs-fixes|unverified [contract|tests|scope|evidence|other]\nFeedback records an explicit independent assessment; never infer it from green tests.');
    process.exit(0);
  } else {
    throw new Error('Invalid arguments; use --help');
  }
  console.log(reportMarkdown(summary));
} catch {
  console.error('Workflow report failed: check arguments, run ID and local state permissions. No task data is printed.');
  process.exitCode = 1;
}
