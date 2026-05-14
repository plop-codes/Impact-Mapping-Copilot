#!/usr/bin/env node
const { runCli, readStdin } = require('../dist/cli.js');

(async () => {
  const stdinJson = await readStdin();
  const { exitCode, output } = await runCli(stdinJson);
  process.stdout.write(output + '\n');
  process.exit(exitCode);
})();
