# Keyboard walk-through

A script for the part of accessibility no automatic check can answer. The axe
gate (`tests/a11y/page-types.test.tsx`) runs on every pull request and blocks a
change outright, but it renders into jsdom, which computes no layout — so it
cannot see a hit area or a focus outline. Those two are measured here, by a
person, on a drawn page.

Two rules are disabled by name in the gate for that reason: `color-contrast` and
`target-size`. That split is the decision of 2026-10-21 on
sydevs/WeMeditateWeb#162, not a gap.

## Before you start

- Open the deployed preview for the change, or `pnpm dev`.
- Use a real keyboard. Do not use a screen reader: the screen-reader lines of
  sydevs/WeMeditateWeb#162 are met by the gate and by this walk, by that same
  decision.
- Work down one page type at a time, and fill in the record at the bottom as you
  go. A finding with no page type beside it cannot be reproduced.

## The script, per page type

Run all of it on each of: **the home page**, **an article page**, **a meditation
page** (`/meditations/<id>`), and **the classes map** (`/map`).

1. **Reload, then press Tab once.** The first stop is the skip link, and it is
   drawn on screen — it is invisible until it takes focus. Press Enter: focus
   lands on the page's own content, past the menus.
2. **Press Tab to the bottom of the page.** At every stop, before moving on:
   - You can see which element has focus, against whatever sits behind it. A
     stop you cannot locate is a finding, and so is a ring you can only find by
     looking for it.
   - Focus moves in the order things appear on the page. A jump backwards, or
     into a menu you have already passed, is a finding.
   - Focus never lands on something you cannot see. If a stop appears to do
     nothing, that is this line, not line 2's.
3. **Measure the hit area of every icon control you passed.** The footer's social
   row and the dots under a multi-column section are the two that have been
   wrong before. With the element's bounding box on screen, check the centre and
   four points 20px out from it in each direction: all five must land inside that
   control's own box, and the box must measure at least 44×44. In the browser
   console, for one control:
   ```js
   const r = document.activeElement.getBoundingClientRect()
   const [cx, cy] = [r.left + r.width / 2, r.top + r.height / 2]
   console.log(r.width, r.height, [[0,0],[20,0],[-20,0],[0,20],[0,-20]]
     .map(([dx, dy]) => document.elementFromPoint(cx + dx, cy + dy) === document.activeElement))
   ```
   A class list is not a hit area. Read the numbers, not the classes.
4. **Click each control with the mouse, then move the mouse away.** No outline
   stays behind. (The ring draws on `focus-visible`, so a lingering one means a
   component drew its own.)
5. **Operate everything from the keyboard, with no mouse at all:**
   - open and close the header menu, and the language control in the footer;
   - move through a multi-column carousel;
   - on a meditation page, play and pause;
   - send a form, where the page has one.
   Escape closes whatever opened, and focus returns to the control that opened
   it.
6. **On a meditation page, start playback and Tab from the top again.** The
   play/pause button is faded out while it plays, and it keeps its tab stop:
   it is the only play/pause a keyboard can reach. So when focus lands on it,
   it must become visible. A stop you cannot see here is a finding.
7. **Turn JavaScript off and reload.** The page still shows its title, its body
   text and its forms. What is missing should be only what
   [components/AGENTS.md](../components/AGENTS.md) says is missing.

## Parts other teams own

Two pieces of these pages are not this repository's to fix, and the goal's
`## Not included` says so. They are raised with their owners instead, and the
request lives where the owner reads it:

| Piece | Owner | The request |
| --- | --- | --- |
| The inside of the classes map — everything `<sahaj-atlas>` draws once the widget mounts | `sydevs/SahajAtlasWeb` | sydevs/SahajAtlasWeb#432 |
| The video player's own controls | Vidstack, which is retired | sydevs/WeMeditateWeb#242, which replaces the player outright and brings controls that read in the visitor's language. Nothing is asked of Vidstack itself |

`/map`'s chrome — the header, the skip link, the breadcrumbs and the
server-rendered listing a crawler reads — is in scope here and is covered by the
script above. The address search box and the bought-in spam check are the same
shape as the video player: the labels this site passes them are ours, their own
controls are not.

## Record

One row per walk. Leave it empty until someone has actually walked it — an
unwalked row is worse than none.

| Date | Who | Page type | Finding |
| --- | --- | --- | --- |
|  |  |  |  |
