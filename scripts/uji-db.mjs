import pg from 'pg';
import {randomBytes} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync,existsSync,unlinkSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const stateFile = 'test-results/uji-container.json';
const envFile = 'test-results/uji-env.json';
const command = process.argv[2];
const docker = (args) => {
  const result=spawnSync('docker',args,{encoding:'utf8'});
  if (result.status!==0) throw new Error('UJI_DOCKER_FAILED');
  return result.stdout.trim();
};
async function main() {
  if (command==='down') {
    if (!existsSync(stateFile)) return;
    const {id}=JSON.parse(readFileSync(stateFile,'utf8'));
    if (!/^[a-f0-9]{64}$/.test(id)) throw new Error('UJI_CONTAINER_ID_INVALID');
    const label=docker(['inspect','--format','{{ index .Config.Labels "siris-uji" }}',id]);
    if (label!=='SRS-54') throw new Error('UJI_CONTAINER_OWNERSHIP_INVALID');
    docker(['stop',id]);
    for (const file of [stateFile,envFile,'test-results/uji-postgres.env']) if (existsSync(file)) unlinkSync(file);
    console.log('Container UJI milik harness dihentikan.'); return;
  }
  if (command!=='up' || existsSync(stateFile)) throw new Error('UJI_START_REQUIRES_NEW_ISOLATED_CONTAINER');
  mkdirSync('test-results',{recursive:true});
  const adminPassword=randomBytes(32).toString('hex');
  const passwords={siris_migrator:randomBytes(32).toString('hex'),siris_app:randomBytes(32).toString('hex')};
  if (process.env.GITHUB_ACTIONS) for (const password of [adminPassword,...Object.values(passwords)]) console.log(`::add-mask::${password}`);
  writeFileSync('test-results/uji-postgres.env',`POSTGRES_PASSWORD=${adminPassword}\n`,{mode:0o600});
  const id=docker(['run','--rm','--detach','--label','siris-uji=SRS-54','--env-file','test-results/uji-postgres.env','--publish','127.0.0.1:55432:5432','postgres:16.6']);
  writeFileSync(stateFile,JSON.stringify({id}),{mode:0o600});
  let admin;
  for(let attempt=0;attempt<30;attempt+=1) {
    const client=new pg.Client({host:'127.0.0.1',port:55432,database:'postgres',user:'postgres',password:adminPassword,connectionTimeoutMillis:1000});
    try {await client.connect();admin=client;break;} catch {await client.end().catch(()=>{});await new Promise((done)=>setTimeout(done,500));}
  }
  if (!admin) throw new Error('UJI_POSTGRES_UNAVAILABLE');
  try {
    const {rows}=await admin.query("SELECT current_setting('server_version_num') AS version");
    if(rows[0].version!=='160006') throw new Error('UJI_POSTGRES_VERSION_INVALID');
    for(const [role,password] of Object.entries(passwords)) await admin.query(`CREATE ROLE ${role} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD '${password}'`);
    await admin.query('CREATE DATABASE siris_uji OWNER siris_migrator');
  } finally {await admin.end();}
  const bootstrap=new pg.Client({host:'127.0.0.1',port:55432,database:'siris_uji',user:'postgres',password:adminPassword});
  await bootstrap.connect();
  try {
    await bootstrap.query('REVOKE ALL ON DATABASE siris_uji FROM PUBLIC');
    await bootstrap.query('GRANT CONNECT ON DATABASE siris_uji TO siris_migrator,siris_app');
    await bootstrap.query('REVOKE CREATE ON SCHEMA public FROM PUBLIC');
    await bootstrap.query('GRANT USAGE ON SCHEMA public TO siris_app');
    await bootstrap.query('CREATE EXTENSION "uuid-ossp"');
    await bootstrap.query('ALTER DEFAULT PRIVILEGES FOR ROLE siris_migrator IN SCHEMA public GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO siris_app');
  } finally {await bootstrap.end();}
  const url=(role)=>{
    const value=new URL('postgresql://127.0.0.1:55432/siris_uji');
    value.username=role;value.password=passwords[role];return value.href;
  };
  writeFileSync(envFile,JSON.stringify({DATABASE_URL:url('siris_app'),DATABASE_MIGRATION_URL:url('siris_migrator')}),{mode:0o600});
  console.log('PostgreSQL16.6 UJI siap; dua role non-admin; credential privat tidak dicetak.');
}
main().catch(()=>{console.error('UJI_DB_PROVISION_FAILED: periksa Docker/port/versi; hentikan hanya container milik harness melalui test:db:down.');process.exitCode=1;});
