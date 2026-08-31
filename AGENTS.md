# Agent Rules

This tool aims to provide a precise way to convert Mermaid to React Flow in a maintainable way that allows controlled editing. There should be no custom code. Anything custom should be evidence-backed with source links.

- Do not create files or directories before checking whether they already exist.
- Do not stage, commit, push, deploy, or publish unless explicitly asked.
- Keep architecture notes in `tmp/*.md` aligned before commit-ready work.
- No snowflakes. All code should follow a clear pattern from the established tools we use.

## Core Defaults

- For `site` UI, use real shadcn components wherever possible. If there is an exception, invoke a 2-question grill to understand how we are thinking wrong.
- React Flow canvas and controls are allowed only as wrappers around shadcn blocks.
- All app state belongs in XState. If there is an exception, invoke a 2-question grill to understand how we are thinking wrong.
- Utilities should use Effect. If there is an exception, invoke a 2-question grill to understand how we are thinking wrong.
- CRUD should be a direct handoff between XState and Dexie. If there is an exception, invoke a 2-question grill to understand how we are thinking wrong.
- Prefer oxlint with eslint-plugin-legibility in strict mode.

## Stop Conditions

- Before editing, name the exact default tool/API/component/pattern being used.
- If you cannot name it, do not edit.
- Ask: "I'm at `<file/component>`, implementing `<specific behavior>`. Which `<specific default API/component/pattern>` should I use?"
- Ask one buffer question only after the default path is exhausted.
- Do not invent wrappers, one-off controls, bespoke CSS, or new architecture.
