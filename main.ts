import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const repositoryDirectory = process.cwd();
const outputDirectory = process.env.MAKEFUN_OUTPUT_DIR || '/output';

await mkdir(outputDirectory, { recursive: true });
await copyFile(join(repositoryDirectory, 'entry.jpg'), join(outputDirectory, 'entry.png'));
