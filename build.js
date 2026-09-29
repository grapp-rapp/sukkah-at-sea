// Concatenates src/ into a single self-contained HTML page.
//   node build.js   ->  index.html (open directly in a browser) + dist/sukkah-boat.html (artifact body)
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const THREE_VER = '0.169.0';
const files = fs.readdirSync(SRC).sort();
const head = fs.readFileSync(path.join(SRC, files.find((f) => f.endsWith('.html'))), 'utf8');
const js = files.filter((f) => f.endsWith('.js')).map((f) => `// ==== ${f}\n` + fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n');

const importmap = `<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@${THREE_VER}/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@${THREE_VER}/examples/jsm/"
} }
</script>`;
const script = `<script type="module">\n${js}\n</script>`;

const split = head.indexOf('</style>') + '</style>'.length;
const headPart = head.slice(0, split), bodyPart = head.slice(split);

const full = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n${headPart}\n${importmap}\n</head>\n<body>\n${bodyPart}\n${script}\n</body>\n</html>\n`;
fs.writeFileSync(path.join(__dirname, 'index.html'), full);
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'sukkah-boat.html'), `${headPart}\n${importmap}\n${bodyPart}\n${script}\n`);
console.log(`built index.html (${(full.length / 1024).toFixed(0)} KB) from ${files.length} files`);
