import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The entry image lives beside this program; copy it to the output
// directory as entry.png (the name stays entry.png for a JPEG too).
const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
await mkdir(outDir, { recursive: true });
await copyFile(join(here, "entry.jpg"), join(outDir, "entry.png"));
