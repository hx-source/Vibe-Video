import {PNG} from 'pngjs';
// Chrome may change a handful of antialiased edge channels by 1 after a seek.
export function comparePng(first,second){
 const a=PNG.sync.read(first),b=PNG.sync.read(second);
 if(a.width!==b.width||a.height!==b.height)throw Error('Screenshot dimensions disagree');
 let changedPixels=0,maxChannelDifference=0;
 for(let i=0;i<a.data.length;i+=4){let different=false;for(let c=0;c<4;c++){const d=Math.abs(a.data[i+c]-b.data[i+c]);maxChannelDifference=Math.max(maxChannelDifference,d);different ||= d!==0;}if(different)changedPixels++;}
 return {width:a.width,height:a.height,changedPixels,maxChannelDifference,passed:maxChannelDifference<=1&&changedPixels<=a.width*a.height*.001};
}
