# RiddleMeThis.io

## CI/CD Pipeline

<!-- Note: Testing deploying through Cloudflare wich may invalidate the github actions system here -->

The project uses GitHub Actions for continuous integration and deployment.

- **api**: `.github/workflows/ci.yml` will trigger deploy to Cloudflare production workers on push to `production` branch of the api.
- **web**: Cloudflare listens for push to `production` to trigger web app production deploys.

While these are both triggered by the same event they are managed by two different services and one may be done a few seconds or minutes before the other. The web app will display the versions of both `web` and `api` in browser console, and if there is a mismatch a banner will appear in the footer of the main page.

### Pipeline Overview

- **Main branch:** Runs tests, linting, type checking, and builds on every push
- **Production branch:** Runs full CI pipeline + deploys to production
- **Pre-commit hooks:** Run identical checks locally to maintain sync with CI

### Quality Checks (Local & CI)

Both pre-commit hooks and GitHub Actions run the same checks:

```bash
npm run lint        # ESLint checking
npm run type-check  # TypeScript checking
npm run build       # Build all packages
```

For sanity and simplicity: Pre-commit hooks and CI should always be in sync. If a commit passes locally but fails in CI, see what's been changed recently in `package.json` or `ci.yml` and realign them.

### Git Branch Sync Helper

Automatic branch sync checking is enabled via Husky git hooks. When you checkout any branch, it automatically:

- Checks if the branch is behind remote
- Detects version mismatches in `package.json`
- Provides interactive options to pull, view changes, or skip

This helps stay synced with version bumps from the CI/CD pipeline. Note that the workflow (`ci.yml`) automatically merges remote `production` into `main` after automatically bumping the version during update/deploy.

## Deployment

### Normal Production Deploy (Recommended)

```bash
git checkout production
git merge main
git push origin production
```

- Auto-patch version bump (0.0.1 → 0.0.2)
- Runs tests, deploys web app and API
- Sends email notifications on failure

### Version-Controlled Production Deploy

```bash
npm run deploy:prod:minor  # New features (0.0.1 → 0.1.0)
npm run deploy:prod:major  # Breaking changes (0.0.1 → 1.0.0)
```

- Runs tests and full deployment locally
- Skips auto-increment when pushed to production

### Emergency Deploy (API Only)

```bash
npm run deploy:prod  # Tests + API deploy, no version change
```

### Version Management

- **Patch (0.0.1 → 0.0.2):** Bug fixes, small changes, daily deploys
- **Minor (0.0.1 → 0.1.0):** New features, backward compatible updates
- **Major (0.0.1 → 1.0.0):** Breaking changes, major releases

**Manual version bump (optional):**

```bash
npm version patch --workspaces   # Bug fixes
npm version minor --workspaces   # New features
npm version major --workspaces   # Breaking changes
```

When manually bumping versions, use `npm run deploy:prod` to skip auto-version-bump.

**Typical workflow:**

1. Work on `main` branch
2. When ready: `git checkout production && git merge main && git push origin production`
3. GitHub Actions handles versioning and deployment automatically

**Optional GitHub Actions manual deploy:** Go to Actions tab → "Deploy to Cloudflare" → "Run workflow" → Select version bump type

### Rollback

```bash
# Rollback both web and API:
git revert <commit-hash>
git checkout production
git merge main
git push origin production

# Quick API-only rollback:
git revert <commit-hash>
npm run deploy:prod
```

### Version Check

- Web app displays version mismatch warnings if API/web versions differ
- Check `/health` endpoint for API version info
