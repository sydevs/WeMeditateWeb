# MCP Server Usage Guide

This document provides guidance on using Model Context Protocol (MCP) servers with Claude Code in this project.

## Table of Contents

1. [Installed MCP Servers](#installed-mcp-servers)
2. [Puppeteer MCP Server](#puppeteer-mcp-server)
3. [Serena MCP Server](#serena-mcp-server)
4. [Cloudflare Docs MCP Server](#cloudflare-docs-mcp-server)
5. [Best Practices](#best-practices)

---

## Installed MCP Servers

This project uses the following MCP servers to enhance Claude Code's capabilities:

### Puppeteer (`@modelcontextprotocol/server-puppeteer`)

**Purpose**: Browser automation for design extraction, testing, and web scraping

**Use Cases**:
- Extracting design patterns from live websites
- Testing UI changes in real browsers
- Capturing screenshots for documentation
- Analyzing computed styles and HTML structure

**Tools Available**:
- `puppeteer_connect_active_tab` - Connect to Chrome debugging instance
- `puppeteer_navigate` - Navigate to URLs
- `puppeteer_screenshot` - Capture page screenshots
- `puppeteer_click` - Click elements
- `puppeteer_fill` - Fill form inputs
- `puppeteer_select` - Select dropdown options
- `puppeteer_hover` - Hover over elements
- `puppeteer_evaluate` - Execute JavaScript in browser context

**Chrome Debugging Setup**:
```bash
# Start Chrome with remote debugging (macOS)
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Or use the project script
./scripts/chrome-debug.sh
```

**Connection Port**: 9222 (default)

### Serena (`mcp__serena`)

**Purpose**: Semantic codebase navigation and intelligent code operations

**Use Cases**:
- Navigating large codebases efficiently
- Finding symbols by name or pattern
- Analyzing code structure without reading entire files
- Performing semantic refactoring operations

**Tools Available**:
- `list_dir` - List directory contents
- `find_file` - Find files by pattern
- `search_for_pattern` - Search code for regex patterns
- `get_symbols_overview` - Get high-level file structure
- `find_symbol` - Find code symbols by name path
- `find_referencing_symbols` - Find symbol references
- `replace_symbol_body` - Replace symbol implementations
- `insert_after_symbol` / `insert_before_symbol` - Insert code
- `rename_symbol` - Rename symbols across codebase
- `write_memory` / `read_memory` / `list_memories` - Store project knowledge

**Key Features**:
- Token-efficient code reading (avoid reading entire files)
- Symbolic navigation (classes, methods, functions)
- Cross-reference analysis
- Memory system for project context

### Cloudflare Docs (`mcp__cloudflare-docs`)

**Purpose**: Search Cloudflare product documentation

**Use Cases**:
- Understanding Cloudflare Workers APIs
- Learning about KV, R2, D1, Durable Objects
- Researching deployment and configuration options

**Tools Available**:
- `search_cloudflare_documentation` - Semantic search across docs
- `migrate_pages_to_workers_guide` - Migration documentation

---

## Puppeteer MCP Server

### Common Issue: `puppeteer_evaluate` Returns Undefined

**Problem**: The `puppeteer_evaluate` tool always shows "Execution result: undefined" even though code executes.

**Root Cause**: Missing explicit `return` statement in JavaScript code. This is standard Puppeteer behavior, not an MCP server bug.

### Solution: Use Explicit Return Statements

```javascript
// ❌ WRONG - Returns undefined (no return statement)
const data = {
  url: window.location.href,
  title: document.title
};
data;

// ❌ WRONG - Arrow function with braces needs explicit return
(() => {
  document.title
})()

// ✅ CORRECT - Explicit return statement
return {
  url: window.location.href,
  title: document.title,
  h1Count: document.querySelectorAll('h1').length
};

// ✅ ALSO CORRECT - Implicit return (no braces)
(() => document.title)()
```

### Best Practices for `puppeteer_evaluate`

**1. Always Use Explicit Returns**

```javascript
// Extract page data
return {
  url: window.location.href,
  title: document.title,
  bodyExists: !!document.querySelector('body'),
  h1Text: document.querySelector('h1')?.textContent || 'No h1 found'
};
```

**2. Extract Only Serializable Data**

DOM elements and complex objects cannot be returned directly. Extract primitive values:

```javascript
// ❌ Wrong - trying to return DOM node
return document.querySelector('h1');

// ✅ Correct - extract text content
return document.querySelector('h1')?.textContent;

// ✅ Correct - extract multiple properties
const element = document.querySelector('.author');
return {
  text: element?.textContent,
  className: element?.className,
  innerHTML: element?.innerHTML
};
```

**3. Use `console.log()` for Debugging**

Console output appears in the "Console output" section:

```javascript
const data = {
  url: window.location.href,
  title: document.title
};
console.log('Debug info:', JSON.stringify(data, null, 2));
return data;
```

**4. Handle Missing Elements Gracefully**

Always use optional chaining and fallbacks:

```javascript
return {
  title: document.querySelector('h1')?.textContent || 'No title',
  author: document.querySelector('.author')?.textContent || 'Unknown',
  description: document.querySelector('.description')?.textContent || ''
};
```

### Extracting Computed Styles

Use `window.getComputedStyle()` to extract design tokens:

```javascript
const element = document.querySelector('.target-class');
if (!element) return { error: 'Element not found' };

const styles = window.getComputedStyle(element);

return {
  // Layout
  display: styles.display,
  position: styles.position,
  width: styles.width,
  height: styles.height,

  // Spacing
  padding: styles.padding,
  margin: styles.margin,
  gap: styles.gap,

  // Typography
  fontSize: styles.fontSize,
  fontFamily: styles.fontFamily,
  fontWeight: styles.fontWeight,
  lineHeight: styles.lineHeight,
  letterSpacing: styles.letterSpacing,

  // Colors
  color: styles.color,
  backgroundColor: styles.backgroundColor,

  // Borders
  border: styles.border,
  borderRadius: styles.borderRadius,

  // Effects
  boxShadow: styles.boxShadow,
  opacity: styles.opacity
};
```

### Design Extraction Workflow

**Step 1: Connect to Browser**

```javascript
mcp__puppeteer__puppeteer_connect_active_tab({ debugPort: 9222 })
```

**Step 2: Navigate to Page (if needed)**

```javascript
mcp__puppeteer__puppeteer_navigate({ url: "https://example.com" })
```

**Step 3: Extract HTML Structure**

```javascript
return {
  html: document.querySelector('.target').outerHTML,
  classes: Array.from(document.querySelectorAll('.target *'))
    .map(el => el.className)
    .filter(Boolean)
};
```

**Step 4: Extract Computed Styles**

See "Extracting Computed Styles" section above.

**Step 5: Take Screenshot (Optional)**

```javascript
mcp__puppeteer__puppeteer_screenshot({
  name: "component-design",
  selector: ".target-class"  // Optional: screenshot specific element
})
```

### Chrome Debugging Best Practices

**Starting Chrome**:
- Use the project script: `./scripts/chrome-debug.sh`
- Or manually: Open Chrome with `--remote-debugging-port=9222`
- Keep Chrome open during development session

**Checking if Chrome is Running**:
```bash
lsof -ti:9222  # Should return process ID(s)
```

**Multiple Chrome Instances**:
- Multiple debugging sessions can share the same Chrome instance
- Don't kill Chrome debug processes unless you started them
- Closing Chrome will disconnect all MCP sessions

---

## Serena MCP Server

### Before Using Serena

**IMPORTANT**: Always activate the project before using Serena tools:

```javascript
mcp__serena__activate_project({ project: 'WeMeditateWeb' })
```

If you see "No active project" errors, this step was missed.

### Token-Efficient Code Reading

**Problem**: Reading entire files wastes tokens and slows down responses.

**Solution**: Use Serena's symbolic tools to read only what you need.

### Reading Code Efficiently

**1. Start with Overview**

```javascript
mcp__serena__get_symbols_overview({
  relative_path: "components/atoms/Button/Button.tsx"
})
```

Returns top-level symbols (classes, functions, exports) without bodies.

**2. Find Specific Symbols**

```javascript
// Find a function by name
mcp__serena__find_symbol({
  name_path: "Button",
  relative_path: "components/atoms/Button/Button.tsx",
  include_body: true  // Only when you need implementation
})

// Find method in a class
mcp__serena__find_symbol({
  name_path: "ClassName/methodName",
  relative_path: "path/to/file.ts",
  include_body: true
})
```

**3. Search by Pattern**

```javascript
mcp__serena__search_for_pattern({
  substring_pattern: "useState.*loading",
  relative_path: "components/",
  restrict_search_to_code_files: true,
  context_lines_before: 2,
  context_lines_after: 2
})
```

### Symbol Editing

**Replace Symbol Body**:
```javascript
mcp__serena__replace_symbol_body({
  name_path: "FunctionName",
  relative_path: "path/to/file.ts",
  body: "export function FunctionName() {\n  // New implementation\n}"
})
```

**Insert Code**:
```javascript
// Insert after a symbol
mcp__serena__insert_after_symbol({
  name_path: "LastFunction",
  relative_path: "path/to/file.ts",
  body: "\nexport function NewFunction() {\n  // Implementation\n}\n"
})

// Insert before (e.g., add imports)
mcp__serena__insert_before_symbol({
  name_path: "FirstFunction",
  relative_path: "path/to/file.ts",
  body: "import { useState } from 'react'\n"
})
```

### Memory System

Store project knowledge for future sessions:

```javascript
// Write memory
mcp__serena__write_memory({
  memory_file_name: "component-patterns.md",
  content: "# Component Patterns\n\nAll buttons use the Button atom..."
})

// List available memories
mcp__serena__list_memories()

// Read memory
mcp__serena__read_memory({
  memory_file_name: "component-patterns.md"
})
```

---

## Cloudflare Docs MCP Server

### Searching Documentation

**Basic Search**:
```javascript
mcp__cloudflare_docs__search_cloudflare_documentation({
  query: "KV namespace bindings"
})
```

**Migration Guide**:
```javascript
mcp__cloudflare_docs__migrate_pages_to_workers_guide()
```

### When to Use

- ✅ Understanding Cloudflare Workers APIs
- ✅ Learning about KV, R2, D1, Queues, Durable Objects
- ✅ Troubleshooting deployment issues
- ✅ Finding best practices for edge computing

---

## Best Practices

### General MCP Usage

**1. Prefer MCP Tools Over Direct Commands**

```javascript
// ✅ Good - Use Serena for code search
mcp__serena__search_for_pattern({ pattern: "useState" })

// ❌ Bad - Use grep command
Bash({ command: "grep -r 'useState' components/" })
```

**2. Check Tool Availability**

MCP tools have been pre-approved for use without user confirmation:
- All `mcp__serena__*` tools
- All `mcp__puppeteer__*` tools
- `mcp__cloudflare_docs__*` tools

**3. Handle Errors Gracefully**

MCP tools may fail if:
- Connection is lost
- Required services aren't running (e.g., Chrome debugging)
- Files or symbols don't exist

Always check tool results and handle errors appropriately.

### Puppeteer-Specific

**1. Connect Before Using**

Always connect to Chrome before using other Puppeteer tools:
```javascript
mcp__puppeteer__puppeteer_connect_active_tab({ debugPort: 9222 })
```

**2. Use Explicit Returns**

See "Puppeteer MCP Server" section for detailed guidance.

**3. Extract Styles, Not Screenshots**

For design extraction, prefer `puppeteer_evaluate` with `getComputedStyle()` over screenshots. Screenshots are useful for visual confirmation, not data extraction.

### Serena-Specific

**1. Read Code Strategically**

- Start with `get_symbols_overview`
- Use `find_symbol` for targeted reads
- Only include `include_body: true` when necessary
- Avoid reading entire files unless absolutely needed

**2. Use Symbol Paths Correctly**

Symbol paths use `/` to separate nested symbols:
- `ClassName` - Top-level class
- `ClassName/methodName` - Method in class
- `/ClassName` - Absolute path (must be top-level)

**3. Search Before Reading**

If unsure where code lives, search first:
```javascript
// Find files
mcp__serena__find_file({
  file_mask: "*Button*.tsx",
  relative_path: "components/"
})

// Find pattern
mcp__serena__search_for_pattern({
  substring_pattern: "export.*Button",
  relative_path: "components/"
})
```

### Design Extraction Workflow

When extracting designs from websites (e.g., using `/extract-design` command):

**1. Use Puppeteer, Not Screenshots**

Ask for screenshots only when:
- The website requires authentication
- The design is from a design file (Figma, Sketch)
- JavaScript-heavy sites where Puppeteer struggles
- The user has already provided a screenshot

Otherwise, use Puppeteer to extract HTML and styles programmatically.

**2. Extract Data Systematically**

Follow this order:
1. HTML structure (class names, element hierarchy)
2. Computed styles (spacing, typography, colors)
3. Pseudo-elements (::before, ::after)
4. Interactive states (hover, focus) if needed

**3. Map to Tailwind Tokens**

Always translate extracted values to Tailwind tokens:
- Spacing: 8px → `2`, 16px → `4`, 24px → `6`
- Colors: #7b7b7b → `text-gray-600` or custom token
- Font sizes: 14px → `text-sm`, 16px → `text-base`

See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for complete token mapping guidelines.

---

## Troubleshooting

### Puppeteer Issues

**"Failed to connect to browser"**
- Check if Chrome is running with debug port: `lsof -ti:9222`
- Start Chrome: `./scripts/chrome-debug.sh`
- Verify port 9222 is not blocked by firewall

**"Execution result: undefined"**
- Add explicit `return` statement to your JavaScript
- See "Solution: Use Explicit Return Statements" section

**"Cannot read property of null"**
- Element doesn't exist on page
- Use optional chaining: `document.querySelector('.el')?.textContent`

### Serena Issues

**"No active project"**
- Activate the project first: `mcp__serena__activate_project({ project: 'WeMeditateWeb' })`
- This must be done at the start of each session before using any Serena tools

**"Symbol not found"**
- Verify file path is correct (relative to project root)
- Check symbol name spelling
- Use `get_symbols_overview` to list available symbols

**"File not found"**
- Ensure path is relative to project root
- Use `list_dir` or `find_file` to verify path

**"Max answer chars exceeded"**
- Result is too large
- Use more specific queries
- Read symbols without bodies first, then selectively read implementations

### Cloudflare Docs Issues

**"No results found"**
- Try broader search terms
- Search for product names (KV, Workers, R2) rather than specific APIs
- Check Cloudflare documentation website directly for very new features

---

## Additional Resources

- [Puppeteer Documentation](https://pptr.dev/)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) - Component design guidelines
- [STORYBOOK.md](STORYBOOK.md) - Component story patterns
