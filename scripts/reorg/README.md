# Replaying the folder reorganisation (#327) on an open branch

Temporary: delete this folder once no open PR predates #327.

On a branch cut before #327, from the repo root:

```bash
node scripts/reorg/moves.mjs .   # git mv every moved file, rewrite imports to `@/`
node scripts/reorg/moves.mjs .   # a second pass settles the imports the first pass moved under
git commit -am "refactor: replay the #327 moves"
git merge origin/main            # what is left are real conflicts
node scripts/reorg/split-imports.mjs .   # re-point imports of symbols #327 moved between files
pnpm exec eslint --fix . && pnpm exec tsc --noEmit
```

The scripts are idempotent. What they cannot replay is the content #327 split: `client.ts` into
`server/sahajcloud/*.ts`, `sitemap-routes.ts` into `robots.txt/`, `sitemap.xml/` and
`manifest.webmanifest/`, and the parts of `types/sahajcloud.ts`, `server/error-utils.ts` and
`sitemap.ts` that moved to `lib/`. A branch that edited one of those re-applies its change by hand.
