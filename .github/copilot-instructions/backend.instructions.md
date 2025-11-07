applyTo: "EMODA.Server/**/*.{cs,csproj}"
description: "ASP.NET Core Backend Development and Architecture Guidelines"
## Backend (.NET Core Web API)
- **Project Structure**: `EMODA.Server/` - Main API project with standard ASP.NET Core Web API template
- **Data Layer**: `EMODA.Data/` - Entity Framework models and database context
- **Database**: SQL Server with Entity Framework Core migrations
- **Models**: Transitioned from Database-first approach with views like `VwProlaunch` containing user/approval workflow data to Code-first approach with dedicated model classes
- **API Endpoints**: RESTful endpoints following ASP.NET Core conventions
- **Configuration**: Multi-environment support (Development/Staging/Production)

### Local Development
- **Backend**: ASP.NET Core Web API running on https://localhost:7023
- **Frontend**: Vite dev server on https://localhost:51075
- **Swagger**: API documentation at https://localhost:7023/swagger
- **Auto-launch**: VS Code task automatically opens both URLs after 8-second delay

### TDD Workflow (MANDATORY)

All code changes MUST follow the Red-Green-Refactor cycle. **No exceptions.**

#### The Cycle

1. 🔴 **RED: Write a Failing Test First**
   - Define expected behavior in a test
   - Run test and **confirm it fails** (proves test is valid)
   - Failure should indicate missing behavior, not syntax errors

2. 🟢 **GREEN: Implement Minimum Code to Pass**
   - Write only enough code to make the test pass
   - Avoid adding extra features or "nice-to-haves"
   - Run test and **confirm it passes**

3. 🔵 **REFACTOR: Improve Without Breaking**
   - Clean up implementation (extract methods, improve names, remove duplication)
   - Run tests after each change to ensure behavior unchanged
   - Keep tests passing throughout

**Rule:** Tests ALWAYS come before implementation. Period.
**Rule:** Backend changes can break frontend features -- always ensure frontend tests pass before and after backend changes.


#### Implementation Workflow

For EACH new behavior:

**Backend Example:**
1. 🔴 Create test in `EMODA.Server.Tests/` → Run `dotnet test EMODA.Server.Tests/EMODA.Server.Tests.csproj --no-build` → **EXPECT FAIL**
2. 🟢 Implement in `EMODA.Server/` → Run `dotnet test EMODA.Server.Tests/EMODA.Server.Tests.csproj --no-build` → **EXPECT PASS**
3. 🔵 Refactor → Run `dotnet test EMODA.Server.Tests/EMODA.Server.Tests.csproj --no-build` → **EXPECT PASS**

**Reference:** See `docs/20251016-tdd-workflow-guide.md` for complete workflow examples, anti-patterns, and technology-specific guidance (if available).
