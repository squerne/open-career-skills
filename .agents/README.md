# Generated: do not edit

`.agents/skills/` holds byte-identical copies of `.claude/skills/`, in the Agent Skills format that Codex, Gemini CLI, Antigravity and Cursor read. Edit the skill under `.claude/skills/`, then run:

```bash
node packaging/sync.mjs
```

They are copies, not symlinks, because not every tool documents following symlinks, and a Windows checkout turns a symlink into a plain text file unless symlinks are switched on.
