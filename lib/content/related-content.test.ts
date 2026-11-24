import { describe, it, expect } from 'vitest'
import { relatedMeditationsToCards, relatedLecturesToCards } from './related-content'

describe('relatedMeditationsToCards', () => {
  it('maps to grid cards linking to the full meditation route with a play button', () => {
    const cards = relatedMeditationsToCards([
      {
        id: 141,
        title: 'Meditation for Vishuddhi',
        durationMinutes: 19,
        thumbnailUrl: 'https://imagedelivery.net/acct/abc/public',
        narratorName: 'Sidd',
      },
    ])

    expect(cards).toEqual([
      {
        id: 141,
        title: 'Meditation for Vishuddhi',
        href: '/meditations/141',
        thumbnailSrc: 'https://imagedelivery.net/acct/abc/public',
        thumbnailAlt: 'Meditation for Vishuddhi',
        aspectRatio: 'video',
        playButton: true,
        durationMinutes: 19,
      },
    ])
  })

  it('omits a sub-1-minute duration badge (no "0 min")', () => {
    const [card] = relatedMeditationsToCards([
      {
        id: 1,
        title: 'T',
        durationMinutes: 0,
        thumbnailUrl: 'https://x/y/public',
        narratorName: '',
      },
    ])

    expect(card.durationMinutes).toBeUndefined()
  })
})

describe('relatedLecturesToCards', () => {
  it('maps to grid cards linking to the full lecture route, seconds → minutes', () => {
    const cards = relatedLecturesToCards([
      {
        id: 150,
        title: 'Truth Has to Be Experienced',
        durationSeconds: 952,
        thumbnailUrl: 'https://img.youtube.com/vi/abc/mqdefault.jpg',
      },
    ])

    expect(cards).toEqual([
      {
        id: 150,
        title: 'Truth Has to Be Experienced',
        href: '/lectures/150',
        thumbnailSrc: 'https://img.youtube.com/vi/abc/mqdefault.jpg',
        thumbnailAlt: 'Truth Has to Be Experienced',
        aspectRatio: 'video',
        playButton: true,
        durationMinutes: 16, // round(952 / 60)
      },
    ])
  })

  it('omits the duration badge when the clip length is unknown (0s)', () => {
    const [card] = relatedLecturesToCards([
      { id: 2, title: 'L', durationSeconds: 0, thumbnailUrl: 'https://img/y.jpg' },
    ])

    expect(card.durationMinutes).toBeUndefined()
  })
})
