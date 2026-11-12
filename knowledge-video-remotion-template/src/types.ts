export type Theme = {id: string; colors: Record<'background'|'text'|'muted'|'primary'|'accent'|'panel'|'line'|'success', string>};
export type Message = {id:string; from:string; label:string; detail:string; startEvent:string; endEvent:string; sendState?:string; receiveState?:string; data?:boolean};
export type SceneProps = {title:string; subtitle?:string; note?:string; imageAsset?:string; centerLabel?:string; centerDetail?:string; cards?:Array<{title:string;body:string;event:string}>; nodes?:Array<{id:string;label:string;state?:string}>; messages?:Message[]; steps?:Array<{label:string;event:string}>};
export type Segment = {id:string; sceneType:string; intent:string; durationSeconds:number; events:Record<string,number>; props:SceneProps; startSeconds:number; startFrame:number; endFrame:number};
export type RenderData = {
  project: {id:string;title:string;video:{width:number;height:number;fps:number}};
  timeline: {fps:number;durationSeconds:number;durationInFrames:number;segments:Segment[];events:Record<string,number>;captions:Array<{id:string;text:string;startFrame:number;endFrame:number}>};
  theme:Theme;
  assets:Record<string,string>;
  audio:{silent:boolean;variants:Array<{id:string;tracks:Record<string,string>}>};
  range:{from:number;to:number;durationInFrames:number};
};
export type FilmProps = {data:RenderData;variant?:string;track?:string};
