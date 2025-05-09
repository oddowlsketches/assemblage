// find-unused-files.mjs
// Scans src/** for .ts, .tsx, .js, .jsx, .html files and lists any with zero inbound imports.
// Excludes /legacy, /tools, storybook, tests, and tailwind config.
import { promises as fs } from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const SRC_DIR = path.resolve(__dirname, '../src');
const EXCLUDE_DIRS = [
  'legacy',
  'tools',
  'storybook',
  '__tests__',
  'test',
  'tests',
  'tailwind',
];
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.html'];
const OUTPUT_PATH = path.resolve(__dirname, './unused-files.json');

async function walk(dir) {
  let files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.some(ex => entry.name.toLowerCase().includes(ex))) continue;
      files = files.concat(await walk(path.join(dir, entry.name)));
    } else {
      if (FILE_EXTENSIONS.includes(path.extname(entry.name))) {
        files.push(path.join(dir, entry.name));
      }
    }
  }
  return files;
}

function normalizeImportPath(importPath, importerPath) {
  if (importPath.startsWith('.')) {
    // Relative import
    return path.normalize(path.resolve(path.dirname(importerPath), importPath));
  }
  // Ignore node_modules or aliased imports
  return null;
}

async function main() {
  const allFiles = await walk(SRC_DIR);
  const importMap = new Map(); // file -> Set(importedBy)
  allFiles.forEach(f => importMap.set(f, new Set()));

  // Scan all files for import statements
  for (const file of allFiles) {
    const content = await fs.readFile(file, 'utf8');
    // Find ES6 imports
    const importRegex = /import\s+(?:[^'";]+from\s+)?["']([^"']+)["']/g;
    // Find require()
    const requireRegex = /require\(["']([^"']+)["']\)/g;
    // Find HTML <script src="...">
    const scriptRegex = /<script[^>]+src=["']([^"']+)["']/g;
    let match;
    while ((match = importRegex.exec(content))) {
      const importPath = match[1];
      const resolved = normalizeImportPath(importPath, file);
      if (resolved) {
        for (const ext of FILE_EXTENSIONS) {
          let candidate = resolved + ext;
          if (importMap.has(candidate)) {
            importMap.get(candidate).add(file);
          }
        }
        // Also check for index files
        let candidate = path.join(resolved, 'index.js');
        if (importMap.has(candidate)) importMap.get(candidate).add(file);
        candidate = path.join(resolved, 'index.ts');
        if (importMap.has(candidate)) importMap.get(candidate).add(file);
      }
    }
    while ((match = requireRegex.exec(content))) {
      const importPath = match[1];
      const resolved = normalizeImportPath(importPath, file);
      if (resolved) {
        for (const ext of FILE_EXTENSIONS) {
          let candidate = resolved + ext;
          if (importMap.has(candidate)) {
            importMap.get(candidate).add(file);
          }
        }
        let candidate = path.join(resolved, 'index.js');
        if (importMap.has(candidate)) importMap.get(candidate).add(file);
        candidate = path.join(resolved, 'index.ts');
        if (importMap.has(candidate)) importMap.get(candidate).add(file);
      }
    }
    if (file.endsWith('.html')) {
      while ((match = scriptRegex.exec(content))) {
        const importPath = match[1];
        const resolved = normalizeImportPath(importPath, file);
        if (resolved) {
          for (const ext of FILE_EXTENSIONS) {
            let candidate = resolved + ext;
            if (importMap.has(candidate)) {
              importMap.get(candidate).add(file);
            }
          }
        }
      }
    }
  }

  // Find files with zero inbound imports
  const unusedFiles = [];
  for (const [file, importedBy] of importMap.entries()) {
    if (importedBy.size === 0) {
      unusedFiles.push(path.relative(SRC_DIR, file));
    }
  }

  // Write report
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(unusedFiles, null, 2), 'utf8');
  console.log(`Unused files report written to ${OUTPUT_PATH}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 