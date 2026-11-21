# MCP Server Usage Guide

This guide covers the MCP servers configured for this project in `.mcp.json`.

## Installed servers

| Server | Type | Purpose |
| --- | --- | --- |
| `github` | http | GitHub API access (issues, PRs, checks) |
| `sentry` | http | Query Sentry errors and issues |
| `cloudflare-docs` | http | Search Cloudflare product documentation |
| `playwright` | stdio | Browser automation for design extraction and UI checks |
| `payloadcms-docs` | stdio | Search PayloadCMS documentation |

`.claude/settings.json` pre-approves `mcp__cloudflare-docs__*` and `mcp__github__*` for use
without a confirmation prompt. Other MCP tools ask for confirmation on first use.

## Playwright

SahajCloud and SahajAtlasWeb run the same server, at `@latest`.

### Act on snapshot references, not selectors

`browser_snapshot` returns the page's accessibility tree, and every element in it carries a
`ref`. Pass that `ref` to `browser_click`, `browser_type`, and `browser_take_screenshot`. Take a
fresh snapshot after navigation, because refs from an earlier page no longer resolve.

### `browser_evaluate` takes a function

Pass a function expression as a string. Its return value comes back to the caller.

```javascript
// The whole page
() => ({ title: document.title, h1Count: document.querySelectorAll('h1').length })

// One element: also pass `element` and `ref`, and the function receives that element
(el) => el.textContent
```

Return only serializable values. A DOM node cannot cross back to the caller.

```javascript
// Wrong — returns a DOM node
() => document.querySelector('h1')

// Correct — returns its text
() => document.querySelector('h1')?.textContent
```

`browser_console_messages` shows what a `console.log()` inside the function printed.

### Attaching to a Chrome you already have open

By default the server launches its own Chrome with its own profile. To read a page that needs
your sign-in, attach to a Chrome started with a debug port instead:

```bash
./scripts/chrome-debug.sh
claude mcp add playwright-cdp --scope local -- npx -y @playwright/mcp@latest --cdp-endpoint http://localhost:9222
```

The second command adds a local-only server and is not checked in. Check the port is open:
`lsof -ti:9222` returns a process id when Chrome is listening.

Multiple MCP sessions can share one Chrome instance. Do not stop a debug session you did not
start — another agent may depend on it. Closing Chrome disconnects every session.

### Design extraction workflow

1. Navigate: `browser_navigate({ url })`.
2. Find the target element with `browser_snapshot`, and note its `ref`.
3. Extract HTML structure and class names with `browser_evaluate`, passing the element's
   `ref`.
4. Extract computed styles with `window.getComputedStyle(el)` inside the same function — read
   layout, spacing, typography, and color properties from the result.
5. Map each extracted value to a Tailwind token (see
   [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)). Example: `8px` → `2`, `16px` → `4`, `14px` → `text-sm`.

Prefer style extraction over screenshots for token mapping. Use a screenshot only for visual
confirmation, or when the source is a Figma/Sketch file instead of a live page.

## Cloudflare Docs

```javascript
mcp__cloudflare_docs__search_cloudflare_documentation({ query: "KV namespace bindings" });
mcp__cloudflare_docs__migrate_pages_to_workers_guide();
```

Search for a product name (Workers, KV, R2) rather than a specific API when a query returns no
results.

## General guidance

Prefer a built-in tool (Grep, Read) over an equivalent shell command. Check every
MCP tool result for an error before you act on it. A lost connection or a missing dependency —
Chrome not running, for example — can fail a call silently.
