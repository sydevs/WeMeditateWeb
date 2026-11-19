import { fireEvent, screen } from '@testing-library/react'

/**
 * Click a popover trigger by its accessible name, and hand back it with the
 * panel it says it controls. Needs a jsdom test file.
 *
 * Resolving `aria-controls` is itself the check that the reference is real:
 * axe answers "needs review" rather than "violation" for it over a fragment,
 * so a trigger pointing at nothing fails here instead of passing silently.
 */
export function openPanel(name: string | RegExp) {
  const trigger = screen.getByRole('button', { name })

  fireEvent.click(trigger)

  const panel = document.getElementById(trigger.getAttribute('aria-controls') ?? '')

  if (!panel) throw new Error('the trigger controls no rendered panel')

  return { trigger, panel }
}
