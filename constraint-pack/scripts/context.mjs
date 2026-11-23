import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function loadContext(request){
 if(!request||typeof request.prompt!=='string'||!request.prompt.trim())throw Error('request.prompt is required');
 const json=p=>JSON.parse(fs.readFileSync(path.join(base,p),'utf8'));
 // Eight patterns are small enough to send in full. Avoid losing relevant patterns through naive keyword routing.
 return {instructions:fs.readFileSync(path.join(base,'instructions.md'),'utf8'),policy:json('policy.json'),components:json('components/registry.json'),patterns:json('rules/patterns.json'),globalRules:json('rules/global-rules.json'),visualRules:json('rules/visual-guidance.json'),layoutRules:json('rules/layout-constraints.json'),outputSchema:json('schema/plan-spec.schema.json'),request};
}
