# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ READ START_HERE.md FIRST!

**Before making any changes, read `START_HERE.md` for critical rules about this Member Portal SPA.**

## 📚 CRITICAL: External API Integration Protocol

**BEFORE modifying ANY external API integration, you MUST:**

1. **Ask for API Documentation** - Request the official API documentation URL from the user
2. **Read Documentation Thoroughly** - Study the relevant sections:
   - Authentication methods and requirements
   - Data structures and response formats
   - Endpoint specifications and parameters
   - Rate limits and error handling
3. **Understand the Data Model** - Know exactly how the API structures its data before making changes
4. **Verify When Uncertain** - If documentation is unclear, ask the user to verify API behavior rather than guessing
5. **Test Carefully** - Changes to external APIs can break integrations for hours if done incorrectly

**Why this matters:** A single incorrect assumption about an external API can result in 6+ hours of debugging and broken functionality. Always read the docs first.

**APIs currently integrated:**
- CLAIM'N V2 API (api.claimn.co) - Primary backend API
- Supabase (if used for direct client access)
- Any third-party integrations

## Project Overview

Members Portal SPA - React 19 + Vite application for CLAIM'N members to access their dashboard, goals, KPIs, protocols, coaching sessions, and community features.

## Backend Change Requests

**The `server-infra` repo is handled by a separate backend agent on a separate on-prem machine. This frontend agent MUST NOT push to or modify `server-infra` directly.**

When backend changes are needed (new endpoints, schema changes, bug fixes, missing fields), you MUST:

1. **Write a prompt file** in `/Users/maxsandberg/projects/server-infra/AGENT_PROMPT.md`
2. The prompt file should contain a clear, actionable description that the backend Claude Code agent can execute independently, including:
   - **What** needs to change (specific files, structs, handlers)
   - **Why** (the frontend bug or feature that depends on this)
   - **Exact code changes** with file paths and line references
   - **Verification steps** (how to confirm the fix works)
3. **Tell the user** that a backend prompt has been written and needs to be run on the backend machine

Example format for `AGENT_PROMPT.md`:
```markdown
# Backend Change Request: [Short Title]

## Context
[Why this change is needed — what frontend feature/bug depends on it]

## Changes Required

### File: `claimn-api/handlers/v2/members/example_handlers.go`
[Exact description of what to add/modify, with code snippets]

## Verification
[How to test the change works]
```

## General Guidelines

- Always read files before editing them
- Test changes thoroughly before committing
- Never commit sensitive data (API keys, passwords, tokens)
- Use clear, descriptive commit messages
- Ask for clarification when requirements are unclear
- Follow the existing code patterns and component structure
