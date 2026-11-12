export function sequenceState(segment,time) {
  const {nodes,messages}=segment.props;
  const states=Object.fromEntries(nodes.map(n=>[n.id,n.state??'准备中']));
  const changes=messages.flatMap(m=>[
    {at:segment.events[m.startEvent],peer:m.from,value:m.sendState},
    {at:segment.events[m.endEvent],peer:nodes.find(n=>n.id!==m.from).id,value:m.receiveState}
  ]).sort((a,b)=>a.at-b.at);
  for(const change of changes) if(time>=change.at&&change.value)states[change.peer]=change.value;
  return states;
}
