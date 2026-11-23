import fs from 'node:fs';import {signReview}from'./review-signature.mjs';
const a=process.argv.slice(2),get=n=>a[a.indexOf(n)+1];
try{
 for(const n of ['--report','--evidence','--reviewer','--out'])if(!a.includes(n))throw Error('Required: --report REPORT --evidence EVIDENCE_JSON --reviewer NAME --out REVIEW_JSON');
 if(!process.env.DESIGN_REVIEW_PRIVATE_KEY)throw Error('Trusted reviewer environment must set DESIGN_REVIEW_PRIVATE_KEY to private key path');
 const r=JSON.parse(fs.readFileSync(get('--report'),'utf8')),evidence=JSON.parse(fs.readFileSync(get('--evidence'),'utf8'));
 if(!r.machinePass)throw Error('Cannot approve a machine-failed report');
 if(!r.requiredReviews.every(x=>typeof evidence[x.id]==='string'&&evidence[x.id].trim()))throw Error('Complete all required review evidence');
 const payload={fingerprint:r.fingerprint,reviewer:get('--reviewer'),decision:'approve',issuedAt:new Date().toISOString(),completed:r.requiredReviews.map(x=>x.id),evidence};
 const signed=signReview(payload,fs.readFileSync(process.env.DESIGN_REVIEW_PRIVATE_KEY,'utf8'));
 fs.writeFileSync(get('--out'),JSON.stringify(signed,null,2));console.log('Review signed; private key was not included in output.');
}catch(e){console.error(e.message);process.exitCode=2}
