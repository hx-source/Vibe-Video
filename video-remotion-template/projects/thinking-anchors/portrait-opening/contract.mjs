// Project-scoped native portrait adapter. The shared 16:9 engine is unchanged.
export function validatePortrait(data){
 if(data.schemaVersion!==1||data.sceneType!=='anchor-portrait-opening')throw Error('Unsupported portrait scene');
 const {width,height,fps}=data.video;
 if(width!==1080||height!==1920||fps!==30||data.durationSeconds!==12)throw Error('Expected native 1080x1920, 30fps, 12 seconds');
 const keys=['strike','drop','happy','check','other','compare'];
 for(let i=0;i<keys.length;i++){const t=data.events[keys[i]];if(!Number.isFinite(t)||t<0||t>=12||(i&&t<=data.events[keys[i-1]]))throw Error('Invalid portrait action '+keys[i]);}
 if(data.safeArea.left<60||data.safeArea.right>950||data.safeArea.top<150||data.safeArea.bottom>1580)throw Error('Invalid portrait safe region');
 for(const c of data.captions)if(c.from<0||c.to>12||c.to<=c.from||!c.text)throw Error('Invalid portrait caption');
 return {video:{...data.video,duration:data.durationSeconds},timeline:{events:Object.fromEntries(Object.entries(data.events).map(([k,t])=>['opening.'+k,t]))},audio:{mix:'unused.wav'}};
}
