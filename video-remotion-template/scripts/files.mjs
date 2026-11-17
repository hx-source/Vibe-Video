import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const json = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
export const sha = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
export function writeJson(file, value) { fs.mkdirSync(path.dirname(file), {recursive:true}); fs.writeFileSync(file, JSON.stringify(value,null,2)+'\n'); }
export function inside(root, name) {
  if (typeof name !== 'string' || !name || path.isAbsolute(name) || name.includes('\\') || name.includes(':')) throw Error(`Expected relative forward-slash path: ${name}`);
  const target = path.resolve(root,name), relative = path.relative(root,target);
  if (relative === '..' || relative.startsWith('..'+path.sep) || path.isAbsolute(relative)) throw Error(`Path escapes root: ${name}`);
  let existing = target;
  while (!fs.existsSync(existing)) existing = path.dirname(existing);
  const actual = path.relative(fs.realpathSync(root), fs.realpathSync(existing));
  if (actual === '..' || actual.startsWith('..'+path.sep) || path.isAbsolute(actual)) throw Error(`Linked path escapes root: ${name}`);
  return target;
}
export function reserveOutput(id, name) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) throw Error('Output name must contain lowercase letters, digits, hyphens');
  const output = inside(ROOT,`outputs/${id}/${name}`);
  if (fs.existsSync(output)) throw Error(`Output already exists; use another --name: ${name}`);
  fs.mkdirSync(output,{recursive:true}); return output;
}
export function engineSources(){
  const files={};
  function walk(relative){for(const entry of fs.readdirSync(path.join(ROOT,relative),{withFileTypes:true})){
    const name=`${relative}/${entry.name}`;
    if(entry.isDirectory())walk(name);else if(/\.(tsx?|mjs|js|json|css|html|html)$/.test(name))files[name]=sha(path.join(ROOT,name));
  }}
  walk('src');walk('scripts');
  for(const name of ['package.json','package-lock.json','tsconfig.json','remotion.config.ts'])files[name]=sha(path.join(ROOT,name));
  return files;
}
