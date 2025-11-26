# Project README

This repository contains a Node/Express app. Important note regarding Zone.Identifier files:

- Some Windows users or certain download configurations may produce files named like `schema.prisma:Zone.Identifier`.
- These files are not needed on Linux and often get committed accidentally.

To avoid them being committed:

1. Run the cleanup script to remove any existing files:

```bash
npm run clean:zone
```

2. Install the repository's git hooks (one-time) to automatically remove Zone.Identifier files before commit:

```bash
npm run install-hooks
```

This will configure a project-scoped git hooks path and add a `pre-commit` hook that runs the cleanup script.

3. The repository already ignores these files via `.gitignore` (`*Zone.Identifier`).

If you prefer to use Husky or another hook manager, you can adapt `githooks/pre-commit` or replace the hook with your preferred tooling.
