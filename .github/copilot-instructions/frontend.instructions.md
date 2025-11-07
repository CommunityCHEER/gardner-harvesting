applyTo: "emoda.client/**/*.{ts,tsx,js,jsx,css,json,md,mdx}"
description: "React/TypeScript Frontend Development Guidelines (React Query, API Policy)"

## Frontend (React + TypeScript + Vite)

- **Project Structure**: `emoda.client/` - Vite-based React TypeScript SPA
- **Build Tool**: Vite with hot module replacement and TypeScript support
- **Environment Management**: Multiple `.env` files (dev, stage, production)
- **API Integration**: Use React Query (`@tanstack/react-query`) for all data fetching, caching, and mutations. **Avoid legacy `executeApiCall` and custom loading patterns.**

### Constraints
- Yarn Berry PnP and dlx only.
- Client build/install is always manual; no automatic client-side package manager commands during .NET builds.

### API URL Policy (Critical)

This application runs under different base paths in different environments:
- Local: `/` (root)
- Dev/Production: `/emoda/`
- Stage: `/emodastage/`

**For React Router Navigation (Links, Breadcrumbs, Routes):**
MUST NOT use leading slash. Always use relative paths without leading slash.

```typescript
// ❌ WRONG - Leading slash omits base path
<Link to="/dashboard">Dashboard</Link>
navigate('/cpa/requests')
{ label: 'Home', url: '/dashboard' }

// ✅ CORRECT - Relative path includes base path via React Router basename
<Link to="dashboard">Dashboard</Link>
navigate('cpa/requests')
{ label: 'Home', url: 'dashboard' }
```

**For API Calls:**
Always use `apiClient.apiRequest()` which handles base URL resolution automatically. For special cases requiring direct `fetch()` (like file downloads with binary responses), use the `APP_BASE_URL` constant:

```typescript
// ✅ CORRECT - apiClient handles base URL
import { apiRequest } from '@/apis/apiClient';
const data = await apiRequest<T>('api/cpa/requests', { ... });

// ✅ CORRECT - Direct fetch for special cases (file downloads, etc.)
import { APP_BASE_URL } from '@/constants';
const url = `${window.location.origin}${APP_BASE_URL}/api/files/download/${id}`;
const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
```

**Rationale:**
- React Router: Leading slash (`/dashboard`) resolves from server root, omitting the base path segment (e.g., `/emoda`), breaking navigation in non-local environments.
- API calls: `apiClient` automatically prepends the correct base URL from `API_BASE` constant. For direct `fetch()`, use `APP_BASE_URL` to ensure correct path construction.

**Enforcement:**
If you see a leading slash in React Router navigation URLs, you must correct it and raise it as a finding. If you see direct `fetch()` calls without `APP_BASE_URL` or outside `apiClient`, raise it as a finding.

### State Management & Error Handling
- Use React Query's built-in loading and error states.
- Standardize on `ApiError` and `ProblemDetails` for API errors.
- Use toast notifications for user-facing errors.

### Local Development
- **Backend**: ASP.NET Core Web API running on https://localhost:7023
- **Frontend**: Vite dev server on https://localhost:51075
- **Swagger**: API documentation at https://localhost:7023/swagger

### Testing Structure
- **Unit Tests**: `emoda.client.tests/` for frontend testing
- **Development**: Hot reload enabled for rapid iteration

### TDD Implementation Workflow (MANDATORY)

For EACH new behavior:

**Frontend Example:**
1. 🔴 Create test file `Component.test.tsx` → Run `yarn workspace emoda.client test` → **EXPECT FAIL**
2. 🟢 Implement `Component.tsx` → Run `yarn workspace emoda.client test` → **EXPECT PASS**
3. 🔵 Refactor → Run `yarn workspace emoda.client test` → **EXPECT PASS**

**Reference:** See `docs/20251016-tdd-workflow-guide.md` for complete workflow examples, anti-patterns, and technology-specific guidance (if available).
