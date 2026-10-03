import process from 'node:process';
import { pathToFileURL } from 'node:url';

const USAGE = [
  'Cách dùng:',
  '  npm run case:build -- <case-id> [--check]   biên dịch dialogues/*.yaml -> dialogues.json',
  '  npm run case:import -- <case-id> [--force]  chuyển dialogues.json cũ sang YAML',
].join('\n');

/**
 * @param {string[]} argv
 * @param {{ cwd?: string; out?: (s: string) => void; err?: (s: string) => void }} [env]
 * @returns {Promise<number>} exit code
 */
export async function run(argv, env = {}) {
  const out = env.out ?? ((s) => process.stdout.write(`${s}\n`));
  const err = env.err ?? ((s) => process.stderr.write(`${s}\n`));
  if (argv.includes('--help') || argv.includes('-h')) {
    out(USAGE);
    return 0;
  }
  const [command, caseId] = argv;
  if (command !== 'build' && command !== 'import') {
    err(`Lệnh không hợp lệ: ${command ?? '(trống)'}\n${USAGE}`);
    return 1;
  }
  if (!caseId || caseId.startsWith('--')) {
    err(`Thiếu <case-id>.\n${USAGE}`);
    return 1;
  }
  err(`${command} ${caseId}: chưa cài đặt`);
  return 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = await run(process.argv.slice(2));
}
