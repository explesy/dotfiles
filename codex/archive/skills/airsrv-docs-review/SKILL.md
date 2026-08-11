---
name: "airsrv-docs-review"
description: "Use when the user asks to review documentation in /Users/doc/notes/airsrv for actuality, duplicates, missing docs, extra or archive candidates, service coverage, and drift versus checked-in configs or the live creo server. Return findings first and do not change files unless explicitly asked."
---

# airsrv Documentation Review

Use this skill for periodic documentation audits of `/Users/doc/notes/airsrv`.

## Goal

Check whether the repository documentation is still a factual source of truth for `creo`.

## What to compare

1. Read the main source-of-truth docs:
- `README.md`
- `services.md`
- `SERVER_STATE.md`
- `server_changes.md`

2. Read the main operational docs and config baselines:
- `stack/README.md`
- `stack/.env`
- `stack/.env.example`
- `stack/docker-compose.yml`
- `monitoring/README.md`
- `backup/README.md`
- `backup/*.md`
- `samba.md`
- `ssh_access_creo.md`
- `security_first_openclaw.md`

3. When possible, compare with live `creo` state:
- running containers and publishes
- user timers and user services
- live `/srv/home-stack/stack/.env`
- important runtime state for backup, monitoring, and media services

## What to look for

- outdated facts, dates, ports, paths, bind IPs, env vars, volumes
- duplicate documents or overlapping source-of-truth roles
- services or timers that exist in runtime but are not documented
- docs that should be moved to `archive/`
- missing docs or weak coverage for important runtime areas
- references to missing or untracked files
- drift between docs, checked-in configs, and live `creo`

## Document roles to enforce

- `README.md`: index and map only
- `services.md`: full service catalog
- `SERVER_STATE.md`: verified live snapshot
- `server_changes.md`: chronological log
- `stack/README.md` and other runbooks: procedures only, not the main live snapshot

## Response format

1. Start with findings ordered by severity: `High`, `Medium`, `Low`.
2. For each finding, state:
- what is wrong
- where it is
- why it matters
- what should be fixed
3. Then summarize:
- what can be deleted
- what can be archived
- what is missing
- what process rules would reduce future drift

Do not edit files unless the user explicitly asks for changes.
