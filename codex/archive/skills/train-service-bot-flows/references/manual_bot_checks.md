# Manual bot checks

Use these as the minimum live checks when bot behavior changes.

## Core alpha path

1. `/start`
2. `/health`
3. `/import`
4. `/today`
5. `/log`
6. repeat `/today`

## Routing checks

- verify active `/import` still consumes follow-up text
- verify active `/log` still consumes status, duration, and notes
- verify active `/health` still consumes follow-up state correctly
- verify explicit command aliases still work

## Handoff checks

- bot-to-web links open the intended review screen
- session state remains valid after restart when relevant

## If transcript tests do not exist

Document the exact manual steps in the final response.
