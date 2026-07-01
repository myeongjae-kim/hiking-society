<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:tooling-agent-rules -->
# Tooling

Use the pnpm executable from the user's normal shell environment for pnpm commands in this repository, not the Codex bundled runtime pnpm. The bundled pnpm can trigger local build-approval prompts that do not reproduce in the user's shell. On this machine, the user's pnpm is currently `/opt/homebrew/bin/pnpm`.
<!-- END:tooling-agent-rules -->

<!-- BEGIN:ui-component-agent-rules -->
# UI Components

When implementing UI, first check the Components section in the WebTUI docs: https://webtui.ironclad.sh/start/intro/

If WebTUI does not provide an appropriate component for the interaction, use Radix UI.

Use Tailwind CSS utilities as much as possible for application styling.
<!-- END:ui-component-agent-rules -->
