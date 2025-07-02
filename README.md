# RiddleMeThis.io

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
