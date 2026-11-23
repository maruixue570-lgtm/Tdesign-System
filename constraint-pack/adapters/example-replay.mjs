// OFFLINE TEST ADAPTER. Replays a fixed example; it does not understand new user prompts.
import fs from 'node:fs';
export async function generate(){return JSON.parse(fs.readFileSync(new URL('../examples/plan-spec.json',import.meta.url),'utf8'))}
