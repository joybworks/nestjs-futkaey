# Contributing

## Setup

```bash
npm install   # Installs Husky; prepare script configures commit-msg hook
npm run build
npm run lint
```

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/). Commitlint validates messages via the Husky `commit-msg` hook:

```
<type>(<scope>): <subject>
```

Examples:

- `feat(repository): add findByIds`
- `fix(aggregate): tenant context for custom hierarchy`
- `docs: tenancy examples`

## Release

Versioning is automated via [standard-version](https://github.com/conventional-changelog/standard-version). When PRs are merged to `main` with conventional commits, the CI runs `standard-version`, creates a git tag, and publishes to npm.

See [README.md#release-process](./README.md#release-process) for details.
