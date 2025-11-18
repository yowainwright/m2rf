# Contributing to m2rf

Thanks for your interest in contributing to m2rf! This guide will help you get started.

## Development Setup

1. Fork and clone the repository
2. Install Bun (recommended via mise or direct install from bun.sh)
3. Install dependencies: `bun install`

## Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run tests: `bun test`
4. Type check: `bun run typecheck`
5. Build project: `bun run build`

## Testing

- Unit tests: `bun test`
- Watch mode: `bun test --watch`
- Coverage: `bun test --coverage`
- All checks: `bun run typecheck && bun test && bun run build`

## Code Style

- TypeScript strict mode enabled
- No `any` types (use `unknown` or proper types)
- Prefer `const` over `let`
- Functional programming patterns preferred
- Extract complex conditionals into well-named variables
- Keep functions single-purpose and under 20 lines

## Pull Request Process

1. Ensure all tests pass
2. Ensure type check passes
3. Ensure build succeeds
4. Update documentation if needed
5. Create a pull request with a clear description
6. Link any related issues

## Issue Reporting

When reporting issues, please include:

- React version
- m2rf version
- Browser (if applicable)
- Minimal reproduction case
- Error messages and stack traces

## Questions?

Feel free to open an issue for questions or join discussions in existing issues.
