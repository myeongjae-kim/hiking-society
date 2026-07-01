<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:tooling-agent-rules -->
# Tooling

Use the pnpm executable from the user's normal shell environment for pnpm commands in this repository, not the Codex bundled runtime pnpm. The bundled pnpm can trigger local build-approval prompts that do not reproduce in the user's shell. On this machine, the user's pnpm is currently `/opt/homebrew/bin/pnpm`.
<!-- END:tooling-agent-rules -->
