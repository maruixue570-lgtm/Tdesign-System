import fs from'node:fs';import os from'node:os';import path from'node:path';import assert from'node:assert/strict';import crypto from'node:crypto';import{fileURLToPath,pathToFileURL}from'node:url';import{spawnSync}from'node:child_process';
import{checkSpec,validate}from'../scripts/validate.mjs';import{runDesignStage}from'../scripts/design-stage.mjs';import{signReview,verifyReview}from'../scripts/review-signature.mjs';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),good=JSON.parse(fs.readFileSync(path.join(base,'examples/plan-spec.json')));let count=0;const tests=[];
function test(name,fn){tests.push([name,fn])}const clone=()=>structuredClone(good);
test('Valid SPEC',()=>assert.equal(checkSpec(good).length,0));
for(const [name,mutate,id]of[
 ['Unknown component',s=>s.pages[0].regions[0].components=['Invented'],'S16'],
 ['Unknown variant',s=>s.pages[0].variant='bad','S08'],
 ['Async states',s=>s.pages[0].regions[0].async=true,'S17'],
 ['Submit outcome',s=>s.pages[0].regions[0].submits=true,'S18'],
 ['Position reason',s=>s.pages[0].regions[0].position='fixed','S14'],
 ['Duplicate page',s=>s.pages.push(s.pages[0]),'S05'],
 ['Boolean flags',s=>s.pages[0].regions[0].async='false','S21'],
 ['Unknown rule',s=>s.pages[0].appliedRules=['invented'],'S20']])test(name+' blocked',()=>{const s=clone();mutate(s);assert(checkSpec(s).some(x=>x.id===id))});
test('Project required',()=>assert(!validate({spec:good}).machinePass));
test('Design stage injects all rules',async()=>{const r=await runDesignStage({request:{prompt:'test'},generate:async c=>{assert(c.layoutRules.rules.some(x=>x.id==='L01'));assert(c.patterns.length===8);assert(c.components.components.length===65);return clone()}});assert.equal(r.status,'design_ready');assert(!r.releaseAllowed);assert(r.markdown.includes('组件'))});
test('Design repairs invalid first output',async()=>{let n=0;const r=await runDesignStage({request:{prompt:'test'},generate:async(c,f)=>{n++;if(n===1)return{};assert(f.previousErrors.length);return clone()}});assert.equal(r.history.length,2);assert.equal(r.status,'design_ready')});
test('Design repair limit',async()=>{const r=await runDesignStage({request:{prompt:'test'},generate:async()=>({})});assert.equal(r.status,'blocked');assert.equal(r.history.length,3)});
test('Model exception blocks',async()=>assert.equal((await runDesignStage({request:{prompt:'test'},generate:async()=>{throw Error('test')}})).status,'blocked'));
test('Missing business information remains unresolved',async()=>{const s=clone();s.unresolved=['服务接口待确认'];assert.equal((await runDesignStage({request:{prompt:'test'},generate:async()=>s})).status,'needs_clarification')});
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'miniapp-pack-tests-')),project=path.join(temp,'project'),pack=path.join(temp,'trusted-pack'),trusted=path.join(temp,'trusted-review');fs.mkdirSync(project);fs.mkdirSync(trusted);fs.cpSync(base,pack,{recursive:true});
const pfile=path.join(pack,'policy.json'),pol=JSON.parse(fs.readFileSync(pfile));pol.approvedVersions=['0.0.0-test'];fs.writeFileSync(pfile,JSON.stringify(pol));
const tv=await import(pathToFileURL(path.join(pack,'scripts/validate.mjs')).href);
const write=(f,v)=>fs.writeFileSync(path.join(project,f),v);const dep=path.join(project,'node_modules/tdesign-miniprogram');fs.mkdirSync(path.join(dep,'button'),{recursive:true});
write('package.json',JSON.stringify({dependencies:{'tdesign-miniprogram':'0.0.0-test'}}));fs.writeFileSync(path.join(dep,'package.json'),JSON.stringify({version:'0.0.0-test'}));for(const ext of['.json','.js','.wxml'])fs.writeFileSync(path.join(dep,'button/button'+ext),ext==='.json'?'{}':'');
write('app.json',JSON.stringify({usingComponents:{'t-button':'tdesign-miniprogram/button/button'}}));const wxml='<view><t-button>统计</t-button></view>';write('index.wxml',wxml);write('spec.json',JSON.stringify(good));
const report=()=>tv.validate({spec:good,project});
test('Real path lookup with synthetic fixture',()=>{const r=report();assert(r.machinePass);assert(!r.releaseAllowed)});
test('Unapproved version blocked',()=>assert(validate({spec:good,project}).errors.some(x=>x.id==='E14')));
for(const [name,html,id]of[['Native control','<button/>','E08'],['Unknown tag','<custom-card/>','E10'],['Undeclared component','<t-input/>','E09'],['External template','<include src="other.wxml"/>','E11']])test(name+' blocked',()=>{write('index.wxml',html);assert(report().errors.some(x=>x.id===id));write('index.wxml',wxml)});
test('Installed component edit changes fingerprint',()=>{const f=path.join(dep,'button/button.js'),before=report().fingerprint;fs.writeFileSync(f,'// changed');assert.notEqual(report().fingerprint,before);fs.writeFileSync(f,'')});
test('Compiled npm output is fingerprinted',()=>{const d=path.join(project,'miniprogram_npm');fs.mkdirSync(d);const before=report().fingerprint;fs.writeFileSync(path.join(d,'generated.js'),'// built');assert.notEqual(report().fingerprint,before);fs.rmSync(d,{recursive:true})});
test('Source edit changes fingerprint',()=>{const a=report().fingerprint;write('index.wxml','<view>changed</view>');assert.notEqual(report().fingerprint,a);write('index.wxml',wxml)});
const keys=crypto.generateKeyPairSync('ed25519'),publicKey=keys.publicKey.export({type:'spki',format:'pem'}),privateKey=keys.privateKey.export({type:'pkcs8',format:'pem'});const pub=path.join(trusted,'public.pem');fs.writeFileSync(pub,publicKey);
const payload=()=>({fingerprint:report().fingerprint,reviewer:'synthetic-test-only',decision:'approve',issuedAt:new Date().toISOString(),completed:['REVIEW-API','REVIEW-VISUAL','REVIEW-BEHAVIOR'],evidence:{'REVIEW-API':'synthetic evidence','REVIEW-VISUAL':'synthetic evidence','REVIEW-BEHAVIOR':'synthetic evidence'}});
test('Valid review signature',()=>assert.equal(verifyReview(signReview(payload(),privateKey),publicKey,report(),good),null));
test('Forged review blocked',()=>{const s=signReview(payload(),privateKey);s.payload.reviewer='forged';assert(verifyReview(s,publicKey,report(),good))});
test('Expired review blocked',()=>{const p=payload();p.issuedAt='2000-01-01T00:00:00Z';assert(verifyReview(signReview(p,privateKey),publicKey,report(),good))});
test('Missing evidence blocked',()=>{const p=payload();delete p.evidence['REVIEW-VISUAL'];assert(verifyReview(signReview(p,privateKey),publicKey,report(),good))});
const gateArgs=[path.join(pack,'scripts/gate.mjs'),'--spec',path.join(project,'spec.json'),'--project',project];
test('Gate blocks without review',()=>assert.equal(spawnSync(process.execPath,gateArgs,{encoding:'utf8'}).status,1));
test('Gate accepts signed fixture review with trusted key',()=>{const f=path.join(trusted,'review.json');fs.writeFileSync(f,JSON.stringify(signReview(payload(),privateKey)));const r=spawnSync(process.execPath,[...gateArgs,'--review',f],{encoding:'utf8',env:{...process.env,DESIGN_REVIEW_PUBLIC_KEY:pub}});assert.equal(r.status,0,r.stdout+r.stderr)});
test('Gate blocks changed code after review',()=>{const f=path.join(trusted,'old-review.json');fs.writeFileSync(f,JSON.stringify(signReview(payload(),privateKey)));write('index.wxml','<view>new code</view>');const r=spawnSync(process.execPath,[...gateArgs,'--review',f],{encoding:'utf8',env:{...process.env,DESIGN_REVIEW_PUBLIC_KEY:pub}});assert.equal(r.status,1);write('index.wxml',wxml)});
try{for(const[n,fn]of tests){await fn();count++;console.log('PASS '+n)}console.log(`${count} tests passed. Dependency, review and model fixtures are synthetic; no real API or visual acceptance claimed.`)}finally{fs.rmSync(temp,{recursive:true,force:true})}
