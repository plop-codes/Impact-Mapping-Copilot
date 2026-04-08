import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pluginBuild = build({
  entryPoints: [path.resolve(__dirname, 'src/plugin.ts')],
  bundle: true,
  outfile: path.resolve(__dirname, 'dist/code.js'),
  format: 'iife',
  target: 'es2017',
  alias: {
    '@src': path.resolve(__dirname, 'src'),
  },
});

const uiBuild = build({
  entryPoints: [path.resolve(__dirname, 'src/ui/ui.ts')],
  bundle: true,
  write: false,
  format: 'iife',
  target: 'es2017',
  alias: {
    '@src': path.resolve(__dirname, 'src'),
  },
});

Promise.all([pluginBuild, uiBuild]).then(([, uiResult]) => {
  const uiJs = uiResult.outputFiles[0].text;
  const htmlTemplate = readFileSync(
    path.resolve(__dirname, 'src/ui.html'),
    'utf-8',
  );
  const finalHtml = htmlTemplate.replace(
    '<!-- {{SCRIPT}} -->',
    `<script>${uiJs}</script>`,
  );
  writeFileSync(path.resolve(__dirname, 'dist/ui.html'), finalHtml);
}).catch(() => process.exit(1));
