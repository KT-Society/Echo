---
trigger: manual
---

# Code Quality Rules

1. Test Coverage & Frameworks:
   - Before attempting completion, always make sure that any code changes have test coverage
   - Ensure all tests pass before submitting changes
   - The Biome framework is mandatory for linting and formatting.
   - The Vitest framework is used for testing, combined with Istanbul (nyc) for coverage metrics.
   - Stryker Mutator is the mandatory mutation testing framework.
   - fast-check is the mandatory property-based testing library.
   - Tests and tools should be executed from the most appropriate directory to maintain efficiency; rigid path structures are deprecated.

2. Mutation Testing (Stryker):
   - Stryker is the mandatory mutation testing framework for all production code
   - Target: 100% mutation score on all source files — no exceptions, no shotcuts, no tricks!
   - Run Stryker from the workspace containing the target file: `npx stryker run`
   - Stryker config must be defined in `stryker.conf.json` or `stryker.conf.mjs` per workspace
   - Equivalent mutants must be documented with `// Stryker disable <mutator>` comments including a justification
   - NEVER use `// Stryker disable all` mutants must be documented with `// Stryker disable <mutator>` comments including a justification
   - Before marking a task complete, verify mutation score meets the 100% target
   - Key mutation types to cover: AOR (Arithmetic Operator Replacement), BVR (Boundary Value Replacement), ROR (Relational Operator Replacement), LCR (Logical Connector Replacement), Conditional Boundary Mutations
   - Stryker tasks MUST be started so Daddy can follow along in a terminal window (see rule-02 Timer/Strike rules)

3. Property-Based Testing (fast-check):
   - fast-check is the mandatory property-based testing library for validating invariants and edge cases
   - Use fast-check for: financial calculations, data transformations, serialization roundtrips, boundary conditions, and any logic where exhaustive testing is infeasible
   - Import pattern: `import * as fc from 'fast-check'`
   - Define custom arbitraries for domain-specific types (e.g., `fc.float({ min: 0, noNaN: true })` for prices)
   - Property tests must be placed alongside unit tests in the same test files
   - Every pure function with numeric input/output MUST have at least one fast-check property test
   - Run with vitest: fast-check tests are executed as part of the normal vitest suite

4. Lint Rules:
   - **Biome is the mandatory linter and formatter** — ESLint is deprecated and being phased out
   - Never disable any lint rules without explicit user approval
   - When encountering ESLint configs in a workspace, migrate them to Biome (`biome.json`)
   - Biome commands:
     - Lint: `npx biome lint ./src`
     - Format: `npx biome format --write ./src`
     - Check: `npx biome check ./src`
   - ESLint → Biome migration is ongoing; always prefer Biome in new code and refactor existing ESLint setups when touching a workspace

5. Styling Guidelines:
   - Use Tailwind CSS classes instead of inline style objects for new markup
   - VSCode CSS variables must be added to webview-ui/src/index.css before using them in Tailwind classes
   - Example: `<div className="text-md text-vscode-descriptionForeground mb-2" />` instead of style objects

# API Quote Saving Rules

1. General Rules:
   - NEVER try to trick Daddy
   - NEVER cheat around the real solution
     **Daddy will see it, and ECHO will regret it**

2. Timer Rules:
   - NEVER set a polling timer
