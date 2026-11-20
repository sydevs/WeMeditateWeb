/**
 * The SELECT statements that export the old site's public URL inventory.
 *
 * ⚠ SELECT only: the export must never write to Heroku. A row is exported
 * only when it has been published at some point (`state` 2 archived, 3
 * published or 4 unpublished), so the address of a never-published draft
 * and its working title never reach the repo.
 */

export const QUERIES = {
  articles: `select t.article_id as id, a.category_id, a.article_type, t.locale, t.slug, t.name, t.state, t.published_at::date as published_at from article_translations t join articles a on a.id = t.article_id where t.state in (2,3,4) and t.slug is not null order by t.article_id, t.locale`,
  staticPages: `select t.static_page_id as id, a.role, t.locale, t.slug, t.name, t.state, t.published_at::date as published_at from static_page_translations t join static_pages a on a.id = t.static_page_id where t.state in (2,3,4) and t.slug is not null order by t.static_page_id, t.locale`,
  meditations: `select t.meditation_id as id, t.locale, t.slug, t.name, t.state, t.published_at::date as published_at, (t.horizontal_vimeo_id is not null or t.vertical_vimeo_id is not null) as has_video from meditation_translations t where t.state in (2,3,4) and t.slug is not null order by t.meditation_id, t.locale`,
  treatments: `select t.treatment_id as id, t.locale, t.slug, t.name, t.state, t.published_at::date as published_at from treatment_translations t where t.state in (2,3,4) and t.slug is not null order by t.treatment_id, t.locale`,
  subtleSystemNodes: `select t.subtle_system_node_id as id, a.role, t.locale, t.slug, t.name, t.state, t.published_at::date as published_at from subtle_system_node_translations t join subtle_system_nodes a on a.id = t.subtle_system_node_id where t.state in (2,3,4) and t.slug is not null order by t.subtle_system_node_id, t.locale`,
  categories: `select t.category_id as id, t.locale, t.slug, t.name, t.published, t.published_at::date as published_at from category_translations t where (t.published or t.published_at is not null) and t.slug is not null order by t.category_id, t.locale`,
  streams: `select id, locale, slug, name, state, published_at::date as published_at from streams where state in (2,3,4) and slug is not null order by id`,
  promoPages: `select id, locale, slug, name, state, published_at::date as published_at from promo_pages where state in (2,3,4) and slug is not null order by id`,
  slugHistory: `select slug, sluggable_id, sluggable_type, locale from friendly_id_slugs where sluggable_type in ('Article','Meditation','PromoPage','Stream','SubtleSystemNode','Treatment') order by id`,
  exportedOn: `select now()::date as exported_on`,
} as const

export type QueryName = keyof typeof QUERIES
