---
name: premium-saas-ui
description: Designs, implements, and audits İşEmriAl's premium light-first B2B SaaS interface. Use when creating or refining pages, navigation, tables, forms, dashboards, responsive layouts, design tokens, accessibility, or browser visual QA. Prevents generic AI-generated UI patterns and enforces coherent product-specific design.
---

# Premium SaaS UI Skill — İşEmriAl

## Purpose
Create a production-minded, polished interface for a Turkish technical-service work-order product. The interface should feel deliberate, calm, practical, and trustworthy—not like a generic AI dashboard template.

## Required workflow
1. Read `AGENTS.md`, `docs/PRODUCT_BRIEF.md`, and `docs/DESIGN_SYSTEM.md` before substantial UI work.
2. Inspect the current app, component library, routes, package manager, existing CSS tokens, and available browser tools. Preserve working architecture.
3. Before implementation, state the target user, task, primary action, layout structure, responsive behavior, and empty/error/loading states.
4. Reuse established tokens and components. Extend the design system only when a new semantic need exists.
5. Build one coherent screen or flow at a time. Do not create every route in a single enormous pass.
6. Run available typecheck, lint, tests, and build after meaningful changes.
7. Open the implementation in a browser when available. Inspect at minimum desktop and a narrow mobile viewport. Capture screenshots, list visual defects, fix them, then capture again.
8. Report what was actually checked. Never claim browser QA or tests passed unless they ran.

## Visual direction
- Light-first, warm-neutral canvas, white surfaces, restrained cobalt/blue brand accent, dark slate text, soft borders.
- Use typography, spacing, alignment, and information hierarchy as the main design tools.
- Keep navigation and operations dense enough for daily professional use without feeling cramped.
- Prefer a strong page title, concise supporting copy, one clear primary CTA, useful filters, and a purposeful content layout.
- Use simple line icons consistently. Prefer Lucide icons already installed. Do not use emoji as interface icons.
- Use subtle motion only when it communicates state or provides feedback.
- Use a neutral design language with a little brand character; do not make every screen look identical.

## Anti-patterns to reject
- Full-page black or dark navy backgrounds as the default.
- Purple/pink/blue gradient backgrounds, neon glow, blurred glass panels, giant rounded floating cards.
- Every data point inside a separate card.
- Four oversized metric cards as the automatic dashboard composition.
- Unnecessary hero art or decorative illustrations inside a business app.
- Random color values, inconsistent radii, one-off spacing and dozens of arbitrary shadows.
- Oversized heading paired with tiny operational text.
- Fake charts, meaningless KPIs, placeholder lorem ipsum, fake notifications and nonfunctional buttons.
- A desktop layout simply squeezed into mobile width.
- Replacing a useful data table with decorative tiles without a real UX reason.

## Tokens and components
- First use CSS variables/semantic tokens for background, foreground, surface, muted, border, primary, focus, and semantic status colors.
- Keep radii and spacing consistent; reserve larger radii for larger containers and dialogs.
- Buttons require primary, secondary, ghost/destructive states and visible focus/disabled/loading states where relevant.
- Forms need labels, examples only when useful, inline validation, and understandable error messages.
- Tables need headers, alignment, row hover/focus, empty state, loading skeleton, filter/search affordances, and sensible overflow behavior.
- Status labels must use text plus color; never communicate status only through color.
- Dialogs and drawers need focus management, escape/close behavior, clear title, and confirmation for destructive actions.

## Responsive and accessibility checks
- Check at approximately 1440px desktop, 1024px tablet, and 390px mobile.
- No horizontal body overflow at mobile widths.
- Main navigation transforms intentionally on narrow screens.
- Primary controls remain reachable with keyboard and touch.
- Use semantic headings, buttons, links, form labels, table semantics and accessible dialog primitives.
- Ensure readable contrast and visible focus indicators.
- Honor `prefers-reduced-motion`.

## Definition of done
A screen is not done just because it compiles. It is done only when:
- It solves the intended user task with a clear hierarchy.
- It uses the shared design tokens and components.
- It includes realistic copy and believable data.
- Interactive controls have meaningful behavior or are clearly disabled with explanation.
- Loading, empty, error, and success states exist where applicable.
- Desktop and mobile render correctly.
- The relevant checks were run and their outcome is reported honestly.
