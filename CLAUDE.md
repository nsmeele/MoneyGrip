# Interest-Calculator

## Commands

- `npm run dev` — Dev server
- `npm run build` — TypeScript check + build
- `npm run lint` — ESLint

## Frontend Stack

- React 19
- TypeScript 
- Tailwind 4
- Vite 7

## Frontend Regels

- Mobile-first responsive design
- Component-based architectuur met single responsibility
- DRY: geen dubbele logica, herbruikbare componenten, gedeelde CSS classes in `src/style.css`
- SOLID: business logic gescheiden van UI (strategies, interfaces, models in eigen mappen)
- Semantische HTML: juiste elementen (`<main>`, `<header>`, `<section>`, etc.) voor toegankelijkheid en SEO
- W3C-valide HTML: correcte nesting, alt-attributen op images, labels bij inputs
- Accessibility (WCAG): aria-attributen, keyboard navigatie, voldoende kleurcontrast, focus-visible states
- BEM class naming: `.block__element--modifier` (bijv. `.mobile-tab--active`)
- CSS classes via `@apply` in `src/style.css`, geen inline Tailwind in JSX
- UI-teksten in het Nederlands, code in het Engels
- Gebruik Tailwind functions and directives
- Gebruik i18n voor tekst, zelfs als er nu maar één taal is (voor toekomstige uitbreidbaarheid)
- Gebruik React Context voor globale state (zoals thema, taal, gebruikersauthenticatie)

## Refactor guidelines

- Identificeer code duplicatie of complexe componenten
- KISS: houd het simpel, splits grote componenten op in kleinere, herbruikbare stukken
- Gebruik code die al bestaat in plaats van nieuwe code te schrijven (DRY)
- Schrijf unit tests voor nieuwe of aangepaste functionaliteit
- Gebruik geen magic strings of getallen, definieer constanten of enums, kijk ook wat er al is
- Test-driven-development: schrijf eerst tests, dan pas de implementatie
- Documenteer belangrijke beslissingen in code comments of in de README
- Update bestaande comments en documentatie als je code wijzigt, zodat alles up-to-date blijft
- Gebruik zoveel mogelijk SSOT (Single Source of Truth) voor gedeelde logica of data, zodat er één plek is om te onderhouden

## Commit rules

- Focus op waarom ipv wat: leg de reden achter de verandering uit, niet alleen wat er is veranderd
- Gebruik geen prefixes
- Gebruik Engelse commit messages
- Voordat je commit: check of je code voldoet aan de linting regels (`npm run lint`), en dat je build niet faalt (`npm run build`)


