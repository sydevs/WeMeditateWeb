# Preview Routes

This directory holds the preview routes for PayloadCMS live preview. SahajCloud's admin panel
renders these pages inside an iframe.

## Routes

- `/preview` — the main preview route. It handles pages and meditations.
- `/preview/embed` — an embedded preview route. It renders bare, with no site chrome (LayoutRoot
  only).

## PostMessage protocol

The preview components talk to the SahajCloud admin panel through `window.postMessage`. The code
validates every message against the `PUBLIC__SAHAJCLOUD_URL` origin.

### Outbound messages (preview to admin)

#### PLAYBACK_TIME_UPDATE

Sent during meditation playback, to sync the current position with the admin UI.

```typescript
{
  type: 'PLAYBACK_TIME_UPDATE',
  currentTime: number  // Time in seconds (integer, floored)
}
```

**Frequency**: every 100ms during playback, plus on every play, pause, and seek event.

**Use case**: highlights the current frame thumbnail in the admin panel.

### Inbound messages (admin to preview)

#### SEEK_TO_TIME

Sent when an editor clicks a frame thumbnail, to jump to that position.

```typescript
{
  type: 'SEEK_TO_TIME',
  timestamp: number  // Time in seconds (integer)
}
```

**Response**: the player seeks to the timestamp, then keeps sending `PLAYBACK_TIME_UPDATE`
messages.

## Test the seek command

From the SahajCloud admin console:

```javascript
// Get the preview iframe
const iframe = document.querySelector('iframe')

// Send the seek command
iframe.contentWindow.postMessage(
  { type: 'SEEK_TO_TIME', timestamp: 30 },
  '*', // or a specific origin, for security
)
```

## Authentication

A preview route needs a `secret` query parameter. The CMS admin panel adds it automatically when
it builds the preview iframe URL.

**URL format**: `/preview?collection=pages&id=123&secret=[previewSecret]`

The web app forwards the secret to the CMS API as the `x-sahajcloud-preview-secret` header. The
CMS validates the secret and returns draft content when it is valid. Without a valid secret, the
preview routes return 403 Forbidden.

## Security

- The preview secret stays server-side. It never reaches browser JavaScript.
- The code validates every postMessage event against `PUBLIC__SAHAJCLOUD_URL`. When that env var is
  unset, the validation uses `'*'` instead, and logs a console warning.
- The code validates each message payload before it acts on it.

## Implementation

**MeditationPreview** (`_components/MeditationPreview.tsx`):
- Uses the `useLivePreview` hook for real-time content updates.
- Listens for `SEEK_TO_TIME` through `window.addEventListener`.
- Sends `PLAYBACK_TIME_UPDATE` through `window.parent.postMessage`.
- Tracks seek state as `{ timestamp, id }`, so a repeated seek to the same position still fires.

**PagePreview** (`_components/PagePreview.tsx`) handles preview for non-meditation page content,
using the same `useLivePreview` pattern.
