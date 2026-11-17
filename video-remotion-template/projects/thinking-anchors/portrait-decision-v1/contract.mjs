export function validatePortrait(data){
 if(data.schemaVersion!==1||data.sceneType!=='anchor-portrait-decision')throw Error('Invalid portrait decision');
 if(data.video.width!==1080||data.video.height!==1920||data.video.fps!==30||data.durationSeconds!==14||data.rangeSeconds[0]!==24||data.rangeSeconds[1]!==38)throw Error('Expected native portrait 24–38 seconds');
 const keys=['search','history','other','compare','conditions','need','budget','choice'];for(let i=0;i<keys.length;i++){const t=data.events[keys[i]];if(!Number.isFinite(t)||t<0||t>=14||(i&&t<=data.events[keys[i-1]]))throw Error('Invalid decision event');}
 for(const c of data.captions)if(c.from<0||c.to>14||c.to<=c.from||!c.text)throw Error('Invalid decision caption');
 return {video:{...data.video,duration:38},timeline:{events:Object.fromEntries(Object.entries(data.events).map(([k,t])=>['decision.'+k,t+24]))},audio:{mix:'unused.wav'}};
}
