import {designCommand} from './design-workflow.mjs';
const [command,...args]=process.argv.slice(2),options={};
const allowed=new Set(['project','name','from','to','reason','time','proposal','candidate','round','note','manifest','state','viewed','listened','concurrency']);
try{
  for(let i=0;i<args.length;i+=2){const key=args[i]?.replace(/^--/,'');if(!args[i]?.startsWith('--')||!allowed.has(key)||args[i+1]===undefined||key in options)throw Error(`Invalid design option: ${args[i]}`);options[key]=args[i+1];}
  for(const k of ['viewed','listened'])if(options[k]!==undefined&&!['true','false'].includes(options[k]))throw Error(`${k} must be true or false`);
  await designCommand(command,options);
}catch(e){console.error(e.stack??e.message);process.exitCode=1;}
