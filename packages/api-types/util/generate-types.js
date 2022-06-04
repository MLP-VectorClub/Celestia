const { GenerateTypings } = require('@seinopsys-forks/openapi-to-typescript');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

require('dotenv').config({ path: '.env.local' });

const filePath = process.env.API_JSON_PATH;
const outputDir = 'dist';
const outputFileName = 'index.d.ts';

(async function () {
  if (fs.existsSync(outputDir)) {
    console.log('Build output directory already exists, clearing…');
    rimraf.sync(outputDir);
  }

  console.log('Creating output folder…');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, outputFileName);

  let schema;
  if (/^https?:\/\//.test(filePath)) {
    const fetch = require('node-fetch');
    console.log(`Downloading API schema from ${filePath}…`);
    schema = await fetch(filePath).then((r) => {
      if (r.status !== 200) throw new Error(r.json());
      return r.json();
    });
    console.log('API schema successfully downloaded');
  } else {
    if (!fs.existsSync(filePath)) {
      console.error('Missing API schema file (or API_JSON_PATH not set)');
      process.exit(1);
    }

    console.log(`Reading API schema from ${filePath}…`);
    const jsonFile = fs.readFileSync(filePath).toString();
    schema = JSON.parse(jsonFile);
    console.log('API schema successfully read');
  }

  console.log('Generating type definitions…');
  const typings = await GenerateTypings(schema);
  const buildHeader = `// MLP-VectorClub API type definition - built on ${new Date().toISOString()}\n`;

  fs.writeFileSync(outputPath, buildHeader + '\n' + typings);

  console.log(`Written API type definitions to ${outputPath}`);
})();
