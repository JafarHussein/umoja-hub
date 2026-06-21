// Command-line entry for the ecosystem simulation engine. Dispatches on argv:
//   tsx scripts/simulate/cli.ts demo      build a new ecosystem (fresh runId)
//   tsx scripts/simulate/cli.ts reset     delete the latest run's documents
//   tsx scripts/simulate/cli.ts rebuild   reset the latest run, then build anew
//   tsx scripts/simulate/cli.ts validate  assert the ecosystem is consistent
// Wired in package.json as seed:demo / seed:reset / seed:rebuild / seed:validate.
// The production guard and DB connect/disconnect are handled by bootstrap()/shutdown().

import { bootstrap, shutdown, log } from './db';
import { runSimulation } from './orchestrate';
import { runAnalytics } from './analytics';
import { resetRun } from './reset';
import { validate } from './validate';

async function demo(): Promise<void> {
  await runSimulation();
  await runAnalytics();
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'demo';
  await bootstrap();
  try {
    switch (command) {
      case 'demo':
        await demo();
        break;
      case 'reset':
        await resetRun(process.argv[3]);
        break;
      case 'rebuild':
        await resetRun();
        await demo();
        break;
      case 'validate':
        if (!(await validate())) process.exitCode = 1;
        break;
      default:
        log(`unknown command "${command}" — expected demo | reset | rebuild`);
        process.exitCode = 1;
    }
  } finally {
    await shutdown();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[simulate] fatal:', err);
  process.exit(1);
});
