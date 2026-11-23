import fs from 'node:fs';import path from 'node:path';import {pathToFileURL,fileURLToPath}from'node:url';
import {loadContext}from'./context.mjs';import{checkSpec,renderMarkdown}from'./validate.mjs';
export async function runDesignStage({request,generate,maxAttempts=3}){
 if(typeof generate!=='function')throw Error('Host must supply a generate(context, feedback) adapter');
 const context=loadContext(request),history=[];
 for(let attempt=1;attempt<=Math.max(1,Math.min(maxAttempts,3));attempt++){
  let spec,errors;
  try{spec=await generate(context,{attempt,previousErrors:history.at(-1)?.errors||[],previousSpec:history.at(-1)?.spec||null});errors=checkSpec(spec)}
  catch(e){errors=[{id:'GENERATION',message:e.message}]}
  history.push({attempt,spec:spec??null,errors});
  if(!errors.length){const needsClarification=spec.unresolved.length>0;return {status:needsClarification?'needs_clarification':'design_ready',releaseAllowed:false,spec,markdown:renderMarkdown(spec),history}}
 }
 return {status:'blocked',releaseAllowed:false,spec:history.at(-1)?.spec,history};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const a=process.argv.slice(2),get=n=>a[a.indexOf(n)+1];
 try{
  for(const n of ['--request','--adapter','--out'])if(!a.includes(n))throw Error('node scripts/design-stage.mjs --request request.json --adapter HOST_ADAPTER.mjs --out OUTPUT_DIR');
  const request=JSON.parse(fs.readFileSync(get('--request'),'utf8'));
  const adapter=await import(pathToFileURL(path.resolve(get('--adapter'))).href);
  const result=await runDesignStage({request,generate:adapter.generate});const out=path.resolve(get('--out'));fs.mkdirSync(out,{recursive:true});
  if(result.spec)fs.writeFileSync(path.join(out,'plan-spec.json'),JSON.stringify(result.spec,null,2));
  if(result.markdown)fs.writeFileSync(path.join(out,'ui-interaction.md'),result.markdown);
  // Do not retain raw user prompt or model response except SPEC in this local run output.
  fs.writeFileSync(path.join(out,'design-report.json'),JSON.stringify({status:result.status,releaseAllowed:false,attempts:result.history.map(h=>({attempt:h.attempt,errors:h.errors}))},null,2));
  console.log(JSON.stringify({status:result.status,releaseAllowed:false,attempts:result.history.length,out},null,2));process.exitCode=result.status==='design_ready'?0:1;
 }catch(e){console.error(e.message);process.exitCode=2}
}
