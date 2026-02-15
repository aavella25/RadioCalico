# Radio Calico Testing Guide

## Overview

This test suite implements **Option A: Pragmatic Testing** with focus on high-value integration tests and unit tests for pure functions.

## Test Structure

### Backend Tests (`server.test.js`)
Integration tests for the ratings API using supertest and in-memory SQLite database.

**Coverage:**
- ✅ Rating creation (POST /api/ratings)
- ✅ Rating updates (changing votes)
- ✅ Rating retrieval (GET /api/ratings/:songId)
- ✅ Input validation (missing fields, invalid values)
- ✅ Concurrent operations
- ✅ Edge cases (unicode, special characters, long strings)
- ✅ User vote tracking
- ✅ Health check endpoint

**Key Test Scenarios:**
- New rating submission
- Vote updates (up → down, down → up)
- Multiple users rating same song
- Rating validation (must be 'up' or 'down')
- User context in queries
- Concurrent vote handling

### Frontend Tests (`frontend.test.js`)
Unit tests for pure utility functions extracted from radio-calico.js.

**Coverage:**
- ✅ Song ID generation (Base64 encoding)
- ✅ User ID management (localStorage)
- ✅ Metadata parsing
- ✅ Rating validation
- ✅ Integration scenarios

**Key Test Scenarios:**
- Consistent song ID generation
- Special character handling
- User ID persistence
- Metadata defaults
- Rapid song changes

### Test Helpers (`test-helpers.js`)
- In-memory database creation for isolated tests
- Database cleanup utilities

### Utility Functions (`public/radio-calico-utils.js`)
- Extracted pure functions from radio-calico.js
- Testable in isolation without DOM dependencies

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Output

```
PASS  ./frontend.test.js
PASS  ./server.test.js

Test Suites: 2 passed, 2 total
Tests:       XX passed, XX total
```

## Test Philosophy

### What We Test
- ✅ API endpoints (integration)
- ✅ Business logic (ratings, validation)
- ✅ Data persistence (database operations)
- ✅ Pure functions (song ID, parsing)
- ✅ Edge cases and error handling

### What We Don't Test (Yet)
- ❌ UI interactions (would require jsdom/testing-library)
- ❌ HLS streaming functionality
- ❌ Audio visualizer
- ❌ Real localStorage (we mock it)
- ❌ Network requests (we mock fetch)

## Test Isolation

Each test:
- Uses an **in-memory SQLite database** (fast, isolated)
- Clears the ratings table between tests
- Does not affect the production database.db file
- Runs independently (no shared state)

## Adding New Tests

### Backend Tests

1. Add test to `server.test.js`:
```javascript
test('should do something', async () => {
  const response = await request(app)
    .post('/api/endpoint')
    .send({ data: 'value' })
    .expect(200);

  expect(response.body).toMatchObject({ ... });
});
```

2. Use `beforeEach` to reset database state if needed

### Frontend Tests

1. Extract pure function to `public/radio-calico-utils.js`
2. Add test to `frontend.test.js`:
```javascript
test('should do something', () => {
  const result = myFunction(input);
  expect(result).toBe(expected);
});
```

## Coverage Goals

**Current Focus (Option A - Pragmatic):**
- High-value paths: ✅ Rating submission and retrieval
- Critical validation: ✅ Input validation, rating constraints
- Edge cases: ✅ Concurrent votes, special characters

**Future Expansion (Option B - Comprehensive):**
- Refactor radio-calico.js into modules
- Add UI component tests
- Add E2E tests with Playwright
- Mock HLS.js for streaming tests
- Test metadata polling

## Continuous Integration

To add CI/CD (GitHub Actions example):

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
```

## Debugging Tests

```bash
# Run specific test file
npx jest server.test.js

# Run specific test by name
npx jest -t "should create a new rating"

# Run with more detail
npx jest --verbose --no-coverage

# Debug in Node.js
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Known Limitations

1. **Database Mocking**: Uses Proxy to inject test database - works but not ideal
2. **Frontend Coupling**: Main radio-calico.js not tested directly (needs refactoring)
3. **No E2E**: Would need Playwright/Cypress for full user flow testing
4. **No Visual Tests**: Visualizer and animations not tested

## Next Steps

### Quick Wins
- [ ] Test user management endpoints (/api/users)
- [ ] Add negative test cases for malformed requests
- [ ] Test SQL injection prevention
- [ ] Add tests for album art cache busting

### Medium Effort
- [ ] Refactor radio-calico.js to use imported utils
- [ ] Add DOM tests with jsdom
- [ ] Mock fetch for API call tests
- [ ] Test error handling UI

### Long Term
- [ ] Set up Playwright for E2E tests
- [ ] Add visual regression tests
- [ ] Load testing for concurrent ratings
- [ ] Test HLS streaming with mock player

## References

- Jest Documentation: https://jestjs.io/docs/getting-started
- Supertest: https://github.com/ladjs/supertest
- Testing Best Practices: https://github.com/goldbergyoni/javascript-testing-best-practices
