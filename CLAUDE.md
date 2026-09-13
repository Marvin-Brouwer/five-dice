# Formatting conventions

## `element(...)` / `create(...)` calls

Always put the options object on its own lines, one property per line —
like HTML attributes — even when there's only a single property. Never
collapse it onto the same line as the call.

Not this:
```ts
create(Icon, { source: chevron })
```

Do this:
```ts
create(Icon, {
	source: chevron,
})
```

## SVG-markup identifiers

SVG-markup identifiers — imported strings and any function that
selects/returns one — are named camelCase for what the markup *is*:
`{name}Icon`, `{name}Image`, `{name}Pattern`, `{name}Texture`. The list is
open; add a suffix when a new role turns up. Never `{name}Svg` — that names
the file format rather than the thing — and never bare `{name}`.

Not this:
```ts
import iconSun from './theme-chooser.sun.svg?raw'
import paperSvg from './paper-texture-0.svg?raw'
const check = ...
const iconSensor = (dark: boolean) => ...
```

Do this:
```ts
import sunIcon from './theme-chooser.sun.svg?raw'
import paperTexture0 from './paper-texture-0.svg?raw'
const checkIcon = ...
const sensorIcon = (dark: boolean) => ...
```
