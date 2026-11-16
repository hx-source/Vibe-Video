import test from 'node:test';
import assert from 'node:assert/strict';
import {matchingState} from '../projects/moon-match-sample/scenes/matching-model.mjs';
import {videoPreset} from '../src/video-presets.mjs';
const events={enter:0,preferences:1,first:2,challenger:4,compare:4.5,replace:5.5,retry:7,settle:8.5};
test('temporary match changes only after comparison; rejected proposer continues and rewind restores prior state',()=>{
  assert.deepEqual(matchingState(4.8,events).pairs,[['a','x']]);
  assert.deepEqual(matchingState(5.5,events).pairs,[['b','x']]);
  assert.deepEqual(matchingState(8,events).pairs,[['b','x'],['a','y']]);
  assert.deepEqual(matchingState(2.5,events).pairs,[['a','x']]);
  assert.deepEqual(matchingState(.5,events).pairs,[]);
});
test('video presets retain the default and return independent values',()=>{
  assert.deepEqual(videoPreset(),{width:1920,height:1080,fps:30});
  const hd=videoPreset('hd720');hd.width=4;
  assert.equal(videoPreset('hd720').width,1280);
  assert.throws(()=>videoPreset('portrait'),/Unknown video preset/);
});
