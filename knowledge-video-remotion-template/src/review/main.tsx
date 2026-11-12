import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player,type PlayerRef} from '@remotion/player';
import {KnowledgeFilm} from '../compositions/KnowledgeFilm';
import type {RenderData} from '../types';
import {frameAt} from '../timeline/compile.mjs';
import './style.css';
function Review(){
  const [data,setData]=useState<RenderData>(),[error,setError]=useState(''),[variant,setVariant]=useState('A'),[track,setTrack]=useState('mix'),[notes,setNotes]=useState(''),[listened,setListened]=useState(false),[frame,setFrame]=useState(0),[loop,setLoop]=useState(true);
  const player=useRef<PlayerRef>(null),seekInput=useRef<HTMLInputElement>(null);
  useEffect(()=>{
    const url=new URLSearchParams(location.search).get('data');
    if(!url?.startsWith('/prepared/')){setError('缺少审片数据，请通过 review 命令打开。');return;}
    fetch(url).then(r=>{if(!r.ok)throw Error(`载入失败：${r.status}`);return r.json();}).then(setData).catch(e=>setError(e.message));
  },[]);
  useEffect(()=>{const p=player.current;if(!p)return;const update=()=>setFrame(p.getCurrentFrame());p.addEventListener('frameupdate',update);return()=>p.removeEventListener('frameupdate',update);},[data]);
  if(error)return <main><h1>无法打开审片</h1><p role="alert">{error}</p></main>;
  if(!data)return <main>正在载入…</main>;
  const tracks=Object.keys(data.audio.variants.find(v=>v.id===variant)?.tracks??{});
  const labels:Record<string,string>={mix:'完整混音',music:'背景音乐',effects:'全部音效',start:'开始音',end:'结束音',transition:'转场音',process:'过程音',accent:'强调音'};
  function change(nextVariant:string,nextTrack:string){
    const p=player.current,at=p?.getCurrentFrame()??0,playing=p?.isPlaying()??false;
    setVariant(nextVariant);setTrack(nextTrack);
    // The Player is kept mounted. Re-seek after React updates the audio source.
    requestAnimationFrame(()=>{p?.seekTo(at);if(playing)p?.play();});
  }
  function download(){
    const record={project:data!.project.id,range:data!.range,variant,track,listened,status:listened?'listened':'not-listened',decision:'not-recorded',notes,createdAt:new Date().toISOString()};
    const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`${data!.project.id}-review.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <main><header><div><small>KNOWLEDGE VIDEO / REVIEW</small><h1>{data.project.title}</h1></div><span className="badge">{data.audio.silent?'无配乐预览':'声音待试听'}</span></header>
    <Player ref={player} component={KnowledgeFilm} inputProps={{data,variant,track}} durationInFrames={data.range.durationInFrames} compositionWidth={data.project.video.width} compositionHeight={data.project.video.height} fps={data.timeline.fps} controls={false} clickToPlay={false} loop={loop} style={{width:'100%',borderRadius:16,overflow:'hidden'}}/>
    <input aria-label="播放进度" type="range" min={0} max={data.range.durationInFrames-1} step={1} value={frame} onChange={e=>player.current?.seekTo(Number(e.target.value))} style={{width:'100%',marginTop:12}}/>
    <section className="toolbar"><span>全片时间：<b data-testid="time">{((frame+data.range.from)/data.timeline.fps).toFixed(2)}</b> 秒</span>
      <input ref={seekInput} type="number" aria-label="定位秒数" step={1/data.timeline.fps} style={{width:100}} defaultValue={data.range.from/data.timeline.fps}/><button onClick={()=>{const t=Number(seekInput.current?.value);if(Number.isFinite(t))player.current?.seekTo(Math.max(0,Math.min(data.range.durationInFrames-1,frameAt(t,data.timeline.fps)-data.range.from)));}}>定位</button>
      <button onClick={()=>player.current?.play()}>播放</button><button onClick={()=>player.current?.pause()}>暂停</button><button onClick={()=>player.current?.seekTo(Math.max(0,frame-1))}>上一帧</button><button onClick={()=>player.current?.seekTo(Math.min(data.range.durationInFrames-1,frame+1))}>下一帧</button><label><input type="checkbox" checked={loop} onChange={e=>setLoop(e.target.checked)}/>循环本段</label></section>
    <section className="toolbar"><label>方案 <select aria-label="方案" value={variant} onChange={e=>change(e.target.value,'mix')}>{data.audio.variants.map(v=><option key={v.id}>{v.id}</option>)}</select></label>
      <label>声音 <select aria-label="声音" value={track} onChange={e=>change(variant,e.target.value)} disabled={!tracks.length}>{tracks.length?tracks.map(t=><option key={t} value={t}>{labels[t]??t}</option>):<option value="mix">静音</option>}</select></label>
      <span>切换方案保留当前播放位置；试听不代表接受方案。</span></section>
    <section><h2>本段事件</h2><div className="events">{Object.entries(data.timeline.events).filter(([,t])=>frameAt(t,data.timeline.fps)>=data.range.from&&frameAt(t,data.timeline.fps)<data.range.to).map(([id,t])=><button key={id} onClick={()=>player.current?.seekTo(frameAt(t,data.timeline.fps)-data.range.from)}>{id} · {t.toFixed(2)}s</button>)}</div></section>
    <section><h2>观看与试听记录</h2><label><input type="checkbox" checked={listened} onChange={e=>setListened(e.target.checked)}/>已实际试听</label><textarea aria-label="审片备注" placeholder="记录具体时刻、画面问题、声音搭配及候选选择。" value={notes} onChange={e=>setNotes(e.target.value)}/><button className="primary" onClick={download}>下载审片记录</button></section>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Review/>);
