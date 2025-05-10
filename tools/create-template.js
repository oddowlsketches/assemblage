#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function toPascalCase(str) {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/(?:^|\s)(\w)/g, (_, c) => c ? c.toUpperCase() : '')
    .replace(/\s+/g, '');
}

const templateKey = process.argv[2];
if (!templateKey) {
  console.error('Usage: node tools/create-template.js <templateKey>');
  process.exit(1);
}

const baseDir = path.join(__dirname, '../assemblage-web/src/templates', templateKey);
if (fs.existsSync(baseDir)) {
  console.error(`Directory already exists: ${baseDir}`);
  process.exit(1);
}

fs.mkdirSync(baseDir, { recursive: true });

const pascalName = toPascalCase(templateKey);

const drawTs = `// ${templateKey}/draw.ts\n// Pure render function for the ${templateKey} template\n\nexport function draw${pascalName}(ctx, params) {\n  // TODO: Implement rendering logic\n  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);\n  // ...\n}\n`;

const paramsTs = `// ${templateKey}/params.ts\n// Parameter interface and defaults for the ${templateKey} template\n\nexport interface ${pascalName}Params {\n  // TODO: Define parameters\n  exampleParam: number;\n}\n\nexport const default${pascalName}Params: ${pascalName}Params = {\n  exampleParam: 1,\n};\n`;

const uiTsx = `// ${templateKey}/ui.tsx\n// Control panel snippet for the ${templateKey} template\n\nimport React from 'react';\nimport { ${pascalName}Params } from './params';\n\ninterface Props {\n  params: ${pascalName}Params;\n  onChange: (params: Partial<${pascalName}Params>) => void;\n}\n\nexport default function ${pascalName}Controls({ params, onChange }: Props) {\n  return (\n    <div>\n      <label>Example Param:</label>\n      <input\n        type="number"\n        value={params.exampleParam}\n        onChange={e => onChange({ exampleParam: Number(e.target.value) })}\n      />\n    </div>\n  );\n}\n`;

fs.writeFileSync(path.join(baseDir, 'draw.ts'), drawTs);
fs.writeFileSync(path.join(baseDir, 'params.ts'), paramsTs);
fs.writeFileSync(path.join(baseDir, 'ui.tsx'), uiTsx);

console.log(`Template '${templateKey}' scaffolded at ${baseDir}`); 