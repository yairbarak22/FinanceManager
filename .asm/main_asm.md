# ASM — Agent Skill Manager

> Project: **FinanceManager** v0.1.0

## Routing Protocol (Mandatory)

1. Start from `.cursor/skills/asm/SKILL.md`, then read this file.
2. Select one expertise group using the routing rubric below.
3. Open the group index and relationships docs before loading any skill.
4. Prefer advanced, non-trivial skills when available.
5. Load only the selected skills with the right dependency order.

## Expertise Group Router

| Group | Purpose | Task signals | Advanced-first | Navigation |
| --- | --- | --- | --- | --- |
| `hebrew-rtl-personal-finance-management-app-built-w` | Hebrew RTL personal finance management app built with Next.js 16 App Router, TypeScript, Tailwind CSS v4, Prisma ORM with PostgreSQL, NextAuth with Google OAuth, and OpenAI API integration for AI-powered transaction classification | Hebrew RTL personal finance management app built with Next.js 16 App Router, TypeScript, Tailwind CSS v4, Prisma ORM with PostgreSQL, NextAuth with Google OAuth, and OpenAI API integration for AI-powered transaction classification | yes | `.asm/expertises/hebrew-rtl-personal-finance-management-app-built-w/index.md` |

## Selection Rubric

1. Match task intent to expertise intent tags and task signals.
2. If multiple groups match, choose the one with stronger advanced skill coverage.
3. Respect each group's `relationships.md` before skill loading.
4. Do not route directly to a skill before selecting a group.

## Active Expertises

### hebrew-rtl-personal-finance-management-app-built-w

Hebrew RTL personal finance management app built with Next.js 16 App Router, TypeScript, Tailwind CSS v4, Prisma ORM with PostgreSQL, NextAuth with Google OAuth, and OpenAI API integration for AI-powered transaction classification

- Intent tags: hebrew rtl personal finance management app built w, expertise routing
- Task signals: Hebrew RTL personal finance management app built with Next.js 16 App Router, TypeScript, Tailwind CSS v4, Prisma ORM with PostgreSQL, NextAuth with Google OAuth, and OpenAI API integration for AI-powered transaction classification
- Confidence hint: Use when task signals strongly match this domain vocabulary.
- Navigation: `.asm/expertises/hebrew-rtl-personal-finance-management-app-built-w/index.md`
- Relationships: `.asm/expertises/hebrew-rtl-personal-finance-management-app-built-w/relationships.md`
- Required skills: tailwind-4, security, nextjs-best-practices, typescript-strict, prisma-expert

## Installed Skills

- **nextjs-best-practices**: `.asm/skills/nextjs-best-practices/SKILL.md`
  Source: `github:https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/skills/development/nextjs-best-practices`
- **prisma-expert**: `.asm/skills/prisma-expert/SKILL.md`
  Source: `github:https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/skills/development/prisma-expert`
- **tailwind-4**: `.asm/skills/tailwind-4/SKILL.md`
  Source: `github:https://github.com/Gentleman-Programming/Gentleman.Dots/tree/main/GentlemanClaude/skills/tailwind-4`
- **typescript-strict**: `.asm/skills/typescript-strict/SKILL.md`
  Source: `github:https://github.com/citypaul/.dotfiles/tree/main/claude/.claude/skills/typescript-strict`
- **security**: `.asm/skills/security/SKILL.md`
  Source: `github:https://github.com/HoangNguyen0403/agent-skills-standard/tree/develop/skills/nextjs/security`
- **security-best-practices**: `.asm/skills/security-best-practices/SKILL.md`
  Source: `github:https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/skills/security/security-best-practices`
- **vitest**: `.asm/skills/vitest/SKILL.md`
  Source: `github:https://github.com/antfu/skills/tree/main/skills/vitest`
- **frontend-design**: `.asm/skills/frontend-design/SKILL.md`
  Source: `github:https://github.com/vudovn/antigravity-kit/tree/main/.agent/skills/frontend-design`
- **remotion-best-practices**: `.asm/skills/remotion-best-practices/SKILL.md`
  Source: `github:https://github.com/remotion-dev/remotion/tree/main/packages/skills/skills/remotion`
