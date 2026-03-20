# Design Reference — UI Patterns to Port

This document describes the typography and sidebar design patterns from this project. Apply these to a new project while using your own color scheme.

---

## 1. Typography

### Fonts
- **UI text:** Geist Sans — clean, modern, professional
- **Data/code/values:** Geist Mono — used for any numeric data, labels, identifiers, status values

### Setup (Next.js)
```tsx
// app/layout.tsx
import { Geist, Geist_Mono } from "next/font/google"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

// Apply to <body>:
<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
```

### CSS Variable Wiring (globals.css / Tailwind theme)
```css
@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@layer base {
  html {
    @apply font-sans;
  }
}
```

### Typography Conventions
- Section labels / nav items: `text-xs font-semibold uppercase tracking-widest text-muted-foreground`
- Monospaced data values (numbers, codes, IDs): `font-mono tabular-nums`
- Small caps labels above fields: `text-[10px] uppercase tracking-widest font-medium text-muted-foreground`
- Page-level headings kept small and label-like — this is a tool, not a marketing page

---

## 2. Sidebar

### Dependencies
This sidebar uses the shadcn/ui sidebar primitive. Install it:
```bash
npx shadcn@latest add sidebar
```

Also requires:
- `lucide-react` for icons
- `next-themes` for theme toggle (optional — remove if not needed)
- `class-variance-authority` (cva)

### The DAW Sidebar Style

The key aesthetic decisions — apply these on top of whatever shadcn installs:

**Nav items** — flat, no rounding, strong left-border accent on active:
```tsx
<SidebarMenuButton
  className="rounded-none h-9 px-3 text-xs font-medium tracking-wide uppercase gap-2.5
    border-l-2 border-transparent
    hover:bg-sidebar-accent hover:border-l-sidebar-primary hover:text-sidebar-foreground
    data-[active=true]:border-l-[YOUR_ACCENT_COLOR] data-[active=true]:bg-sidebar-accent
    transition-colors duration-100"
>
  <ItemIcon className="h-3.5 w-3.5 shrink-0" />
  <span>{item.title}</span>
</SidebarMenuButton>
```

Replace `[YOUR_ACCENT_COLOR]` with your project's accent (e.g. `border-l-primary`, `border-l-blue-500`, or a CSS var).

**Header** — monospaced app name, uppercase, tight tracking:
```tsx
<SidebarHeader className="border-b border-sidebar-border px-3 py-3">
  <span className="font-mono text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">
    YOUR APP NAME
  </span>
</SidebarHeader>
```

**Footer** — utility actions (theme toggle, sign out, user info):
```tsx
<SidebarFooter className="gap-0 border-t border-sidebar-border pt-1 pb-2">
  {/* Optional: user email */}
  <p className="px-3 py-1.5 text-[10px] font-mono text-muted-foreground truncate tracking-wide">
    {userEmail}
  </p>

  {/* Theme toggle */}
  <Button
    variant="ghost"
    size="sm"
    className="w-full justify-start gap-2 rounded-none h-8 px-3 text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
    onClick={toggleTheme}
  >
    <Sun className="h-3.5 w-3.5 ..." />
    <Moon className="absolute h-3.5 w-3.5 ..." />
    <span>Toggle theme</span>
  </Button>

  {/* Sign out / destructive action */}
  <Button
    variant="ghost"
    size="sm"
    className="w-full justify-start gap-2 rounded-none h-8 px-3 text-xs uppercase tracking-wide text-muted-foreground hover:text-destructive hover:bg-sidebar-accent"
  >
    <LogOut className="h-3.5 w-3.5 shrink-0" />
    <span>Sign out</span>
  </Button>
</SidebarFooter>
```

**No gap between menu items:**
```tsx
<SidebarMenu className="gap-0">
```

### Layout Wrapper
```tsx
// app/layout.tsx
<SidebarProvider>
  <AppSidebar />
  <main className="flex-1 p-6">
    <SidebarTrigger className="mb-4" />
    {children}
  </main>
</SidebarProvider>
```

### Sidebar CSS Variables to Override
The sidebar uses its own token set. Map these to your color scheme — the values below are just the structural pattern, replace with your own colors:
```css
:root {
  --sidebar: /* slightly darker/lighter than background */;
  --sidebar-foreground: /* same as foreground */;
  --sidebar-primary: /* your primary */;
  --sidebar-primary-foreground: /* contrast on primary */;
  --sidebar-accent: /* subtle hover bg */;
  --sidebar-accent-foreground: /* text on hover */;
  --sidebar-border: /* divider lines */;
  --sidebar-ring: /* focus ring */;
}
```

---

## 3. General UI Conventions to Carry Over

These are pattern-level decisions, not color-specific:

| Pattern | Class |
|---|---|
| Section page headers | `text-xs font-semibold uppercase tracking-widest text-muted-foreground` |
| Card containers | `bg-card border border-border/60 rounded-sm` |
| Compact buttons | `h-7 text-xs rounded-sm` (desktop) / `h-10 md:h-7` (mobile-responsive) |
| Monospace numeric data | `font-mono tabular-nums text-sm font-semibold` |
| Field labels | `text-[10px] uppercase tracking-widest text-muted-foreground font-medium` |
| Subtle dividers | `border-b border-border/60 pb-3` |
| Muted timestamps | `text-[10px] font-mono text-muted-foreground tabular-nums` |

**Border radius:** Keep it tight. Use `rounded-sm` or `rounded-none` for UI chrome. Reserve larger radius for modals/dialogs only.

**Spacing:** Dense but not cramped. `p-6` for page padding, `px-3 py-3` for sidebar sections, `gap-4` between major page sections.

---

## 4. What NOT to Port

- The grid background (the `repeating-linear-gradient` in layout.tsx) — that's project-specific
- The OKLCH color palette — use your own scheme
- The chart color tokens (`--chart-1` through `--chart-5`) — only relevant if you use the same data visualization
- The `--accent-data` amber/gold token — Song Tool-specific for musical data highlights
