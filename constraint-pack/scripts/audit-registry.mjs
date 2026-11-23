// Uses real installed package bytes to resolve registry entries; never certifies APIs automatically.
import fs from 'node:fs';import path from 'node:path';import {PACK_ROOT}from'./validate.mjs';
const a=process.argv.slice(2),get=n=>a[a.indexOf(n)+1];
try{if(!a.includes('--project'))throw Error('Use --project PROJECT [--out REPORT]');
 const root=path.resolve(get('--project')),pkg=JSON.parse(fs.readFileSync(path.join(root,'node_modules/tdesign-miniprogram/package.json'),'utf8'));
 const reg=JSON.parse(fs.readFileSync(path.join(PACK_ROOT,'components/registry.json'),'utf8'));
 const components=reg.components.map(c=>({id:c.id,tag:c.tag,import:c.import,resolved:['.json','.js','.wxml'].every(ext=>fs.existsSync(path.join(root,'node_modules',c.import+ext))),apiStatus:'manual_review_required'}));
 const result={installedVersion:pkg.version,components,missing:components.filter(c=>!c.resolved).map(c=>c.id),note:'Missing entries remain blocked when used; this report does not approve any version or API.'};
 if(a.includes('--out'))fs.writeFileSync(get('--out'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));process.exitCode=result.missing.length?1:0;
}catch(e){console.error(e.message);process.exitCode=2}
