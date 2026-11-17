// Project-local fallback for the localhost EACCES limitation. Stills only;
// does not select a style, approve a sample, or bypass full-film review.
import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {loadProject} from '../../scripts/project.mjs';
import {prepare} from '../../scripts/prepare.mjs';
import {reserveOutput,writeJson,sha} from '../../scripts/files.mjs';
import {styleTheme} from '../../src/visual/styles.mjs';
import {previewFingerprint,previewEvidence} from '../../scripts/design-plan.mjs';
import {comparisonHtml} from '../../scripts/design-workflow.mjs';

const p=loadProject('thinking-anchors');
const round=p.visualPlan.rounds.find(r=>r.id===p.visualPlan.activeRound);
const r=p.production.representative;
const output=reserveOutput(p.id,process.argv[2]??'styles-offline-v1');
const report={schemaVersion:1,project:p.id,title:p.project.title,round:round.id,stillTime:r.stillTime,width:1920,height:1080,representative:r,fingerprint:previewFingerprint(p),renderMethod:'Offline project React scene via Chromium pipe; default localhost renderer returned EACCES',candidates:[]};
const result=await build({entryPoints:['projects/thinking-anchors/style-entry.tsx'],bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
let css='body{margin:0}';
for(const weight of [400,700]){
  const dir='node_modules/@fontsource/noto-sans-sc';
  css+=fs.readFileSync(`${dir}/${weight}.css`,'utf8').replace(/url\(\.\/([^)]*)\)/g,(_,f)=>`url(data:font/woff2;base64,${fs.readFileSync(`${dir}/${f}`).toString('base64')})`);
}
const browser=await chromium.launch({executablePath:process.env.KNOWLEDGE_VIDEO_BROWSER??'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  await page.setContent(`<html><head><style>${css}</style></head><body><div id="root"></div></body></html>`);
  await page.addScriptTag({content:result.outputFiles[0].text});
  for(const c of round.candidates){
    const {visual,capabilities}=previewEvidence(p,c),dir=path.join(output,c.id);fs.mkdirSync(dir);
    const candidate={...p,visual,theme:styleTheme(p.theme,visual)};
    const ready=prepare(candidate,dir,{from:r.from,to:r.to,designKind:'style-preview',publicRevision:`${path.basename(output)}-${c.id}`});
    const inspections=[];
    for(const t of [28,31.5,32.5,r.stillTime,37.5]){
      const frame=Math.round(t*p.timeline.fps);
      await page.evaluate(({data,frame})=>window.renderFrame(data,frame),{data:ready.data,frame});
      await page.evaluate(()=>document.fonts.ready);
      const overflow=await page.locator('[data-fit]').evaluateAll(es=>es.filter(e=>e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2).map(e=>e.textContent));
      if(overflow.length)throw Error('Text overflow: '+JSON.stringify(overflow));
      const svgText=await page.locator('svg text').evaluateAll(es=>{
        const boxes=es.filter(e=>Number(getComputedStyle(e).opacity)!==0).map(e=>({text:e.textContent,box:e.getBoundingClientRect().toJSON()}));
        const outside=boxes.filter(({box:b})=>b.x<80||b.y<235||b.right>1840||b.bottom>840).map(x=>x.text);
        const collisions=[];
        for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
          const a=boxes[i].box,b=boxes[j].box;
          if(Math.min(a.right,b.right)-Math.max(a.x,b.x)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>2)collisions.push([boxes[i].text,boxes[j].text]);
        }
        return {outside,collisions};
      });
      if(svgText.outside.length||svgText.collisions.length)throw Error('SVG text layout: '+JSON.stringify(svgText));
      inspections.push({frame,overflow,svgText});
      if(t===r.stillTime){
        const file=path.join(dir,`frame-${frame}.png`);await page.screenshot({path:file});
        ready.manifest.status='stills-rendered';ready.manifest.stillFrames=[frame];
        ready.manifest.renderMethod=report.renderMethod;ready.manifest.stillSha256=sha(file);
        writeJson(path.join(dir,'manifest.json'),ready.manifest);
      }
    }
    writeJson(path.join(dir,'layout-checks.json'),{inspections,humanListening:'not-performed',scope:'Experiment sample only; full film layout has not been checked'});
    const descriptions={night:'A 原样保留：深蓝金色双组图解。',comic:'新 B：黑色粗线、分格构图、转盘、人物和对话气泡；均为实际 React/SVG 动画。',isometric:'新 C：等距立体展台、转盘装置、共享比例尺的估计柱体与柔和阴影；均为实际 React/SVG 动画。'};
    report.candidates.push({...c,description:descriptions[c.id]??c.label,visual,capabilities,image:`${c.id}/frame-${Math.round(r.stillTime*p.timeline.fps)}.png`});
    console.log(`Rendered ${c.id}`);
  }
}finally{await browser.close();}
writeJson(path.join(output,'comparison.json'),report);
const previous=path.join('outputs',p.id,'styles-offline-v1','night','frame-1035.png');
const retained=path.join(output,'night','frame-1035.png');
if(fs.existsSync(previous)){
  const evidence={previous,previousSha256:sha(previous),currentSha256:sha(retained)};
  evidence.identical=evidence.previousSha256===evidence.currentSha256;
  writeJson(path.join(output,'retained-a-check.json'),evidence);
  if(!evidence.identical)throw Error('Retained A differs from the delivered image');
}
fs.writeFileSync(path.join(output,'index.html'),comparisonHtml(report));
const embedded={...report,candidates:report.candidates.map(c=>({...c,image:'data:image/png;base64,'+fs.readFileSync(path.join(output,c.image)).toString('base64')}))};
fs.writeFileSync(path.join(output,'comparison.html'),comparisonHtml(embedded));
console.log(output);
