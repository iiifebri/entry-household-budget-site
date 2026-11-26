// HearthLedger — entrypoint. Copies the static site (app/) and the screenshots
// into the grader's output directory and writes dossier.json with make.fun's
// buildDossier. Node 22, standard library only. Deterministic: the same repo
// writes the same bytes on every run (no timestamps, no random values, files
// copied in sorted order).
//
// Usage: node main.ts
//   The output directory is $MAKEFUN_OUTPUT_DIR, or /output when unset.

import { buildDossier } from './vendor/makefun-frontend.ts';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy a directory tree in sorted path order so the copy is stable.
function copyTree(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src).sort()) {
    const from = join(src, name);
    const to = join(dest, name);
    if (statSync(from).isDirectory()) {
      copyTree(from, to);
    } else {
      cpSync(from, to);
    }
  }
}

function main() {
  mkdirSync(outDir, { recursive: true });

  // Start from a clean output so a second run writes byte-identical files.
  rmSync(join(outDir, 'app'), { recursive: true, force: true });
  rmSync(join(outDir, 'screenshots'), { recursive: true, force: true });
  rmSync(join(outDir, 'dossier.json'), { force: true });

  copyTree(join(repoRoot, 'app'), join(outDir, 'app'));

  const shots = join(repoRoot, 'screenshots');
  if (existsSync(shots)) {
    copyTree(shots, join(outDir, 'screenshots'));
  } else {
    mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  }

  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  console.log(`HearthLedger entry written to ${outDir}`);
}

main();
