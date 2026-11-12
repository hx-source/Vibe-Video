// A boundary is the first frame at/after its content time. The final partial frame is retained.
export const frameAt = (seconds, fps) => Math.ceil(seconds * fps - 1e-7);
const fail = (message) => { throw new Error(message); };
export const identifier = (value) => typeof value === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(value);
export function resolveTime(value, events) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (!value || typeof value.event !== 'string' || !Number.isFinite(events[value.event])) fail(`Unknown event: ${value?.event}`);
  const offset = value.offset ?? 0;
  if (!Number.isFinite(offset)) fail('Event offset must be finite');
  return events[value.event] + offset;
}
export function compileTimeline(project, storyboard, captions) {
  if (project.contract !== 'knowledge-video-remotion' || project.contractVersion !== 1) fail('Unsupported project contract');
  if (project.templateVersion !== '0.1.0') fail('Project needs an explicit migration to templateVersion 0.1.0');
  if (!identifier(project.id)) fail('Invalid project id');
  const {width, height, fps} = project.video ?? {};
  if (![width, height, fps].every(Number.isInteger) || width < 320 || width > 3840 || height % 2 || width % 2 || width / height !== 16 / 9 || fps < 1 || fps > 60) fail('Video requires even 16:9 dimensions, width 320–3840, fps 1–60');
  if (project.timelineBasis !== 'final-seconds' || 'speed' in project.video || 'sourceDuration' in project.video) fail('Use final-seconds without global speed');
  if (project.narration?.enabled) fail('Narration is not supported in this version');
  if (!Array.isArray(storyboard.segments) || !storyboard.segments.length) fail('At least one segment required');
  let time = 0;
  const ids = new Set(), events = {}, segments = [];
  for (const s of storyboard.segments) {
    if (!identifier(s.id) || ids.has(s.id)) fail(`Invalid or duplicate segment: ${s.id}`);
    ids.add(s.id);
    if (!Number.isFinite(s.durationSeconds) || s.durationSeconds <= 0) fail(`Invalid segment duration: ${s.id}`);
    if (!s.events || typeof s.events !== 'object' || Array.isArray(s.events)) fail(`Events required: ${s.id}`);
    const start = time; time += s.durationSeconds;
    const startFrame = frameAt(start, fps), endFrame = frameAt(time, fps);
    if (endFrame <= startFrame) fail(`Segment shorter than one frame: ${s.id}`);
    for (const [key, value] of Object.entries(s.events)) {
      if (!identifier(key) || !Number.isFinite(value) || value < 0 || value > s.durationSeconds) fail(`Invalid event: ${s.id}.${key}`);
      events[`${s.id}.${key}`] = start + value;
    }
    segments.push({...s, startSeconds: start, startFrame, endFrame});
  }
  if (time > 600) fail('This in-memory audio engine supports videos up to 600 seconds');
  if (!Array.isArray(captions.items)) fail('captions.items must be an array');
  const captionIds = new Set();
  const resolved = captions.items.map(c => {
    if (!identifier(c.id) || captionIds.has(c.id) || typeof c.text !== 'string' || !c.text.trim()) fail(`Invalid caption: ${c.id}`);
    captionIds.add(c.id);
    const s = segments.find(x => x.id === c.segmentId);
    if (!s) fail(`Unknown caption segment: ${c.segmentId}`);
    const from = resolveTime(c.start, s.events), to = resolveTime(c.end, s.events);
    if (from < 0 || to > s.durationSeconds + 1e-7 || to <= from) fail(`Caption outside segment: ${c.id}`);
    const startFrame = frameAt(s.startSeconds + from, fps), endFrame = frameAt(s.startSeconds + to, fps);
    if (endFrame <= startFrame) fail(`Caption shorter than one frame: ${c.id}`);
    return {...c, startFrame, endFrame};
  }).sort((a,b) => a.startFrame - b.startFrame);
  resolved.forEach((c,i) => { if (i && c.startFrame < resolved[i-1].endFrame) fail(`Overlapping captions: ${c.id}`); });
  return {fps, durationSeconds: time, durationInFrames: frameAt(time, fps), segments, events, captions: resolved};
}
export function selectRange(timeline, options = {}) {
  const hasRange = options.from !== undefined || options.to !== undefined;
  if (options.event && hasRange) fail('Use event or from/to, not both');
  if (options.segment && (options.event || hasRange)) fail('Use segment or event or from/to');
  let from = 0, to = timeline.durationSeconds;
  if (options.segment) {
    const segment = timeline.segments.find(s => s.id === options.segment);
    if (!segment) fail(`Unknown segment: ${options.segment}`);
    return {from: segment.startFrame, to: segment.endFrame, durationInFrames: segment.endFrame - segment.startFrame};
  }
  if (options.event) {
    const at = timeline.events[options.event];
    if (!Number.isFinite(at)) fail(`Unknown event: ${options.event}`);
    const before = Number(options.before ?? 1), after = Number(options.after ?? 1.5);
    if (![before, after].every(x => Number.isFinite(x) && x >= 0)) fail('Invalid review margins');
    from = Math.max(0, at - before); to = Math.min(to, at + after);
  } else {
    from = Number(options.from ?? 0); to = Number(options.to ?? to);
  }
  if (!Number.isFinite(from) || !Number.isFinite(to) || from < 0 || to > timeline.durationSeconds + 1e-7 || to <= from) fail('Invalid range');
  const first = frameAt(from, timeline.fps), end = Math.min(timeline.durationInFrames, frameAt(to, timeline.fps));
  if (end <= first) fail('Range shorter than one frame');
  return {from: first, to: end, durationInFrames: end - first};
}
export function captionsSrt(timeline, range) {
  const clock = frames => {
    const ms = Math.round(frames / timeline.fps * 1000);
    return `${String(Math.floor(ms / 3600000)).padStart(2,'0')}:${String(Math.floor(ms / 60000) % 60).padStart(2,'0')}:${String(Math.floor(ms / 1000) % 60).padStart(2,'0')},${String(ms % 1000).padStart(3,'0')}`;
  };
  return timeline.captions.filter(c => c.endFrame > range.from && c.startFrame < range.to).map((c,i) => `${i+1}\n${clock(Math.max(c.startFrame,range.from)-range.from)} --> ${clock(Math.min(c.endFrame,range.to)-range.from)}\n${c.text}\n`).join('\n');
}
