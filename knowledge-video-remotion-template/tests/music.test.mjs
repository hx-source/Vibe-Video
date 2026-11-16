import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {analyzeSamples,beatGrid,applyMusicTiming,checkMusicSync} from '../scripts/music.mjs';
import {musicReviewHtml} from '../scripts/music-review.mjs';
const analysis={duration:12,bpm:120,beats:Array.from({length:24},(_,i)=>i/2),beatsPerBar:4,downbeatPhase:0,warnings:[],source:{sha256:'abc'}};
test('synthetic 120 BPM pulse train and silence rejection',()=>{
  const rate=8000,samples=new Float32Array(rate*12);
  for(let t=.2;t<12;t+=.5)for(let j=0;j<200;j++)samples[Math.round(t*rate)+j]=.5*Math.exp(-j/30)*Math.cos(j);
  const a=analyzeSamples(samples,rate);assert.ok(Math.abs(a.bpm-120)<1);assert.ok(Math.abs(a.beats[0]-.2)<.04);assert.equal(a.reviewStatus,'needs-listening');
  assert.throws(()=>analyzeSamples(new Float32Array(rate*4),rate),/transients/);
});
test('manual variable beats, tempo override, meter and stable review revision',()=>{
  const grid=beatGrid(analysis,{bpm:60,firstBeat:.25,beatsPerBar:3,downbeatPhase:1});assert.equal(grid.beats[1].sourceTime,1.25);assert.equal(grid.beats[1].downbeat,true);
  assert.deepEqual(beatGrid(analysis,{beats:[.1,.6,1.2]}).beats.map(x=>x.sourceTime),[.1,.6,1.2]);
  assert.deepEqual(beatGrid(analysis,{bpm:120,firstBeat:0,beats:[.1,.61,1.25]}).beats.map(x=>x.sourceTime),[.1,.61,1.25]);
  assert.equal(beatGrid(analysis).revision,beatGrid(analysis,{reviewStatus:'listened'}).revision);
  for(const o of [{beats:[1,.5]},{firstBeat:-1},{bpm:0},{downbeatPhase:4}])assert.throws(()=>beatGrid(analysis,o));
});
test('source trim and speed map to integer frame; changes cannot silently move events',()=>{
  const grid=beatGrid(analysis),board={segments:[{id:'opening',durationSeconds:5,events:{hit:1}}]};
  const sync={schemaVersion:1,music:{clipId:'bed',sourceIn:1,sourceOut:6,at:.1,speed:2},actions:[{event:'opening.hit',beat:5,revision:grid.revision,landmark:'impact',soundId:'ding'}]};
  const out=applyMusicTiming(board,sync,grid,30);assert.equal(out.segments[0].events.hit,26/30);assert.equal(board.segments[0].events.hit,1);
  assert.throws(()=>applyMusicTiming(board,{...sync,requiredEvents:['opening.missing']},grid,30),/Required key event/);
  const timeline={fps:30,events:{'opening.hit':26/30}},audio={clips:[{id:'bed',role:'music',...sync.music}],cues:[{id:'ding',role:'accent',at:26/30-.05,duration:.3}]};
  sync.actions[0].soundOffset=.05;assert.equal(checkMusicSync(sync,timeline,audio,grid).issues.length,0);
  assert.equal(checkMusicSync(sync,timeline,{...audio,cues:[]},grid).issues[0].code,'missing-effect');
  assert.throws(()=>applyMusicTiming(board,sync,beatGrid(analysis,{bpm:60}),30),/revision changed/);
  sync.actions[0].beat=0;assert.throws(()=>applyMusicTiming(board,sync,grid,30),/outside music range/);
});
test('review HTML contains valid JavaScript and escapes source metadata',()=>{
  const html=musicReviewHtml({...analysis,warnings:['</script>']},{},30);const script=html.match(/<script>([\s\S]*)<\/script>/)[1];new vm.Script(script);assert.ok(!script.includes('</script>'));
});
