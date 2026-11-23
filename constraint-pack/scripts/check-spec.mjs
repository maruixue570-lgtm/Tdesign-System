import fs from 'node:fs';import {checkSpec,renderMarkdown} from './validate.mjs';
const a=process.argv.slice(2),get=n=>a[a.indexOf(n)+1];
try{if(!a.includes('--spec'))throw Error('Use --spec plan-spec.json [--md ui-interaction.md]');const s=JSON.parse(fs.readFileSync(get('--spec'),'utf8'));const errors=checkSpec(s);console.log(JSON.stringify({structurePass:!errors.length,releaseAllowed:false,errors},null,2));if(!errors.length&&a.includes('--md'))fs.writeFileSync(get('--md'),renderMarkdown(s));process.exitCode=errors.length?1:0}catch(e){console.error(e.message);process.exitCode=2}
