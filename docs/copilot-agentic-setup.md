# Copilot Agentic Development Setup

The team uses GitHub Copilot as their primary AI assistant. This document defines the agents, prompts, instructions, and skills to check into the repo so every developer gets a consistent AI-assisted workflow out of the box.

Reference: [github/awesome-copilot](https://github.com/github/awesome-copilot/) — pre-built agents, instructions, skills, and plugins to use as starting points.

---

## Target file structure

```
.github/
  copilot-instructions.md              # Always-on: architecture, conventions, monorepo layout
  instructions/
    typescript.instructions.md         # applyTo: "**/*.ts,**/*.tsx"
    nextjs.instructions.md             # applyTo: "apps/**"
    cms-packages.instructions.md       # applyTo: "packages/wagtail-*/**"
    a11y.instructions.md               # applyTo: "**/*.tsx"
  prompts/
    new-page-model.prompt.md           # Scaffold a CMS-backed page
    new-streamfield-block.prompt.md    # Add a new StreamField block
    new-page-with-blocks.prompt.md     # New page model with new block types
    integrate-component.prompt.md      # Wire up an hse-frontend-react component
    new-local-component.prompt.md      # Custom composite component in the app
    new-custom-component.prompt.md     # Net-new component in @repo/hse-custom-ui
    new-app.prompt.md                  # Run the cookiecutter Makefile
  agents/
    a11y-reviewer.agent.md
    nextjs-developer.agent.md
    react-expert.agent.md
    gh-actions-expert.agent.md
    security-reviewer.agent.md
    cms-specialist.agent.md
  skills/
    cms-content-fetching/SKILL.md
    hse-design-system/SKILL.md
    conventional-commit/SKILL.md
.vscode/
  mcp.json                             # MCP servers (already exists: context7, Playwright, Storybook)
```

---

## Agents

| Agent | Purpose | Starting point from awesome-copilot |
|-------|---------|-------------------------------------|
| a11y-reviewer | WCAG 2.1 AA compliance checks — legal requirement for public-sector health | `accessibility.agent.md` |
| nextjs-developer | Next.js 16 App Router, Server Components | `expert-nextjs-developer.agent.md` |
| react-expert | React 19 patterns, hooks, HSE design system component usage | `expert-react-frontend-engineer.agent.md` |
| gh-actions-expert | Authoring and debugging CI/CD workflows for the monorepo | `github-actions-expert.agent.md` |
| security-reviewer | Security review focused on auth, data handling, CSP | `se-security-reviewer.agent.md` |
| cms-specialist | Wagtail headless CMS integration, content modelling, API client usage | N/A (custom) |

---

## Instructions

| File | Scope | Content |
|------|-------|---------|
| `copilot-instructions.md` | Always-on | Monorepo layout, data flow, design system, Biome/Vitest tooling |
| `typescript.instructions.md` | `**/*.ts,**/*.tsx` | Strict mode, no `any`, Biome formatting, import conventions |
| `nextjs.instructions.md` | `apps/**` | Server Components by default, `use client` only when needed, no Node.js APIs at runtime |
| `cms-packages.instructions.md` | `packages/wagtail-*/**` | Zod schema conventions, CMS client patterns, sub-path export structure |
| `a11y.instructions.md` | `**/*.tsx` | Semantic HTML, ARIA, keyboard nav, colour contrast |

The `.github/copilot-instructions.md` can share content with `CLAUDE.md` during the setup phase — they serve the same purpose for different tools.

---

## Prompts

These prompts encode the cross-package workflows that are easy to get wrong or forget a step. Each one guides Copilot through every package that needs updating.

| Prompt | Packages touched | Purpose |
|--------|-----------------|---------|
| `new-page-model` | `wagtail-cms-types` -> `wagtail-cms-mapping` -> app route | Add a new Wagtail page type: Zod schema in types, layout template mapping in cms-mapping, Next.js route in the app |
| `new-streamfield-block` | `wagtail-cms-types` -> `wagtail-cms-mapping` | Add a new StreamField block: Zod schema in types, map to `@hseireland/hse-frontend-react` component in cms-mapping |
| `new-page-with-blocks` | `wagtail-cms-types` -> `wagtail-cms-mapping` -> app route | Combines the above — new page model that includes new StreamField blocks |
| `integrate-component` | `wagtail-cms-types` -> `wagtail-cms-mapping` | Wire up an existing `@hseireland/hse-frontend-react` component: add/update the Zod block schema in types, add the block-to-component mapping in cms-mapping |
| `new-local-component` | app `components/` directory | Create a custom composite component local to the app, built from multiple `@hseireland/hse-frontend-react` elements, with tests |
| `new-custom-component` | `@repo/hse-custom-ui` | Create a net-new component not in the design system, using `@hseireland/hse-frontend` SCSS tokens/variables for consistency. With tests |
| `new-app` | root Makefile | Trigger the cookiecutter Makefile and walk through post-creation setup |

---

## Skills

| Skill | Purpose |
|-------|---------|
| `cms-content-fetching` | Teaches Copilot the full data flow: types -> client -> mapping -> render |
| `hse-design-system` | HSE component catalogue, token usage, layout shell patterns |
| `conventional-commit` | Commit message format enforced by commitlint |

Skills follow an open standard (agentskills.io) and work across Copilot, Claude Code, and CLI tools — most portable option.

---

## MCP Servers

Already configured in `.vscode/mcp.json` (shared across both Claude and Copilot):

- **context7** — live documentation lookup for libraries/frameworks
- **Playwright** — browser automation and testing
- **Storybook** — design system component exploration

---

## Notes

- Start by adapting pre-built resources from [awesome-copilot](https://github.com/github/awesome-copilot/) and customising to this repo's stack.
- Build agents and prompts incrementally — create the most-used ones first (CMS prompts, a11y reviewer) and expand as patterns stabilise.
- MCP servers in `.vscode/mcp.json` are shared across both Claude and Copilot — no duplication needed.
