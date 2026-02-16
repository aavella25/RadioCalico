# GitHub Actions Workflows

This directory contains automated CI/CD workflows for Radio Calico.

## Workflows

### 1. CI - Tests and Security (`ci.yml`)

**Triggers:**
- Push to `master` or `main` branch
- Pull requests to `master` or `main` branch

**Jobs:**

#### Test Job
- Runs on: Ubuntu Latest
- Node.js versions: 18.x, 20.x, 22.x
- Steps:
  - Install dependencies
  - Run unit tests (63 tests)
  - Generate coverage report
  - Upload coverage to Codecov
  - Archive test results as artifacts

#### Security Job
- Runs on: Ubuntu Latest
- Node.js version: 20.x
- Steps:
  - Run npm audit
  - Generate security report using `security-scan.sh`
  - Upload security reports as artifacts
  - Check for high/critical vulnerabilities
  - Create warnings for security issues

#### Lint Job
- Runs on: Ubuntu Latest
- Node.js version: 20.x
- Steps:
  - Check JavaScript syntax
  - Validate package.json

#### Docker Job
- Runs on: Ubuntu Latest
- Steps:
  - Build development Docker image
  - Build production Docker image
  - Test production image
  - Use GitHub Actions cache for faster builds

#### Status Check Job
- Runs after all other jobs complete
- Verifies all jobs passed successfully
- Fails if any job failed

**Artifacts:**
- Test results and coverage (7 days retention)
- Security reports (30 days retention)

### 2. Scheduled Security Scan (`security-scan.yml`)

**Triggers:**
- Schedule: Every Monday at 9:00 AM UTC
- Manual trigger via workflow_dispatch

**Jobs:**

#### Weekly Security Audit
- Runs comprehensive security audit
- Checks production dependencies separately
- Generates detailed reports
- Uploads artifacts with 90 days retention
- Creates GitHub issue if vulnerabilities found

**Artifacts:**
- Weekly security scan reports (90 days retention)
- Production dependency audit
- Full dependency audit

### 3. Dependabot Configuration (`dependabot.yml`)

**Updates:**

#### npm Dependencies
- Schedule: Weekly on Monday at 9:00 AM
- Groups minor/patch updates
- Separate groups for dev and production dependencies
- Limit: 10 open PRs

#### Docker Base Images
- Schedule: Weekly on Monday
- Updates base images in Dockerfile

#### GitHub Actions
- Schedule: Weekly
- Updates action versions

## Viewing Results

### GitHub UI
1. Go to repository → Actions tab
2. Select workflow from left sidebar
3. Click on specific run to see details
4. Download artifacts from run page

### Status Badges
Status badges are displayed in README.md:
- CI Tests and Security status
- Scheduled security scan status

## Artifacts

### Test Results
- **Retention:** 7 days
- **Contents:**
  - Coverage reports
  - Test logs
  - Multiple Node.js version results

### Security Reports
- **Retention:** 30 days (CI), 90 days (scheduled)
- **Contents:**
  - SECURITY_REPORT.md (human-readable)
  - audit-report.json (machine-readable)
  - Weekly audit summaries

## Local Testing

Before pushing, test workflows locally:

```bash
# Run tests
npm test

# Run security scan
make security-scan

# Run with coverage
npm test -- --coverage

# Build Docker images
docker build -t radio-calico:dev --target development .
docker build -t radio-calico:prod --target production .
```

## Troubleshooting

### Test Failures
1. Check test logs in artifacts
2. Run tests locally: `npm test`
3. Check for environment differences

### Security Scan Warnings
1. Review SECURITY_REPORT.md artifact
2. Run locally: `make security-report`
3. Determine if vulnerabilities affect production
4. Apply fixes: `make security-fix`

### Docker Build Failures
1. Check Dockerfile syntax
2. Verify all dependencies are in package.json
3. Test build locally: `docker build .`

## Maintenance

### Updating Workflows
1. Edit workflow files in `.github/workflows/`
2. Test changes on a branch first
3. Monitor first run after merge

### Adjusting Security Thresholds
To change security audit level in `ci.yml`:
```yaml
# Change from moderate to high
npm audit --audit-level=high
```

### Modifying Test Matrix
To add/remove Node.js versions in `ci.yml`:
```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x, 24.x]  # Add/remove versions
```

## Best Practices

1. **Always run tests locally** before pushing
2. **Review security reports** weekly
3. **Keep dependencies updated** via Dependabot PRs
4. **Monitor workflow runs** for failures
5. **Address security issues** promptly

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [npm audit Documentation](https://docs.npmjs.com/cli/v10/commands/npm-audit)
