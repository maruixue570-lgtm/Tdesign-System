import fs from 'node:fs';import path from 'node:path';
import {validate,renderMarkdown,PACK_ROOT}from'./validate.mjs';import {verifyReview}from'./review-signature.mjs';
const a=process.argv.slice(2),get=n=>a[a.indexOf(n)+1];
if(!a.includes('--spec')||!a.includes('--project')){console.error('node scripts/gate.mjs --spec SPEC --project PROJECT [--review SIGNED_REVIEW] [--out REPORT]');process.exit(2)}
try{
 const spec=JSON.parse(fs.readFileSync(get('--spec'),'utf8')),policy=JSON.parse(fs.readFileSync(path.join(PACK_ROOT,'policy.json'),'utf8'));
 const report=validate({spec,project:get('--project')});
 if(report.machinePass&&a.includes('--review')){
  if(!process.env.DESIGN_REVIEW_PUBLIC_KEY)report.reviewError='Trusted host must configure DESIGN_REVIEW_PUBLIC_KEY';
  else {const signed=JSON.parse(fs.readFileSync(get('--review'),'utf8'));const error=verifyReview(signed,fs.readFileSync(process.env.DESIGN_REVIEW_PUBLIC_KEY,'utf8'),report,spec,policy.reviewMaxAgeHours);if(error)report.reviewError=error;else{report.releaseAllowed=true;report.status='approved_with_signed_review'}}
 }
 if(a.includes('--out'))fs.writeFileSync(get('--out'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
 if(report.releaseAllowed&&a.includes('--md'))fs.writeFileSync(path.resolve(get('--md')),renderMarkdown(spec));
 process.exitCode=report.releaseAllowed?0:1;
}catch(e){console.error(e.message);process.exitCode=2}
