import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Duration } from './Duration'

const text = (el: React.ReactElement) => renderToStaticMarkup(el).replace(/<[^>]+>/g, '') // strip tags, keep text

describe('<Duration>', () => {
  it('renders whole minutes for >= 1 minute', () => {
    expect(text(<Duration seconds={600} />)).toBe('10 min')
    expect(text(<Duration minutes={20} />)).toBe('20 min')
  })

  // Sub-minute durations (e.g. a short lecture clip window) used to floor to
  // "0 min"; they now render in seconds.
  it('renders seconds for sub-minute durations instead of "0 min"', () => {
    expect(text(<Duration seconds={40} />)).toBe('40 sec')
    expect(text(<Duration format="minimal" seconds={40} />)).toBe('40s')
    expect(text(<Duration format="long" seconds={1} />)).toBe('1 second')
    expect(text(<Duration format="long" seconds={40} />)).toBe('40 seconds')
  })

  it('still shows 0 min only when the duration is genuinely zero', () => {
    expect(text(<Duration seconds={0} />)).toBe('0 min')
  })
})
