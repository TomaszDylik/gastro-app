# CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment.

## Workflows

### Pull Request Workflow (`pr.yml`)

Runs on every pull request to `main`:

1. **Code Quality**
   - ESLint checks
   - TypeScript type checking
   - Prettier format validation
   - Security audit

2. **Tests**
   - Unit tests (Vitest)
   - E2E tests (Playwright)

3. **Build**
   - Next.js production build
   - Verifies no build errors

**Status:** PR cannot be merged if any step fails.

### Main Branch Workflow (`main.yml`)

Runs on every push to `main`:

1. **Tests**
   - Full test suite

2. **Build**
   - Production build
   - Artifacts uploaded

3. **Deploy** (Optional - commented out by default)
   - Auto-deploy to Vercel

## Local Development

### Run Linter

```bash
pnpm lint
```

### Format Code

```bash
pnpm format
```

### Check Formatting

```bash
pnpm format:check
```

### Run Tests

```bash
pnpm test
```

### Type Check

```bash
pnpm tsc --noEmit
```

## Configuration Files

- `.eslintrc.json` - ESLint rules (TypeScript strict mode)
- `.prettierrc` - Prettier formatting rules
- `.prettierignore` - Files to ignore in formatting
- `.github/workflows/pr.yml` - PR CI workflow
- `.github/workflows/main.yml` - Main branch CI/CD workflow

## Required GitHub Secrets

For CI/CD to work, add these secrets in GitHub repository settings:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

### Optional (for auto-deploy):

- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

## Branch Protection Rules

Recommended settings for `main` branch:

1. ✅ Require pull request before merging
2. ✅ Require status checks to pass:
   - Code Quality & Tests
   - Security Audit
3. ✅ Require branches to be up to date
4. ✅ Do not allow bypassing the above settings
