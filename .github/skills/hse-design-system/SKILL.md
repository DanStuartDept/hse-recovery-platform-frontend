---
name: HSE Design System
description: Component catalogue, SCSS tokens, and usage guide for @hseireland/hse-frontend and @hseireland/hse-frontend-react
---

# HSE Design System

The HSE Ireland design system provides CSS/SCSS tokens (`@hseireland/hse-frontend`) and React components (`@hseireland/hse-frontend-react`). **Always use these before building custom components.**

## Exploring Components

Use the **Storybook MCP** server at `http://localhost:6006/mcp` to explore component props, variants, and live examples interactively.

## HSE Policy

- **Do not customize** design system components or add inline CSS (HSE accessibility policy).
- Use semantic HTML elements over `<div>`/`<span>`.
- Content must target a reading age of 9 (plain English).
- Accessibility overlays/widgets are **prohibited**.

## Component Catalogue (`@hseireland/hse-frontend-react`)

### Layout
| Component | Import | Purpose |
|---|---|---|
| `Container` | `{ Container }` | Page-width wrapper. `fluid` prop for full-width. |
| `Row` | `{ Row }` | Grid row |
| `Col` | `{ Col }` | Grid column |

**Layout pattern:** `<Container>` → `<Row>` → `<Col>` for all grid layouts.

### Content Presentation
| Component | Purpose |
|---|---|
| `Hero` | Page hero banner. Composition: `<Hero><Hero.Heading>...<Hero.Text>...</Hero>`. Optional `imageSrc` prop. |
| `Callout` | Highlighted callout box |
| `CardList` | Card grid layout |
| `CareCard` | Urgent/non-urgent care information cards |
| `Details` | Expandable details/summary |
| `DoAndDontList` | Best practice lists |
| `BlockQuote` | Styled quotations |
| `Images` | Responsive image component |
| `InsetText` | Indented supplementary text |
| `ListItemPromo` | Promotional list items |
| `Listing` | Content listing layout |
| `Notification` | Status notifications (info, warning, success, error) |
| `Panel` | Bordered content panel |
| `SummaryList` | Key-value summary display |
| `Table` | Accessible data tables |
| `Video` | Video embed |
| `WarningCallout` | Important warning display |

### Navigation
| Component | Purpose |
|---|---|
| `Header` | Site header. Composition pattern with `HeaderLogo`, `HeaderMainMenu`, `HeaderSearch`, etc. Client component with `theme` prop (`'default'` or `'grey'`). |
| `Footer` | Site footer |
| `Breadcrumb` | Breadcrumb navigation |
| `SkipLink` | Accessibility skip-to-content link |
| `BackLink` | Back navigation link |
| `Pagination` | Page navigation |
| `PaginationTop` | Top pagination variant |
| `ContentsList` | Page contents sidebar |
| `ActionLink` | Call-to-action link |
| `DocumentLink` | Document download link |
| `LinksList` | Related links list |
| `ListPanel` | Grouped link panel |
| `PageContents` | Page section navigation |
| `Promo` | Promotional content card |
| `QuickLink` | Quick navigation link |
| `RelatedNav` | Related content navigation |
| `StepperNumber` | Step indicator |
| `HeaderDropdown` | Header dropdown menu |

### Form Elements
| Component | Purpose |
|---|---|
| `Button` | Polymorphic button/link. Modifiers: `'secondary'`, `'reverse'`, `'text'`. Auto-detects `<button>` vs `<a>` based on `href` prop. |
| `TextInput` | Single-line text input |
| `Textarea` | Multi-line text input |
| `Select` | Dropdown select |
| `Checkboxes` | Checkbox group |
| `Radios` | Radio button group |
| `DateInput` | Date entry (day/month/year fields) |
| `FileUpload` | File upload input |
| `SearchWithButton` | Search input with submit button |
| `ErrorMessage` | Inline error message |
| `Fieldset` | Form field grouping |
| `Form` | Form wrapper |
| `HintText` | Input hint text |
| `Label` | Form label |
| `Legend` | Fieldset legend |

### Patterns
| Pattern | Purpose |
|---|---|
| `NavAZ` | A-Z alphabetical navigation |
| `PaginationListing` | Paginated content listing |
| `ReviewDate` | Content review date display |

## SCSS Tokens (`@hseireland/hse-frontend`)

### Colours

**Primary:**
- `$color_hse-green-500: #02a78b` (HSE brand green)
- `$color_hse-purple-700: #5f3dc4` (buttons primary)

**Semantic aliases:**
- `$hse-text-color`: `$color_hse-grey-900` (#212b32)
- `$hse-link-color`: `$color_hse-blue-500` (#0b55b7)
- `$hse-link-hover-color`: `$color_hse-blue-800` (#07336e)
- `$hse-link-visited-color`: `$color_hse-purple-700` (#5f3dc4)
- `$hse-focus-color`: `$color_hse-green-300` (#73e6c2)
- `$hse-border-color`: `$color_hse-grey-300` (#aeb7bd)
- `$hse-error-color`: `$color_hse-red-500` (#b30638)
- `$hse-button-color`: `$color_hse-purple-700` (#5f3dc4)

**Never hardcode colours** — always use the SCSS variables.

### Breakpoints

Uses `sass-mq`. Four breakpoints:
```scss
mobile:        320px
tablet:        641px
desktop:       769px
large-desktop: 990px
```

Usage: `@include mq($from: tablet) { ... }` or `@include mq($until: desktop) { ... }`

### Spacing

0-9 scale with responsive values:
```
0: 0px    1: 4px    2: 8px    3: 16px   4: 24px
5: 32px   6: 40px   7: 48px   8: 56px   9: 64px
```

Points 5-9 increase at tablet breakpoint. Use `hse-spacing()` function or `hse-responsive-margin`/`hse-responsive-padding` mixins.

### Typography

Font scale: 64, 48, 32, 24, 22, 19, 16, 14 (px, responsive mobile→tablet).

Weights: `$hse-font-normal: 400`, `$hse-font-bold: 600`.

### Key Mixins

| Mixin | Purpose |
|---|---|
| `visually-hidden()` | Hide visually, keep in DOM for screen readers |
| `visually-hidden-focusable()` | Skip link pattern |
| `reading-width()` | Max-width 44em for readable content |
| `panel($bg, $text)` | Panel component base |
| `care-card($bg, $text, $border)` | Care card component |
| `toggle-button()` | Toggle button base |
| `close-button($size)` | Close/dismiss button |

## Decision Guide

1. **Need a UI component?** Check this catalogue first. If it exists in `@hseireland/hse-frontend-react`, use it.
2. **Need to explore props/variants?** Use the Storybook MCP at `http://localhost:6006/mcp`.
3. **Need custom styling?** Use `@hseireland/hse-frontend` SCSS variables/tokens. Never hardcode colours, spacing, or breakpoints.
4. **Need a component that doesn't exist?** Compose from existing design system elements. Only create from scratch as a last resort.
5. **Layout?** Always use `Container` → `Row` → `Col`.
