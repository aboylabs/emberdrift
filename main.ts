// Emberdrift — entry program for make.fun best-game-01.
//
// What this program does, in plain terms: it takes the finished game that
// lives next to this file (game/ plus screenshots/) and hands it to the
// grader by laying an identical copy into the output directory and writing
// the dossier the judge reads there. It uses only the Node standard library
// and the kit's vendored dossier builder; it never touches the network, the
// clock, or any random source, so running it twice over the same repository
// always produces the same bytes.
//
// Run it outside the grader like this:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Inside the grader MAKEFUN_OUTPUT_DIR is unset and the output goes to
// /output, as the competition requires.

import { copyFileSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The folder holding this file is the repository root: game/ and
// screenshots/ sit beside main.ts, and vendor/makefun-game.ts too.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));

// The grader gives us /output; a local run points somewhere else through
// the environment instead, so the same file works in both places.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps, copied from the competition rules: the dossier text is
// capped at 160 KiB, at most four screenshots of at most 256 KiB each, and
// game/ holds at most 993 files/directories, 48 MiB in all, with no path
// longer than 1000 bytes. buildDossier refuses anything over these, which
// is exactly what we want — a bad entry should fail loudly here, not pass
// silently and get a zero from the scorer.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
} as const;

// Copy one directory tree, file by file, visiting entries in sorted order.
// Sorting keeps the walk deterministic, and skipping dotfiles keeps editor
// droppings (for example .DS_Store) out of the handed-in copy. Symlinks are
// refused: the scorer only accepts plain files and directories.
function copyTreeSorted(sourceDir: string, targetDir: string): void {
  mkdirSync(targetDir, { recursive: true });
  const entries = readdirSync(sourceDir).sort();
  for (const name of entries) {
    if (name.startsWith('.')) continue;
    const from = join(sourceDir, name);
    const to = join(targetDir, name);
    const info = statSync(from);
    if (info.isDirectory()) {
      copyTreeSorted(from, to);
    } else if (info.isFile()) {
      copyFileSync(from, to);
    } else {
      throw new Error(`refusing to copy ${from}: not a plain file or directory`);
    }
  }
}

// 1. The game itself: every static file under game/, index.html included.
copyTreeSorted(join(repoRoot, 'game'), join(outputDir, 'game'));

// 2. The screenshots, when the folder exists. An empty screenshots folder
// still leaves an empty folder in the output, which buildDossier reads as
// "no screenshots" rather than a missing directory.
copyTreeSorted(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));

// 3. The dossier: built from the copied files, never from the repository
// directly, so the dossier always describes exactly what was handed in.
const dossier = buildDossier(outputDir, DOSSIER_CAPS);
writeFileSync(join(outputDir, 'dossier.json'), dossier);
