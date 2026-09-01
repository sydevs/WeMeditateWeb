---
name: design-extraction
description: Recreate a component from an existing live design: extract HTML and computed styles with Puppeteer, map them onto Tailwind tokens, and gather the missing requirements before implementing. Use when cloning a design from a URL, a screenshot, or a design file.
---

# Design Extraction Workflow

When creating components based on existing designs from live websites (e.g., using `/code/clone-design` command):

## Step 1: Analyze the Existing Design

**Using Puppeteer** (preferred for live sites):
```javascript
// Navigate to the page
await puppeteer.navigate(url)

// Extract HTML structure and computed styles
const element = document.querySelector('.target-class')
const styles = window.getComputedStyle(element)
```

**When to ask for screenshots instead**:
- The website requires authentication
- The design is from a design file (Figma, Sketch)
- JavaScript-heavy sites where Puppeteer struggles
- When the user has already provided a screenshot

## Step 2: Translate Design to Tailwind Tokens

**IMPORTANT**: Before implementing, read @DESIGN_SYSTEM.md for design tokens, Tailwind usage guidelines, and mobile-first requirements.

**Always use Tailwind's built-in tokens** - never create custom CSS or arbitrary values unless explicitly required:

- **Spacing**: Use `px-4`, `py-8`, `gap-6` (not `px-[17px]` or custom values)
- **Colors**: Use `text-gray-600`, `bg-teal-500` (not `text-[#7b7b7b]`)
- **Typography**: Use `text-base`, `font-medium` (not `text-[16px]` or `font-[500]`)
- **Sizing**: Use `max-w-md`, `w-full` (not `max-w-[400px]`)

**If custom CSS is unavoidable**, consult the user first and explain:
1. What you need the custom value for
2. Why existing Tailwind tokens don't work
3. What the closest Tailwind token would be

## Step 3: Classify the Component

Use the Atomic Design Classification Guide above to determine if the component should be:
- An **atom** (single indivisible element)
- A **molecule** (2-3 atoms combined)
- An **organism** (complex section with multiple molecules)
- A **template** (page layout structure)

**Ask the user if uncertain** - don't guess at classification.

## Step 4: Extract Requirements Proactively

Before implementing, ask the user about:

**Dimensions**:
- Exact max-width (or closest Tailwind token)
- Spacing around and within the component
- Responsive behavior (mobile, tablet, desktop)

**Colors and Styling**:
- Which gray shade to use (400, 500, 600?)
- Opacity values for gradients or overlays
- Border styles and shadows

**Alignment and Layout**:
- Text alignment in different states
- Flex/grid layout behavior
- How component should float or position itself

**States and Variants**:
- What states does it need (hover, active, disabled)?
- What variants exist (sizes, colors, styles)?
- Edge cases (empty state, long content, loading)?

**Accessibility**:
- Semantic HTML requirements
- ARIA labels needed
- Keyboard navigation behavior

## Step 5: Implementation

1. **Create component file**: `components/{level}/{ComponentName}/{ComponentName}.tsx`
2. **Write TypeScript interfaces**: Clear prop types with JSDoc comments
3. **Implement with Tailwind only**: No custom CSS unless approved
4. **Add accessibility**: ARIA attributes, semantic HTML, keyboard support
5. **Create stories**: Follow @STORYBOOK.md guidelines
6. **Export from index**: Add to `components/{level}/index.ts`

## Step 6: Verification

After creating the component:
- Restart Ladle to see new stories
- Check all variants in the story
- Test responsive behavior
- Verify accessibility with semantic HTML
- Confirm it matches the original design

**Example Workflow**:
```
User: Create a Blockquote component based on .cb-text-textbox on https://example.com

1. Navigate to URL with Puppeteer
2. Extract HTML structure and computed styles
3. Analyze: This is a molecule (combines text + credit + gradient background)
4. Ask about: max-width, gradient coverage, alignment behavior, margins
5. Implement using only Tailwind tokens
6. Create comprehensive stories with variants and examples
7. Restart Ladle to verify
```

