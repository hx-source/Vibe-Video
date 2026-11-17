export const VIDEO_PRESETS = Object.freeze({
  hd720: Object.freeze({width:1280,height:720,fps:30}),
  hd1080: Object.freeze({width:1920,height:1080,fps:30}),
});
export function videoPreset(name='hd1080') {
  if (!Object.hasOwn(VIDEO_PRESETS,name)) throw Error(`Unknown video preset: ${name}. Choose hd720 or hd1080.`);
  return {...VIDEO_PRESETS[name]};
}
