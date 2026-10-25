// Explicit standalone Cloudflare deployment; Sites publishing does not run this.
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const wrangler=resolve(root,'node_modules/wrangler/bin/wrangler.js');
function run(args,capture=false){
 const r=spawnSync(process.execPath,[wrangler,...args],{cwd:root,encoding:'utf8',stdio:capture?['ignore','pipe','inherit']:'inherit'});
 if(r.error)throw r.error;
 if(r.status!==0)throw new Error(`Wrangler ${args[0]} failed. Check the Cloudflare build token has Workers and D1 permissions.`);
 return r.stdout;
}
function databases(){return JSON.parse(run(['d1','list','--json'],true));}
const name='nasikandartycoon-db';
let matches=databases().filter(d=>d.name===name);
if(!matches.length){run(['d1','create',name]);matches=databases().filter(d=>d.name===name);}
if(matches.length!==1||!matches[0].uuid)throw new Error('Cannot resolve the dedicated Nasi Kandar Tycoon database.');
const config=JSON.parse(readFileSync(resolve(root,'wrangler.jsonc'),'utf8'));
config.main=resolve(root,config.main);config.assets.directory=resolve(root,config.assets.directory);
config.d1_databases[0].database_id=matches[0].uuid;
config.d1_databases[0].migrations_dir=resolve(root,'drizzle');
const dir=resolve(root,'.cloudflare-deploy');mkdirSync(dir,{recursive:true});
const path=resolve(dir,'wrangler.json');writeFileSync(path,JSON.stringify(config,null,2));
run(['d1','migrations','apply','DB','--remote','--config',path]);
run(['deploy','--config',path]);
