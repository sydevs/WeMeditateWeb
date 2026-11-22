/**
 * Templates are page layout structures, following Atomic Design.
 *
 * Templates represent page-level layouts without real content. They
 * combine organisms, molecules, and atoms into complete page structures.
 */

export { PageTemplate } from './PageTemplate/PageTemplate'
export type { PageTemplateProps } from './PageTemplate/PageTemplate'

export { MeditationTemplate } from './MeditationTemplate/MeditationTemplate'
export type { MeditationTemplateProps } from './MeditationTemplate/MeditationTemplate'

export { LectureTemplate, LecturePlayer } from './LectureTemplate/LectureTemplate'
export type { LectureTemplateProps, LecturePlayerProps } from './LectureTemplate/LectureTemplate'
