import test from 'node:test';
import assert from 'node:assert/strict';
import {loadProject} from '../scripts/project.mjs';
import {sequenceState} from '../src/scenes/sequence-model.mjs';
const p=loadProject('tcp-handshake'),handshake=p.timeline.segments.find(s=>s.id==='handshake'),close=p.timeline.segments.find(s=>s.id==='close');
test('third ACK must arrive before server is established',()=>{
 const at=handshake.events['ack-arrive'];
 assert.deepEqual(sequenceState(handshake,at-.001),{client:'ESTABLISHED',server:'SYN_RECEIVED'});
 assert.deepEqual(sequenceState(handshake,at),{client:'ESTABLISHED',server:'ESTABLISHED'});
 assert.equal(handshake.props.messages[1].detail,'seq = 800   ack = 101');assert.equal(handshake.props.messages[2].detail,'seq = 101   ack = 801');
});
test('half-close permits remaining data while client is FIN_WAIT_2 and server CLOSE_WAIT',()=>{
 for(const event of ['remaining-data-send','remaining-data-arrive'])assert.deepEqual(sequenceState(close,close.events[event]),{client:'FIN_WAIT_2',server:'CLOSE_WAIT'});
 assert.equal(close.props.messages.filter(m=>!m.data).length,4);
});
test('TIME_WAIT starts at peer FIN arrival; server closes after final ACK',()=>{
 assert.deepEqual(sequenceState(close,close.events['fin-server-arrive']),{client:'TIME_WAIT',server:'LAST_ACK'});
 assert.deepEqual(sequenceState(close,close.events['ack-client-arrive']),{client:'TIME_WAIT',server:'CLOSED'});
});
test('seeking backwards does not retain future endpoint states',()=>{
 const before=sequenceState(close,2);sequenceState(close,100);assert.deepEqual(sequenceState(close,2),before);
});
