# Provider policy

Apply this policy to advisor work.

## Providers

- `deterministic`: required baseline fallback
- `codex_auth`: allowed for dev, staging, and manual comparison runs
- `openai`: intended server-side production path unless replaced by another explicit service provider

## Qualification gate

A provider is not `supported` just because it can answer.

Require:
- advisor smoke coverage on common intents
- contract parity for response and proposal shapes
- failure-mode review
- runtime metadata visibility

## Production rule

Production advisor must not depend on local `~/.codex`, keychain, or desktop-user auth semantics.
