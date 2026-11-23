import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
export const PACK_ROOT=base;
const reg=read(path.join(base,'components/registry.json'));
const patterns=read(path.join(base,'rules/patterns.json'));
const policy=read(path.join(base,'policy.json'));
export function checkSpec(s){
 const errors=[];const fail=(id,message)=>errors.push({id,message});
 if(!s||typeof s!=='object'||Array.isArray(s))return [{id:'S00',message:'SPEC must be an object'}];
 for(const f of ['goal','assumptions','pages','unresolved'])if(!(f in s))fail('S01','Missing '+f);
 if(typeof s.goal!=='string'||!s.goal.trim())fail('S02','goal must be non-empty');
 for(const f of ['assumptions','unresolved'])if(!Array.isArray(s[f])||s[f].some(x=>typeof x!=='string'))fail('S03',f+' must be a string array');
 if(!Array.isArray(s.pages)||!s.pages.length)return [...errors,{id:'S04',message:'pages must be a non-empty array'}];
 const ids=new Set();
 for(const p of s.pages){
  if(!p||typeof p!=='object'){fail('S05','Invalid page');continue}
  if(typeof p.id!=='string'||!p.id||ids.has(p.id))fail('S05','Missing or duplicate page id');ids.add(p.id);
  const pat=patterns.find(x=>x.id===p.pattern);
  if(!pat&&p.pattern!=='custom')fail('S06','Unknown pattern '+p.pattern);
  if(p.pattern==='custom'&&(!p.customReason||typeof p.customReason!=='string'))fail('S07','custom pattern needs customReason');
  if(pat&&!pat.variants.some(v=>v.name===p.variant))fail('S08','Unknown variant for '+p.pattern);
  if(typeof p.reason!=='string'||!p.reason.trim())fail('S09','Page needs selection reason');
  if(!Array.isArray(p.regions)||!p.regions.length){fail('S10','Page needs regions');continue}
  const regionIds=new Set();
  for(const r of p.regions){
   if(!r||typeof r!=='object'){fail('S11','Invalid region');continue}
   if(!r.id||regionIds.has(r.id))fail('S11','Missing or duplicate region id');regionIds.add(r.id);
   if(typeof r.purpose!=='string'||!r.purpose.trim())fail('S12','Region needs purpose');
   if(!['flow','sticky','fixed','overlay'].includes(r.position))fail('S13','Invalid region position');
   if(['fixed','overlay','sticky'].includes(r.position)&&!r.layoutReason)fail('S14','Position needs reason');
   if(!Array.isArray(r.components)||!r.components.length)fail('S15','Region needs components');
   else for(const c of r.components)if(!reg.components.some(x=>x.id===c))fail('S16','Component outside registry: '+c);
   for(const f of ['async','submits'])if(f in r&&typeof r[f]!=='boolean')fail('S21',f+' must be boolean');
   if(r.async===true){for(const st of ['loading','empty','failure','retry'])if(typeof r.states?.[st]!=='string'||!r.states[st].trim())fail('S17','Async region needs '+st)}
   if(r.submits===true){for(const st of ['submitting','success','failure','unknown'])if(typeof r.states?.[st]!=='string'||!r.states[st].trim())fail('S18','Submit region needs '+st)}
  }
  if(!Array.isArray(p.visualDecisions)||!p.visualDecisions.length||p.visualDecisions.some(x=>!x||!/^L0[1-5]$/.test(x.rule)||typeof x.decision!=='string'||!x.decision.trim()))fail('S22','Page needs concrete visualDecisions with L01-L05 references');
  if(!p.layout||typeof p.layout.scroll!=='string'||typeof p.layout.keyboard!=='string'||typeof p.layout.safeArea!=='string')fail('S19','Page needs scroll/keyboard/safeArea decisions');
  if(!Array.isArray(p.appliedRules)||!p.appliedRules.length||p.appliedRules.some(r=>!/^G0[1-8]$/.test(r)))fail('S20','Unknown or missing global rule reference');
 }
 return errors;
}
function walk(dir){let out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','.git'].includes(e.name))continue;const f=path.join(dir,e.name);if(e.isSymbolicLink())throw Error('Symlink not allowed in generated source: '+f);if(e.isDirectory())out.push(...walk(f));else out.push(f)}return out.sort()}
export function validate({spec,project}){
 const errors=checkSpec(spec),reviews=[{id:'REVIEW-API',message:'Confirm actual component attributes/events/slots against installed version. Not statically certified by this pack.'},{id:'REVIEW-VISUAL',message:'Confirm real MiniProgram rendering, layout, touch targets, keyboard and safe area.'},{id:'REVIEW-BEHAVIOR',message:'Confirm actions, network failure/retry, and truthful result state.'}];
 const files=[],dependencyFiles=[];let version=null;
 const fail=(id,message,file)=>errors.push({id,message,...(file?{file}: {})});
 if(!project)fail('E00','A real project is required for a release decision');
 else {
  const root=path.resolve(project);const pkgFile=path.join(root,'package.json');let pkg;
  try{pkg=read(pkgFile)}catch{fail('E01','Missing or invalid package.json')}
  const declared=pkg?.dependencies?.[policy.package];
  if(!policy.approvedVersions?.includes(declared))fail('E14','Version is not approved in trusted policy.approvedVersions');
  if(!declared||!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(declared))fail('E02','Use an exact approved tdesign-miniprogram dependency version');
  const depRoot=path.join(root,'node_modules',policy.package);
  try{version=read(path.join(depRoot,'package.json')).version;if(declared!==version)fail('E03','Installed package differs from exact declaration')}catch{fail('E04','Installed tdesign-miniprogram is required; run project dependency installation')}
  try{
   const source=walk(root);let wxml=0;
   for(const file of source){const rel=path.relative(root,file);const data=fs.readFileSync(file);files.push({path:rel,sha256:hash(data)});
    // Compiled npm output is fingerprinted, not reinterpreted as user-authored page markup.
    if(rel.split(path.sep).includes('miniprogram_npm'))continue;
    if(file.endsWith('.json')){
     let j;try{j=JSON.parse(data)}catch{fail('E05','Invalid JSON',rel);continue}
     for(const [tag,imp]of Object.entries(j.usingComponents||{})){
      const c=reg.components.find(c=>c.tag===tag);
      if(!c||imp!==c.import){fail('E06','Unapproved component mapping '+tag+' = '+imp,rel);continue}
      const componentPath=path.join(root,'node_modules',imp);
      for(const ext of ['.json','.wxml','.js','.wxss']){const f=componentPath+ext;if(fs.existsSync(f))dependencyFiles.push({path:imp+ext,sha256:hash(fs.readFileSync(f))})}
      if(!['.json','.wxml','.js'].every(ext=>fs.existsSync(componentPath+ext)))fail('E07','Component implementation not present in installed package: '+imp,rel);
     }
    }
    if(file.endsWith('.wxml')){
     wxml++;const text=data.toString('utf8').replace(/<!--[\s\S]*?-->/g,'');
     let local={},global={};try{local=read(file.slice(0,-5)+'.json').usingComponents||{}}catch{}
     try{global=read(path.join(root,'app.json')).usingComponents||{}}catch{}
     const mapped={...global,...local};
     for(const m of text.matchAll(/<([A-Za-z][\w:-]*)\b/g)){
      const tag=m[1];if(policy.forbiddenNativeAlternatives.includes(tag)){fail('E08','Use approved TDesign component instead of native '+tag,rel);continue}
      if(tag.startsWith('t-')){const c=reg.components.find(x=>x.tag===tag);if(!c||mapped[tag]!==c.import)fail('E09','Tag is not correctly registered: '+tag,rel)}
      else if(!policy.allowedNativeTags.includes(tag))fail('E10','Unknown or unapproved tag '+tag,rel);
     }
     if(/<import\b|<include\b|<template\b[^>]*\bis\s*=|<wxs\b/.test(text))fail('E11','Dynamic/external template expansion requires an explicit trusted extension to validator',rel);
    }
   }
   if(!wxml)fail('E12','No WXML source was found');
  }catch(e){fail('E13',e.message)}
 }
 const policyPaths=['policy.json','components/registry.json','rules/patterns.json','rules/global-rules.json','rules/visual-guidance.json','rules/layout-constraints.json','schema/plan-spec.schema.json','instructions.md','scripts/validate.mjs','scripts/gate.mjs','scripts/review-signature.mjs'];
 const policyDigest=hash(policyPaths.map(p=>p+'\n'+fs.readFileSync(path.join(base,p),'utf8')).join('\n'));
 const fingerprint=hash(JSON.stringify({spec,files,dependencyFiles:dependencyFiles.sort((a,b)=>a.path.localeCompare(b.path)),version,policyDigest}));
 return {machinePass:errors.length===0,releaseAllowed:false,status:errors.length?'blocked':'needs_human_review',errors,requiredReviews:reviews,version,policyDigest,fingerprint,coverage:['SPEC structure','component whitelist and canonical mappings','installed component existence','static WXML tags','exact declared/installed dependency consistency'],limitations:['Not a WXML compiler or full JavaScript/CSS analyzer','No official prop/event validation without certified API data','No pixel or behavioral guarantee','Raw native primitives can be styled into custom controls; requires review'],files,dependencyFiles};
}
export function renderMarkdown(s){
 const lines=['# UI / 交互设计','','## 用户目标',s.goal,'','## 假设',...s.assumptions.map(x=>'- '+x),''];
 for(const p of s.pages){
  lines.push('## 页面：'+p.id,'模式：'+p.pattern+' / '+(p.variant||'自定义'),'选择理由：'+p.reason,'');
  for(const r of p.regions){lines.push('### '+r.id,r.purpose,'布局：'+r.position+(r.layoutReason?'；原因：'+r.layoutReason:''),'组件：');for(const id of r.components){const c=reg.components.find(c=>c.id===id);lines.push('- '+id+' / '+c.tag+' / `'+c.import+'`；文档：'+c.doc)}if(r.async===true)lines.push('异步区域：是');if(r.submits===true)lines.push('关键提交：是');for(const[k,v]of Object.entries(r.states||{}))lines.push('- 状态 '+k+'：'+v);lines.push('');}
  lines.push('### 布局行为','滚动：'+p.layout.scroll,'键盘：'+p.layout.keyboard,'安全区：'+p.layout.safeArea,'','### 视觉决策',...p.visualDecisions.map(v=>'- '+v.rule+'：'+v.decision),'','### 生效规则',...p.appliedRules.map(x=>'- '+x));
  const pat=patterns.find(x=>x.id===p.pattern);if(pat)lines.push(...pat.rules.map(x=>'- '+x));lines.push('');
 }
 lines.push('## 待确认',...(s.unresolved.length?s.unresolved.map(x=>'- '+x):['无。仍需在实际工程核验组件API、渲染与行为；此设计文档不是发布批准。']));return lines.join('\n');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),get=n=>args[args.indexOf(n)+1];
 if(!args.includes('--spec')){console.error('node scripts/validate.mjs --spec plan-spec.json [--project /path/to/project] [--out report.json]');process.exitCode=2}
 else try{const report=validate({spec:read(get('--spec')),project:args.includes('--project')?get('--project'):undefined});if(args.includes('--out'))fs.writeFileSync(get('--out'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));process.exitCode=report.machinePass?0:1}catch(e){console.error(e.message);process.exitCode=2}
}
