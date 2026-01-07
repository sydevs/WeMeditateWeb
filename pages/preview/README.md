# Preview Routes

This directory contains preview routes for PayloadCMS live preview functionality. These pages are rendered inside iframes in the SahajCloud admin panel.

## Routes

- `/preview` - Main preview route that handles pages and meditations
- `/preview/embed` - Embedded preview route with minimal UI (LayoutEmbed)

## PostMessage Protocol

The preview components communicate with the SahajCloud admin panel via `window.postMessage`. All messages are validated against `PUBLIC__SAHAJCLOUD_URL` origin for security.

### Outbound Messages (Preview → Admin)

#### PLAYBACK_TIME_UPDATE

Sent during meditation playback to sync the current position with the admin UI.

```typescript
{
  type: 'PLAYBACK_TIME_UPDATE',
  currentTime: number  // Time in seconds (integer, floored)
}
```

**Frequency**: Every 100ms during playback, plus on play/pause/seek events.

**Use case**: Highlighting the current frame thumbnail in the admin panel.

### Inbound Messages (Admin → Preview)

#### SEEK_TO_TIME

Sent when an editor clicks a frame thumbnail to jump to that position.

```typescript
{
  type: 'SEEK_TO_TIME',
  timestamp: number  // Time in seconds (integer)
}
```

**Response**: The player seeks to the specified timestamp and continues sending `PLAYBACK_TIME_UPDATE` messages.

## Testing

From the SahajCloud admin console, you can test the seek functionality:

```javascript
// Get the preview iframe
const iframe = document.querySelector('iframe')

// Send seek command
iframe.contentWindow.postMessage(
  { type: 'SEEK_TO_TIME', timestamp: 30 },
  '*'  // Or use specific origin for security
)
```

## Security

- **Origin validation**: Messages are validated against `PUBLIC__SAHAJCLOUD_URL`
- **Fallback**: If the env var is not set, falls back to `'*'` with a console warning
- **Type checking**: Message payloads are validated before processing

## Implementation Details

### MeditationPreview Component

Located at `_components/MeditationPreview.tsx`:

1. Uses `useLivePreview` hook from PayloadCMS for real-time content updates
2. Listens for `SEEK_TO_TIME` messages via `window.addEventListener('message', ...)`
3. Sends `PLAYBACK_TIME_UPDATE` messages via `window.parent.postMessage(...)`
4. Uses counter-based seek state (`{ timestamp, id }`) to allow repeated seeks to same position

### PagePreview Component

Located at `_components/PagePreview.tsx`:

- Handles page content preview (non-meditation content)
- Uses same `useLivePreview` pattern for real-time updates
