# DESIGN.md — <screen/feature>

> Design contract for agents. ALL UI implementation in this scope is done AGAINST this document and against `docs/<feature>/design/design.spec.json`. The fidelity gate is `measure.mjs` — not anyone's eye.

## 1. Source of truth

- **Origin:** <Figma URL with node-id | image path>
- **Confidence:** `exact` (Figma) | `estimated` (image, ±3px tolerance)
- **Reference viewport:** <width>×<height> @1x
- **Visual reference:** `docs/<feature>/design/reference.png`
- **Code Connect:** <yes/no — if yes, node→component table below>

## 2. Tokens

| Token | Resolved value | Usage |
|---|---|---|
| `color.primary` | `#0A2540` | headings, CTA |
| `space.2` | `8px` | title→subtitle gap |
| `font.heading.size` | `24px` | h1 |

Rule: code consumes tokens (CSS vars / theme), **never magic values**. If a design value has no token, create one or flag it — do not hardcode silently.

## 3. Node hierarchy

Screen tree. Every node listed here exists in `design.spec.json` and carries `data-design-id` in the DOM.

```
root (hero-section)
├── hero-title          h1, 24px/700, color.primary
├── hero-subtitle       16px/400, gap 8px below title
└── hero-search         input 48px tall, 1 svg icon (left), gap 16px below subtitle
```

Include container blocks (sidebars, nav groups, card shells) WITH their padding values — container paddings are contract values, not implementation detail (see §6 lesson).

## 4. Typography

| Role | Family | Size | Weight | Line-height |
|---|---|---|---|---|
| Heading | Inter | 24px | 700 | 32px |
| Body | Inter | 16px | 400 | 24px |

## 5. Hard rules (the implementer NEVER)

1. Never magic values: everything via token.
2. Never omit `data-design-id` on a spec node.
3. Never "improve" the design: fidelity > own judgment. Objections are reported, not implemented.
4. Never add elements absent from the spec (icons, visual wrappers, shadows).
5. Never correct by visual impression: only by numeric deltas from the delta-report.
6. Never loosen tolerances to force a pass — unreachable tolerances are reported with cause.

## 6. Verifiable spec

→ `docs/<feature>/design/design.spec.json` (input to the deterministic gate). Tolerances: ±1px exact / ±3px estimated / Δ3 per color channel.

Authoring lesson (baked in from the reference demo): assert **container paddings and nav-block offsets** explicitly — they are the class of miss the numeric gate cannot catch when unasserted, and the visual gate only catches late. See `design-spec-guide.md` §Container assertions.

## 7. Curated notes (lessons from previous loops)

<!-- The loop phase appends recurring findings here. Example: -->
<!-- - Radix Themes `space-6` resolves to 40px, not 24px. Use space-4 for 24px gaps. -->
