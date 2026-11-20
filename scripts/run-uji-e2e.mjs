import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
if (process.versions.node.split('.')[0]!=='22') throw new Error('BLOCKED: gunakan Node.js22.');
if(process.env.SIRIS_UJI_ENV_FILE) Object.assign(process.env,JSON.parse(readFileSync(process.env.SIRIS_UJI_ENV_FILE,'utf8')));
const result=spawnSync('npm',['exec','--','playwright','test'],{env:{...process.env,NODE_ENV:'test'},stdio:'inherit'});
process.exit(result.status??1);
