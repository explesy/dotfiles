# Archived Codex project integrations

This directory holds inactive, project-specific Codex configuration removed on 2026-08-12. Nothing here is loaded by Codex automatically.

Archived items:

- disabled `train-service-db` and `monty-data` MCP definitions;
- disabled `train-service-*` skills and `airsrv-docs-review`.

The archive keeps restoration simple without keeping every historical MCP server and skill in the active tool list. Restore an item only when work on that project resumes, then perform a small read-only smoke check before relying on it.

No credentials belong in this directory. Supply any required token, password, or connection string through Keychain, an environment variable, or the project’s local secret store.
