# Bot flow priority

Use this as the default routing policy unless the repo explicitly changes it.

## Highest priority

- active `/import` flow
- active `/log` flow
- active `/health` flow
- onboarding steps tied to `/start`

These flows own the next user message until they exit or cancel.

## Next priority

- explicit commands and explicit aliases such as `today`, `hint`, `runtoday`, `log`
- inline keyboard callbacks tied to an active flow

## Lowest priority

- generic text handlers
- future advisor free-text entry points

## Rule

New conversational handlers must not steal messages from an active stateful flow.
