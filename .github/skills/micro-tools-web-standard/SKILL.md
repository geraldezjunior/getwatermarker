---
name: micro-tools-web-standard
description: 'Use when building or reviewing Next.js App Router micro-tools with TypeScript and Tailwind CSS. Enforces 100% client-side processing, a Neon Lime #CBFE01 visual system, a split control/preview workspace, and reusable UI components for buttons, sliders, and dropzones.'
argument-hint: 'tool scope, layout, component, or review goal'
---

# Micro-Tools Web Standard

## Purpose
Apply this skill when creating a family of small web utilities that must feel like one cohesive product line, while still allowing each tool to swap accent colors or domain-specific content without changing the underlying structure.

## Non-Negotiables
- Stack base: Next.js App Router, TypeScript, and Tailwind CSS.
- Main processing must happen 100% client-side.
- Avoid server actions, API routes, and backend dependencies for core tool logic unless the user explicitly asks for a server-side exception.
- Use #CBFE01 as the primary accent color for CTAs, active states, focus highlights, and key icons.
- Use black, white, and neutral grays as the structural palette.
- Keep the UI minimal, high-contrast, and clean.

## Default Layout
Every tool should follow the same shell:
1. Simple header with the tool name and a concise supporting line when needed.
2. Central work area split into two columns:
   - Control panel for inputs, options, and actions.
   - Preview or result area for immediate feedback.
3. Discreet footer with essential links, status, or legal text only.

If the viewport is narrow, collapse the two-column work area into a stacked layout without changing the hierarchy.

## Visual System
- Use Neon Lime only for emphasis; do not flood the page with it.
- Prefer dark surfaces with bright text, or light surfaces with sharp black text, but keep contrast strong in both cases.
- Cards should feel purposeful, with subtle borders, soft shadows, or quiet separation.
- Inputs must show a clear active state using the accent color.
- Keep spacing intentional and restrained, with generous breathing room around the main work surface.
- Motion should be light and meaningful: small transitions, staged reveals, or state changes that clarify feedback.

## Component Rules
Build controls as generic primitives so they can be reused across tools:
- Button: variants for primary, secondary, destructive, and ghost.
- Slider: shared styling and consistent label/value presentation.
- Dropzone: reusable drag-and-drop shell with state-driven feedback.
- Field wrappers: label, hint, error, and helper text patterns.
- Panels: shared frame for settings, preview, and result blocks.

Keep components prop-driven. The accent color may change per tool, but layout, spacing, and behavioral patterns should stay stable.

## Implementation Workflow
1. Identify the tool's input, transformation, and output.
2. Confirm the entire transformation can run in the browser.
3. Map the tool to the standard shell: header, control panel, preview area, footer.
4. Select or compose reusable primitives before adding tool-specific markup.
5. Apply the accent color to action paths, focus states, and active controls only.
6. Add empty, loading, error, and success states if they improve clarity.
7. Check mobile behavior and ensure the stacked layout still feels deliberate.

## Decision Rules
- If the feature needs persistence only for the current session, prefer browser state or local storage.
- If a proposed feature requires external computation or data fetching, ask whether it is allowed before breaking the client-side rule.
- If a tool does not need a preview, keep the second column but repurpose it for results, logs, or guidance rather than removing the shell.
- If the visual language risks becoming generic, push typography, spacing, or contrast harder while staying minimal.

## Quality Checklist
A tool is complete only when all of these are true:
- Core behavior works without a server round-trip.
- Header, split workspace, and footer are present.
- Primary action uses #CBFE01 clearly and consistently.
- Controls feel reusable across the tool family.
- Mobile layout remains usable and readable.
- The interface looks like one product line, not an isolated one-off.

## Example Uses
- Create a new micro-tool UI with the standard shell and accent system.
- Review an existing tool for compliance with the client-side rule.
- Refactor a tool so buttons, sliders, and dropzones become reusable primitives.
- Adapt the same design system to a new utility while changing only the accent color and tool-specific copy.
