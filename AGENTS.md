# Knowledge video work

For knowledge-video tasks in this repository, read `skills/knowledge-video/SKILL.md` and follow this maintained source. It is authoritative for this project even when a separately installed copy is older. Use `video-remotion-template` as the default engine.

Keep existing user-approved outputs and unrelated working changes. The current workflow is specifications, topic and verified content, three actual style previews, user choice or revision, a representative ten-second sample, then segmented production. Do not fabricate viewing, listening, or approval records.

Before storyboarding, use the skill's references/preflight.md to check the core question, new information per segment, visual focus, and observable changes. Reuse existing user decisions; local edits need only their affected context.

For projects with production-state.json, treat it as the current production record and use `npm run production -- ...` (docs/PRODUCTION-WORKFLOW.md). Current/source/delivery JSON views are generated; do not update them separately or rerun historical topic finish scripts that overwrite them. Preserve the delivered media and legacy snapshots.

After the user explicitly confirms a video is complete, copy that confirmed final video to `D:/Documents/dy/视频成片`, verify matching SHA256, and retain the original project output and materials. Use a descriptive topic/version filename; never overwrite a different existing file. Do not archive unconfirmed previews as completed videos.
