export function validatePortrait(data){
 if(data.schemaVersion!==1||data.sceneType!=='anchor-portrait-mechanism')throw Error('Invalid portrait mechanism');
 if(data.video.width!==1080||data.video.height!==1920||data.video.fps!==30||data.durationSeconds!==12||data.rangeSeconds[0]!==12||data.rangeSeconds[1]!==24)throw Error('Expected 12–24s native portrait mechanism');
 const keys=['shift','recall','feel','compare','concept','question'];
 for(let i=0;i<keys.length;i++){const t=data.events[keys[i]];if(!Number.isFinite(t)||t<0||t>=12||(i&&t<=data.events[keys[i-1]]))throw Error('Invalid mechanism event');}
 for(const c of data.captions)if(c.from<0||c.to>12||c.to<=c.from||!c.text)throw Error('Invalid mechanism caption');
 return {video:{...data.video,duration:24},timeline:{events:Object.fromEntries(Object.entries(data.events).map(([k,t])=>['mechanism.'+k,12+t]))},audio:{mix:'unused.wav'}};
}
