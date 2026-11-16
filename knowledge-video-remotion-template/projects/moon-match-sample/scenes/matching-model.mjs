// Pure time-derived state: seeking backwards never keeps future pairings.
export function matchingState(time,events){
  if(time<events.first)return {stage:'ready',pairs:[],selected:null};
  if(time<events.challenger)return {stage:'first',pairs:[['a','x']],selected:'a'};
  if(time<events.replace)return {stage:'compare',pairs:[['a','x']],selected:'a'};
  if(time<events.retry)return {stage:'replace',pairs:[['b','x']],selected:'b'};
  return {stage:time<events.settle?'retry':'settle',pairs:[['b','x'],['a','y']],selected:'b'};
}
