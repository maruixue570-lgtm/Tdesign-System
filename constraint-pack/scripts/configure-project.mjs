// Maintainer-only operation: approve an installed, exact version. Do not expose this command to generation agents.
import fs from 'node:fs';import path from 'node:path';import {PACK_ROOT}from'./validate.mjs';
const a=process.argv.slice(2),get=n=>a[a.indexOf(n)+1];
try{
 if(!a.includes('--project')||!a.includes('--approve-version'))throw Error('Use --project PROJECT --approve-version EXACT_VERSION');
 const root=path.resolve(get('--project')),version=get('--approve-version');
 if(!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version))throw Error('Exact version required');
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')),installed=JSON.parse(fs.readFileSync(path.join(root,'node_modules/tdesign-miniprogram/package.json'),'utf8'));
 if(pkg.dependencies?.['tdesign-miniprogram']!==version||installed.version!==version)throw Error('Declared and installed versions must exactly match approval');
 const f=path.join(PACK_ROOT,'policy.json'),policy=JSON.parse(fs.readFileSync(f,'utf8'));policy.approvedVersions=[...new Set([...policy.approvedVersions,version])];policy.configurationStatus='version_approved_by_maintainer';fs.writeFileSync(f,JSON.stringify(policy,null,2));console.log('Approved exact installed version: '+version);
}catch(e){console.error(e.message);process.exitCode=2}
