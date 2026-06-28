# design.spec.json — authoring guide

Machine contract consumed by `measure.mjs`. Every `node.id` must exist in the DOM as `data-design-id="<id>"`.

## Example

```json
{
  "$comment": "Machine contract — consumed by references/measure.mjs.",
  "source": {
    "type": "figma",
    "url": "https://www.figma.com/design/FILE_KEY/Project?node-id=12-34",
    "reference": "docs/<feature>/design/reference.png"
  },
  "viewport": { "width": 1440, "height": 900, "deviceScaleFactor": 1 },
  "tolerance": { "px": 1, "estimatedPx": 3, "colorChannel": 3 },
  "readySelector": "[data-design-id=\"hero-title\"]",
  "nodes": [
    {
      "id": "hero-title",
      "figmaNode": "12:35",
      "confidence": "exact",
      "expect": {
        "box": { "height": 32 },
        "styles": {
          "fontSize": "24px",
          "fontWeight": "700",
          "lineHeight": "32px",
          "color": "#0A2540",
          "fontFamily": "Inter"
        }
      },
      "gaps": [
        { "to": "hero-subtitle", "edge": "bottom-to-top", "px": 8 },
        { "to": "hero-subtitle", "edge": "left-align", "px": 0 }
      ]
    },
    {
      "id": "sidebar",
      "confidence": "exact",
      "expect": {
        "box": { "width": 256, "height": 900 },
        "styles": { "backgroundColor": "rgb(255, 255, 255)", "paddingTop": "24px", "paddingLeft": "16px" },
        "children": { "a": 8 }
      }
    }
  ]
}
```

## Rules

1. Every node gets a stable kebab-case `id`. **That id IS the contract**: the implementation must place `data-design-id="<id>"` on the corresponding element.
2. Assert only design-relevant properties: dimensions, typography, color, spacing, radius, borders. Do not assert every existing CSS property.
3. Prefer relational `gaps` (distance between nodes: `bottom-to-top`, `right-to-left`, `left-align`, `top-align`) over absolute `x/y` positions — they survive upstream shifts.
4. Use `children` to pin internal element counts (e.g. `"svg": 1` in a search bar) — it catches structural hallucinations no spacing metric detects.
5. Tokens are documented in DESIGN.md; the spec asserts **resolved values** (the gate measures computed CSS, not token names).
6. Colors: assert in `rgb(r, g, b)` or `#hex` form — computed styles normalize to rgb, and the gate compares per-channel (Δ3 default).
7. `confidence`: `exact` (±1px, Figma/DOM-derived values) or `estimated` (±3px, values estimated from a flat image). Never promise pixel-perfect from an image source.

## Container assertions (required)

Assert the **paddings and offsets of container blocks** — sidebar/nav containers, card shells, section wrappers:

- `paddingTop`/`paddingLeft` on every container node whose children the design positions (sidebar brand block, nav list, card bodies);
- a `gap` from the container's first child to a stable sibling when padding alone is ambiguous.

Why this is mandatory: in the reference demo, every per-node check passed (138/138) while the whole sidebar sat 24px high — the nav container's padding was never asserted, and only the visual gate caught it. Container paddings are contract values, not implementation detail.

## Viewport + environment

- Fixed viewport from the spec, always — a different viewport invalidates every measurement.
- The scripts disable animations/transitions and wait for `document.fonts.ready`; never measure "by hand" with screenshots.
- Measure and compare on the same OS — rendering differs across platforms.
