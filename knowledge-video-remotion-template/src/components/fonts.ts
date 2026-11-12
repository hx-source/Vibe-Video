import {useEffect,useState} from 'react';
import {cancelRender,continueRender,delayRender} from 'remotion';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/700.css';
export function useFonts(text:string) {
  const [handle]=useState(()=>delayRender('Loading bundled Chinese fonts'));
  useEffect(()=>{
    Promise.all([document.fonts.load('400 32px "Noto Sans SC"',text),document.fonts.load('700 32px "Noto Sans SC"',text)])
      .then(()=>document.fonts.ready).then(()=>continueRender(handle)).catch(cancelRender);
  },[handle,text]);
}
