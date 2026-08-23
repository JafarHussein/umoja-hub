// The demo world generator — UmojaHub's single canonical data script.
//
//   npm run demo            clear any previous world, build a new one, run the
//                           analytics crons, then validate it. This is the only
//                           command needed before a presentation.
//
// Subcommands exist for the rare case where you want one step on its own:
//   tsx scripts/demo/cli.ts build      build without clearing first
//   tsx scripts/demo/cli.ts reset      remove every previously generated world
//   tsx scripts/demo/cli.ts validate   re-check the current world, exit 1 if broken
//   tsx scripts/demo/cli.ts accounts   print the demo login table
//
// The production guard and DB connect/disconnect live in bootstrap()/shutdown().
// Nothing here ever drops a collection: a world is removed through its own
// ledger manifest, so a database holding real data keeps it.

import { bootstrap, shutdown, log } from './db';
import { runSimulation } from './orchestrate';
import { runAnalytics } from './analytics';
import {
  resetRun,
  resetAllRuns,
  clearRetiredSeedData,
  clearOrphanedRecords,
  clearAuthThrottles,
  clearRehearsalAccounts,
} from './reset';
import { validate } from './validate';
import { DEMO_ACCOUNTS, DEMO_PASSWORDS } from './content/accounts';

function printAccounts(): void {
  log('demo accounts (sign in with the email or the username):');
  for (const a of DEMO_ACCOUNTS) {
    const password = DEMO_PASSWORDS[a.role] ?? '';
    log(`  ${a.role.padEnd(11)} ${a.email.padEnd(38)} ${password.padEnd(18)} ${a.purpose}`);
  }
}

// The whole thing, in the order a presenter needs it.
async function demo(): Promise<boolean> {
  const started = Date.now();
  await resetAllRuns();
  await clearRetiredSeedData();
  // After the runs are gone, before the new world is built: anything the last
  // demonstration created through the app is now ownerless, and this is the one
  // moment it can be told apart from data that belongs to somebody.
  await clearOrphanedRecords();
  // The signup and sign-in throttles are not in Mongo and outlive the world.
  // A rehearsed registration must not leave the form rate-limited for the demo.
  await clearAuthThrottles();
  // The account the presenter registers live is not part of the world and would
  // otherwise survive into the next build, blocking its own demonstration.
  await clearRehearsalAccounts();
  await runSimulation();
  await runAnalytics();
  const healthy = await validate();
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  if (healthy) {
    log(`demo world ready in ${seconds}s.`);
    printAccounts();
  } else {
    log(`demo world built in ${seconds}s but FAILED validation — see the failures above.`);
  }
  return healthy;
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'demo';
  await bootstrap();
  try {
    switch (command) {
      case 'demo':
        if (!(await demo())) process.exitCode = 1;
        break;
      case 'build':
        await runSimulation();
        await runAnalytics();
        break;
      case 'reset':
        if (process.argv[3]) {
          await resetRun(process.argv[3]);
        } else {
          await resetAllRuns();
          await clearRetiredSeedData();
          await clearOrphanedRecords();
          await clearAuthThrottles();
          await clearRehearsalAccounts();
        }
        break;
      case 'validate':
        if (!(await validate())) process.exitCode = 1;
        break;
      case 'accounts':
        printAccounts();
        break;
      default:
        log(`unknown command "${command}" — expected demo | build | reset | validate | accounts`);
        process.exitCode = 1;
    }
  } finally {
    await shutdown();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[demo] fatal:', err);
  process.exit(1);
});
