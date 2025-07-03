# RiddleMeThis.io

## CI/CD Pipeline

**GitHub Actions:** Handles testing, linting, type checking, and builds on every push.

**Cloudflare Git Integration:** Handles all deployments automatically:

- **API (Worker):** Auto-deploys from `main` → dev environment, `production` → production environment
- **Web (Pages):** Auto-deploys from `production` branch to riddlemethis.io

The web app displays version information in browser console and shows a banner if API/web versions don't match.

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

### Git Hooks

The project uses Husky for automated git workflows:

- **Pre-commit:** Runs linting and formatting on staged files
- **Post-checkout:** Checks for version mismatches when switching branches, offers to sync
- **Pre-push:** Interactive version bumping when pushing to production branch

## Deployment & Version Management

### Production Deploy Workflow

```bash
# 1. Develop on main branch
git checkout main
# ... make changes ...
git add . && git commit -m "your changes"

# 2. Deploy to production
git checkout production
git merge main
git push origin production  # Triggers interactive version bump
```

### Interactive Version Bumping

When pushing to `production`, a pre-push hook will prompt:

- **Patch:** Bug fixes, small changes (0.0.1 → 0.0.2)
- **Minor:** New features, backward compatible (0.0.1 → 0.1.0)
- **Major:** Breaking changes (0.0.1 → 1.0.0)
- **No bump:** Deploy current version

### Manual Version Control

```bash
# If you need to bump versions outside of deployment:
npm version patch --workspaces   # Bug fixes
npm version minor --workspaces   # New features
npm version major --workspaces   # Breaking changes
git add . && git commit -m "chore: bump version to X.X.X"
```

### Environments

- **Development:** `main` branch → `riddle-me-this-api-dev.benmiriello.workers.dev`
- **Production:** `production` branch → `riddlemethis.io` (web) + `riddle-me-this-api.benmiriello.workers.dev` (API)

### Rollback

```bash
git revert <commit-hash>
git push origin production  # Cloudflare auto-deploys the rollback
```
