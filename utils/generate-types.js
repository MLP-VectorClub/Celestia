const { GenerateTypings } = require('@seinopsys-forks/openapi-to-typescript');
const fs = require('fs');

require('dotenv').config({ path: '.env.local' });

const filePath = process.env.API_JSON_PATH;
const outputPath = 'src/types/api.ts';

(async function() {
  let schema;
  if (/^https?:\/\//.test(filePath)){
    const fetch = require('node-fetch');
    schema = await fetch(filePath).then(r => {
      if (r.status !== 200) throw new Error(r.json());
      return r.json();
    });
  } else {
    if (!fs.existsSync(filePath)){
      console.error('Missing API schema file (or API_JSON_PATH not set)');
      process.exit(1);
    }

    const jsonFile = fs.readFileSync(filePath);
    schema = JSON.parse(jsonFile);
  }

  GenerateTypings(schema).then(typings => {
    const coupleLineBreaks = new Array(19).join(' *\n');
    const discouragement = `/*\n${coupleLineBreaks} * DO NOT EDIT THIS FILE DIRECTLY! - GENERATE IT USING yarn run api:types INSTEAD\n${coupleLineBreaks} */\n`;

    fs.writeFileSync(outputPath, discouragement + '\n' + typings);
  });
})();
