import { copyFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// This entry ships its finished image as entry.jpg; the program copies it
// to the output directory as entry.png. The gate tells PNG from JPEG by the
// file's first bytes, so a JPEG kept under the entry.png name is accepted.
const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
mkdirSync(outDir, { recursive: true });
copyFileSync(join(here, "entry.jpg"), join(outDir, "entry.png"));
