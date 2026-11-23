import crypto from 'node:crypto';
export function canonical(value){if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';return JSON.stringify(value)}
export function signReview(payload,privateKey){return {payload,algorithm:'Ed25519',signature:crypto.sign(null,Buffer.from(canonical(payload)),privateKey).toString('base64')}}
export function verifyReview(signed,publicKey,report,spec,maxAgeHours=168){
 try{
  if(signed.algorithm!=='Ed25519'||!crypto.verify(null,Buffer.from(canonical(signed.payload)),publicKey,Buffer.from(signed.signature,'base64')))return 'Invalid review signature';
  const p=signed.payload;if(p.fingerprint!==report.fingerprint)return 'Review does not match current source/spec/policy';
  const age=Date.now()-Date.parse(p.issuedAt);if(!Number.isFinite(age)||age< -300000||age>maxAgeHours*3600000)return 'Review expired or timestamp invalid';
  if(typeof p.reviewer!=='string'||!p.reviewer.trim()||p.decision!=='approve')return 'Missing reviewer or positive decision';
  if(spec.unresolved?.length)return 'SPEC still has unresolved items';
  if(!report.requiredReviews.every(x=>p.completed?.includes(x.id)&&typeof p.evidence?.[x.id]==='string'&&p.evidence[x.id].trim()))return 'Required review evidence is incomplete';
  return null;
 }catch{return 'Malformed review or key'}
}
