# @wzrhine/react · API reference

> 由 `scripts/api-report.mjs` 从 `dist/index.d.ts` 生成，请勿手改。版本 0.0.0，共 140 个导出（42 components，3 functions & hooks，6 constants，12 interfaces，77 types）。

## Components

### `ArchiveCard`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `category` | `React.ReactNode` |  |
| `className` | `string` |  |
| `href` | `string` | Navigate to the record (renders <a>). |
| `id` * | `string` |  |
| `layout` | `"row" \| "tile"` | `row` for lists, `tile` for grids. |
| `media` | `{ src: string; alt: string; }` | Optional thumbnail. Provide `alt` that describes it, or `alt=""` when purely decorative. |
| `onOpen` | `(() => void)` | Open the record in place (renders <button>). Ignored when `href` is set. |
| `selected` | `boolean` | Selected in a list/detail layout. |
| `status` | `ArchiveCardStatus` |  |
| `subcategory` | `React.ReactNode` | Short secondary classification, e.g. a discipline. |
| `title` * | `React.ReactNode` |  |
| `updatedAt` | `string` | ISO date for <time dateTime>; `updatedLabel` is the visible text (defaults to the ISO string). |
| `updatedLabel` | `React.ReactNode` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Button`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `disabled` | `boolean` |  |
| `iconEnd` | `React.ReactNode` | Decorative trailing icon; hidden from assistive tech. |
| `iconStart` | `React.ReactNode` | Decorative leading icon; hidden from assistive tech. |
| `loading` | `boolean` | Blocks activation and announces busy state while keeping focus and the accessible name. |
| `size` | `ButtonSize` |  |
| `variant` | `ButtonVariant` | Visual weight. `primary` = ink fill; `accent` = research-orange signal, use once per view. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Checkbox`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `aria-label` | `undefined` | The name comes from `label`; a second naming channel would drift from the visible text. |
| `aria-labelledby` | `undefined` |  |
| `className` | `string` |  |
| `description` | `React.ReactNode` |  |
| `error` | `React.ReactNode` | Error text for a standalone checkbox (e.g. a required confirmation). Ignored inside a group. |
| `hideLabel` | `boolean` | Keep the label for assistive tech only. |
| `invalid` | `boolean` | Drive the error state from an external validator; pair with `error`. |
| `label` * | `React.ReactNode` | Visible label and accessible name. Use `hideLabel` where the context already shows it (table rows). |
| `style` | `React.CSSProperties` |  |
| `validationMode` | `FieldValidationMode` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `CheckboxGroup`

*component* — <CheckboxGroup label="通知方式" name="channels" defaultValue={['email']}> <Checkbox value="email" label="邮件" /> <Checkbox value="digest" label="每周摘要" /> </CheckboxGroup>

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `className` | `string` |  |
| `description` | `React.ReactNode` |  |
| `disabled` | `boolean` |  |
| `error` | `React.ReactNode` |  |
| `invalid` | `boolean` |  |
| `label` * | `React.ReactNode` | Rendered as the fieldset legend; names the group. |
| `name` | `string` | Form field name; every checked item submits its `value` under it. |
| `optional` | `boolean` |  |
| `orientation` | `ChoiceOrientation` |  |
| `required` | `boolean` | Visual marker only; enforce "at least one" with `validate`. |
| `style` | `React.CSSProperties` |  |
| `validate` | `((value: unknown, formValues: Form.Values) => string \| string[] \| null \| void \| Promise<string \| string[] \| null \| void>)` | Custom validation over the checked values; return an error string or null. |
| `validationMode` | `FieldValidationMode` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `DataTable`

*component*

泛型组件：`DataTable<Row>`。

| Prop | Type | Description |
| --- | --- | --- |
| `caption` * | `React.ReactNode` | Visible caption; also names the scroll region. Required for an accessible table. |
| `className` | `string` |  |
| `columns` * | `readonly DataTableColumn<Row>[]` |  |
| `density` | `"comfortable" \| "compact"` |  |
| `emptyText` | `React.ReactNode` |  |
| `getRowId` * | `(row: Row) => string` |  |
| `getRowLabel` | `((row: Row) => string)` | Accessible name for a row's checkbox; defaults to the row id. |
| `hideCaption` | `boolean` | Hide the caption visually (keep it for assistive tech) when a heading already labels the table. |
| `onSelectionChange` | `((ids: Set<string>) => void)` |  |
| `onSortChange` | `((sort: SortState) => void)` |  |
| `rows` * | `readonly Row[]` |  |
| `scrollLabel` | `string` | Accessible label for the horizontal scroll region; defaults to the caption text. |
| `selectedIds` | `ReadonlySet<string>` | Enables a checkbox column. |
| `sort` | `SortState \| null` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Dialog`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `actions` | `React.ReactNode` | Footer actions. Use `<DialogClose>` for buttons that only dismiss. |
| `children` | `React.ReactNode` |  |
| `className` | `string` |  |
| `defaultOpen` | `boolean` |  |
| `description` | `React.ReactNode` |  |
| `dismissOnOutsideClick` | `boolean` | `false` keeps outside clicks from dismissing (use for destructive confirmations). |
| `eyebrow` | `React.ReactNode` | Small archive-style label above the title, e.g. "ARCHIVE / CONFIRM". |
| `initialFocus` | `React.RefObject<HTMLElement \| null>` | Element to focus on open; defaults to the first tabbable element. |
| `onClosed` | `(() => void)` | Fires after the exit animation, when focus has returned. |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `open` | `boolean` |  |
| `size` | `DialogSize` |  |
| `title` * | `React.ReactNode` |  |
| `trigger` | `React.ReactElement<Record<string, unknown>, string \| React.JSXElementConstructor<any>>` | Element that opens the dialog (usually a Button). Omit when opening programmatically. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `DialogClose`

*component* — Wraps a button so activating it closes the nearest Dialog.

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactElement<Record<string, unknown>, string \| React.JSXElementConstructor<any>>` | The element that closes the dialog, typically `<Button variant="ghost">取消</Button>`. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Field`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `className` | `string` |  |
| `description` | `React.ReactNode` | Persistent hint, read after the label. Keep it about the expected format, not marketing copy. |
| `errorMatch` | `boolean \| keyof ValidityState` | Restrict when `error` is shown to one ValidityState key (e.g. `valueMissing`). |
| `error` | `React.ReactNode` | Error text. A string shows on any native validity failure; pass `invalid` together with `error` to drive it from an external validator. |
| `label` * | `React.ReactNode` |  |
| `layout` | `"stacked" \| "inline"` | Stack (default) or place the label in a fixed-width column on wide containers. |
| `optional` | `boolean` | Visually de-emphasised "(可选)" suffix for optional fields in mostly-required forms. |
| `required` | `boolean` | Visual + semantic required marker. Also set `required` on the control for native validation. |
| `style` | `React.CSSProperties` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Fieldset`

*component* — Groups related fields under a visible legend (a native `<fieldset>`):

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `className` | `string` |  |
| `description` | `React.ReactNode` | Read after the legend as the group's description. |
| `disabled` | `boolean` | `disabled` disables every Field and control inside, including Base UI ones. |
| `legend` * | `React.ReactNode` | Section title; names the group for assistive tech. |
| `style` | `React.CSSProperties` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Form`

*component* — `<form>` on Base UI Form. On submit it validates every Field / CheckboxGroup / RadioGroup inside, shows their errors, moves focus to the first invalid control and only then calls `onSubmit`. `errors` maps field `name`s to server-side messages after a failed submission. A plain `<form>` still works, but then errors only appear per field on change / blur.

| Prop | Type | Description |
| --- | --- | --- |
| `className` | `string` |  |
| `style` | `React.CSSProperties` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `IconButton`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `aria-labelledby` | `string` |  |
| `disabled` | `boolean` |  |
| `icon` * | `React.ReactNode` | The icon. Rendered aria-hidden; the button's name comes from `label`. |
| `label` | `string` |  |
| `pressed` | `boolean` | Toggle state for on/off tools (e.g. pin, grid view). Renders `aria-pressed`. |
| `size` | `ButtonSize` |  |
| `variant` | `IconButtonVariant` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Input`

*component* — Text input on Base UI Input: inside `<Field>` it picks up label, description, error and validity automatically; standalone it still needs an accessible name (`aria-label`).

| Prop | Type | Description |
| --- | --- | --- |
| `className` | `string` |  |
| `invalid` | `boolean` | Mark invalid outside a Field (inside a Field, validity comes from Field). |
| `mono` | `boolean` | Monospace value for IDs, codes and measurements. |
| `prefix` | `React.ReactNode` | Decorative leading adornment (icon). Hidden from assistive tech. |
| `size` | `InputSize` |  |
| `style` | `React.CSSProperties` |  |
| `suffix` | `React.ReactNode` | Trailing adornment: unit text such as "mm" is read by screen readers via aria-describedby. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Menu`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `align` | `MenuAlign` |  |
| `children` * | `React.ReactNode` |  |
| `className` | `string` |  |
| `defaultOpen` | `boolean` |  |
| `disabled` | `boolean` |  |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `open` | `boolean` |  |
| `side` | `MenuSide` |  |
| `trigger` * | `React.ReactElement<Record<string, unknown>, string \| React.JSXElementConstructor<any>>` | Element that opens the menu (Button / IconButton with its own accessible name). |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `MenuCheckboxItem`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `checked` | `boolean` |  |
| `children` * | `React.ReactNode` |  |
| `defaultChecked` | `boolean` |  |
| `disabled` | `boolean` |  |
| `onCheckedChange` | `((checked: boolean) => void)` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `MenuGroup`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `label` | `React.ReactNode` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `MenuItem`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `disabled` | `boolean` |  |
| `icon` | `React.ReactNode` | Decorative leading icon. |
| `keepOpen` | `boolean` | Keep the menu open after selection (default closes). |
| `onSelect` | `(() => void)` |  |
| `shortcut` | `string` | Keyboard hint shown on the right, e.g. "Ctrl E". Visual only; wire the shortcut yourself. |
| `tone` | `"default" \| "danger"` | `danger` for destructive commands; pair with a confirmation Dialog. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `MenuRadioGroup`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `defaultValue` | `string` |  |
| `label` | `React.ReactNode` | Visible group heading; also names the group for assistive tech. |
| `onValueChange` | `((value: string) => void)` |  |
| `value` | `string` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `MenuRadioItem`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `disabled` | `boolean` |  |
| `value` * | `string` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `MenuSeparator`

*component*

### `MetadataList`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `columns` | `1 \| 2 \| 3` | Number of item columns on wide containers; collapses to one on narrow ones. |
| `empty` | `MetadataEmpty` | How to treat items whose value is null / undefined / ''. `hide` (default) omits the row; `placeholder` keeps the row with a dash announced as「未记录」. |
| `items` * | `readonly MetadataItem[]` |  |
| `layout` | `MetadataListLayout` | `inline`: label column + value; `stacked`: label above value (narrow panels). |
| `size` | `"sm" \| "md"` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Popover`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `actions` | `React.ReactNode` | Footer actions. Wrap dismiss-only buttons in `<PopoverClose>`. |
| `align` | `PopoverAlign` |  |
| `aria-label` | `string` | Accessible name when no visible `title` is rendered. |
| `arrow` | `boolean` | Show a pointer arrow toward the trigger. |
| `children` | `React.ReactNode` |  |
| `className` | `string` |  |
| `defaultOpen` | `boolean` |  |
| `description` | `React.ReactNode` |  |
| `initialFocus` | `React.RefObject<HTMLElement \| null>` | Element to focus on open; defaults to the first tabbable element, or the popup. |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `openOnHover` | `boolean` | Also open on hover (for preview content). Focus and click still open it. |
| `open` | `boolean` |  |
| `side` | `PopoverSide` |  |
| `size` | `PopoverSize` |  |
| `title` | `React.ReactNode` | Visible heading; also the popup's accessible name. Use `aria-label` when there is no title. |
| `trigger` * | `React.ReactElement<Record<string, unknown>, string \| React.JSXElementConstructor<any>>` | Element that toggles the popover (usually a Button or IconButton with its own name). |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `PopoverClose`

*component* — Wraps a button so activating it closes the nearest Popover.

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactElement<Record<string, unknown>, string \| React.JSXElementConstructor<any>>` | The element that closes the popover, e.g. `<Button variant="ghost">完成</Button>`. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Radio`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `aria-label` | `undefined` | The name comes from `label`; a second naming channel would drift from the visible text. |
| `aria-labelledby` | `undefined` |  |
| `className` | `string` |  |
| `description` | `React.ReactNode` |  |
| `label` * | `React.ReactNode` |  |
| `style` | `React.CSSProperties` |  |
| `value` * | `string` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `RadioGroup`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `className` | `string` |  |
| `description` | `React.ReactNode` |  |
| `disabled` | `boolean` |  |
| `error` | `React.ReactNode` | Shown when nothing is chosen on submit (`required`) or when `invalid` is set. |
| `invalid` | `boolean` |  |
| `label` * | `React.ReactNode` |  |
| `name` | `string` |  |
| `optional` | `boolean` |  |
| `orientation` | `ChoiceOrientation` |  |
| `required` | `boolean` |  |
| `style` | `React.CSSProperties` |  |
| `validationMode` | `FieldValidationMode` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `RecordHeader`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `actions` | `React.ReactNode` |  |
| `classification` | `readonly React.ReactNode[]` | Classification terms, e.g. ["样本", "海洋来源"]. Joined with a hairline separator. |
| `headingLevel` | `1 \| 2 \| 3` | Heading level of the title; keep the document outline correct. |
| `meta` | `readonly MetadataItem[]` | Key facts beside the title (created / updated / owner). Empty values are hidden. |
| `recordId` | `string` | Record identifier, e.g. "ARC-1024". Rendered in mono above the title. |
| `status` | `RecordStatus` |  |
| `summary` | `React.ReactNode` |  |
| `title` * | `React.ReactNode` |  |
| `trailLabel` | `string` | Accessible name of the breadcrumb navigation. |
| `trail` | `readonly RecordTrailItem[]` | Ancestors of this record. Rendered as a breadcrumb <nav>; the last item is the current page. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `RhineProvider`

*component* — Root of a WzRhineLab UI subtree: renders the `.rl-theme` scope, a portal target inside it, the motion/react reduced-motion policy, shared tooltip timing and the toast queue. Nestable — an inner provider can switch theme or density for a region.

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `density` | `RhineDensity` |  |
| `motion` | `RhineMotionPreference` |  |
| `theme` | `RhineTheme` |  |
| `toastLimit` | `number` | Maximum toasts shown at once; older ones are hidden (inert) until space frees up. |
| `toastTimeout` | `number` | Default toast auto-dismiss (ms). |
| `toasts` | `boolean` | Mount a toast queue for this subtree. Nested providers default to `false` so a themed preview region shares the app's single toast viewport. |
| `tooltipDelay` | `number` | Hover delay before a tooltip opens (ms). Moving between adjacent triggers is instant. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Select`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `aria-label` | `string` |  |
| `aria-labelledby` | `string` |  |
| `className` | `string` |  |
| `defaultValue` | `string \| null` |  |
| `disabled` | `boolean` |  |
| `id` | `string` |  |
| `invalid` | `boolean` | Mark invalid outside a Field (inside a Field, validity comes from Field). |
| `name` | `string` |  |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `onValueChange` | `((value: string \| null) => void)` |  |
| `open` | `boolean` |  |
| `options` * | `readonly (SelectOption \| SelectGroup)[]` |  |
| `placeholder` | `React.ReactNode` |  |
| `readOnly` | `boolean` |  |
| `required` | `boolean` |  |
| `size` | `InputSize` |  |
| `value` | `string \| null` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Separator`

*component* — Thin rule between groups of content (`role="separator"`). It is never the only boundary of an interactive region (DESIGN.md §3); focus, error and selection have their own styles.

| Prop | Type | Description |
| --- | --- | --- |
| `decorative` | `boolean` | Purely visual rule: removed from the accessibility tree. Use for decoration inside a group whose structure is already conveyed by headings or lists. |
| `orientation` | `SeparatorOrientation` |  |
| `tone` | `SeparatorTone` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `StatusBadge`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `appearance` | `StatusBadgeAppearance` | `subtle` tints the background; `outline` keeps a neutral fill for dense tables. |
| `size` | `StatusBadgeSize` |  |
| `status` | `StatusKind` | Business status. Always paired with visible text; colour is never the only signal. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `StatusIndicator`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `detail` | `React.ReactNode` | Secondary detail after the label, e.g. last-updated text. |
| `label` * | `React.ReactNode` |  |
| `live` | `boolean` | Announce changes to `label` / `detail` via a polite live region. |
| `pulse` | `boolean` | Soft pulse on the marker for a real, active connection. Disabled by reduced motion. |
| `tone` | `StatusKind` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Surface`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `as` | `SurfaceElement` | Rendered element. Defaults to `section`, which needs an accessible name (`aria-labelledby`) to be exposed as a landmark; use `div` for purely visual grouping. |
| `bordered` | `boolean` | Show a 1px outline. Decorative only; never the sole interactive boundary. |
| `padding` | `SurfacePadding` |  |
| `tone` | `SurfaceTone` | Layer tone. Hierarchy is expressed through tone first, shadow only for `raised`. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Switch`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `aria-label` | `undefined` | The name comes from `label`; a second naming channel would drift from the visible text. |
| `aria-labelledby` | `undefined` |  |
| `className` | `string` |  |
| `description` | `React.ReactNode` |  |
| `hideLabel` | `boolean` |  |
| `label` * | `React.ReactNode` |  |
| `style` | `React.CSSProperties` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Tab`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `className` | `string` |  |
| `meta` | `React.ReactNode` | Optional count or status after the label; read as part of the tab name. |
| `style` | `React.CSSProperties` |  |
| `value` * | `string` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `TabList`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `aria-label` | `string` | Defines a string value that labels the current element. Required: names the tab set for screen readers (e.g. "记录视图"). |
| `aria-labelledby` | `string` | Identifies the element (or elements) that labels the current element. |
| `className` | `string` |  |
| `style` | `React.CSSProperties` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `TabPanel`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `className` | `string` |  |
| `style` | `React.CSSProperties` |  |
| `value` * | `string` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Tabs`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `className` | `string` |  |
| `defaultValue` | `string` |  |
| `onValueChange` | `((value: string) => void)` |  |
| `size` | `TabsSize` |  |
| `style` | `React.CSSProperties` |  |
| `value` | `string` |  |
| `variant` | `TabsVariant` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Text`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `as` | `TextElement` | Rendered element. Defaults to a sensible element per variant; set it to keep the heading outline correct. |
| `dateTime` | `string` |  |
| `htmlFor` | `string` | Passed through for `as="label"` / `as="time"`. |
| `numeric` | `boolean` | Tabular numerals for aligned figures in tables and metadata. |
| `tone` | `TextTone` |  |
| `truncate` | `boolean` | Clamp to one line with an ellipsis. Pair with `title` when the full text matters. |
| `variant` | `TextVariant` | Type role from the token scale. Visual size is independent of the semantic element. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Textarea`

*component* — Multi-line text on Base UI Field.Control: inside `<Field>` it picks up label, description, error and validity like `Input`; standalone it needs `aria-label`.

| Prop | Type | Description |
| --- | --- | --- |
| `autoResize` | `boolean` | Grow with the content (where `field-sizing` is supported) between `rows` and `maxRows`. |
| `className` | `string` |  |
| `defaultValue` | `string` |  |
| `invalid` | `boolean` | Mark invalid outside a Field (inside a Field, validity comes from Field). |
| `maxRows` | `number` | Upper bound for `autoResize`, in lines. Beyond it the textarea scrolls. |
| `mono` | `boolean` |  |
| `onValueChange` | `((value: string, eventDetails: BaseField.Control.ChangeEventDetails) => void)` |  |
| `resize` | `TextareaResize` |  |
| `showCount` | `boolean` | Shows "已输入 n / maxLength" under the control and links it as a description. Requires `maxLength`. |
| `style` | `React.CSSProperties` |  |
| `value` | `string` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Timeline`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `emptyText` | `React.ReactNode` | Shown when `events` is empty. |
| `events` * | `readonly TimelineEvent[]` |  |
| `reversed` | `boolean` | Newest-first lists set `reversed` so ordinal semantics match reading order. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ToastViewport`

*component* — Viewport that renders queued toasts. Mounted by RhineProvider; render it yourself only without one.

### `Tooltip`

*component* — Visual label for icon-only or truncated controls (Base UI Tooltip). Not for essential information: tooltips are unavailable to touch and screen-reader users, so put anything important in visible text or a Popover instead.

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactElement<Record<string, unknown>, string \| React.JSXElementConstructor<any>>` | A single focusable element (Button, IconButton, link). It must already have an accessible name; the tooltip only mirrors it for sighted mouse and keyboard users. |
| `className` | `string` |  |
| `content` * | `React.ReactNode` | Short visual label. Must match the trigger's accessible name — tooltips are not announced. |
| `defaultOpen` | `boolean` |  |
| `delay` | `number` | Override the provider's hover delay (ms). Focus always opens immediately. |
| `disabled` | `boolean` |  |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `open` | `boolean` |  |
| `side` | `TooltipSide` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `VisuallyHidden`

*component* — Content for assistive tech only: still in the accessibility tree, removed from layout. Not a way to hide focusable controls unless `focusable` makes them reappear on focus.

| Prop | Type | Description |
| --- | --- | --- |
| `as` | `VisuallyHiddenElement` |  |
| `focusable` | `boolean` | Become visible while it or a descendant has focus (skip links). |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

## Functions & hooks

### `usePortalContainer`

*function* — Portal target for popups (Dialog, Select, Tooltip, Popover, Menu, Toast). Inside a RhineProvider it is a node within the themed root, so popups inherit --rl-* tokens, theme, density and reduced motion. The value is the element itself (not a ref) so portals re-render once it exists; a null container would otherwise make Base UI fall back to <body> and lose the theme. Returns `undefined` outside a provider.

```ts
function usePortalContainer: () => HTMLElement | null | undefined
```

### `useRhineMotion`

*function* — Single entry point for component motion. Honours `<MotionConfig reducedMotion="user" | "always" | "never">` so apps (and the showcase) can force either mode.

```ts
function useRhineMotion: () => RhineMotion
```

### `useToast`

*function*

```ts
function useToast: () => ToastApi
```

## Constants

### `duration`

*const* — Duration tokens in seconds, derived from the shared token manifest.

```ts
const duration: Record<"base" | "instant" | "press" | "fast" | "panel" | "scene" | "showcase", number>
```

### `ease`

*const*

```ts
const ease: { readonly out: [number, number, number, number]; readonly inOut: [number, number, number, number]; readonly linear: "linear"; }
```

### `fadePresence`

*const* — Short presence fade used by inline feedback (spinner, status swap).

```ts
const fadePresence: { readonly initial: { readonly opacity: 0; }; readonly animate: { readonly opacity: 1; }; readonly exit: { readonly opacity: 0; }; }
```

### `pressScale`

*const* — Press feedback: ≤1.5% scale, no layout shift, no hit-area change.

```ts
const pressScale: 0.985
```

### `ToastProvider`

*const*

```ts
const ToastProvider: React.FC<ToastProviderProps>
```

### `transition`

*const* — Named transitions. Components import these instead of writing their own numbers.

```ts
const transition: { readonly press: { readonly duration: number; readonly ease: [number, number, number, number]; }; readonly release: { readonly duration: number; readonly ease: [number, number, number, number]; }; readonly fast: { readonly duration: number; readonly ease: [number, number, number, number]; }; readonly base: { readonly duration: number; readonly ease: [number, number, number, number]; }; readonly panel: { readonly duration: number; readonly ease: [number, number, number, number]; }; readonly scene: { readonly duration: number; readonly ease: [number, number, number, number]; }; readonly loop: { readonly duration: number; readonly ease: "linear"; readonly repeat: number; }; readonly instant: { readonly duration: 0; }; }
```

## Interfaces

### `ArchiveCardStatus`

*interface* — Compact archive record for lists and grids (COMPONENTS.md "标准档案卡"). Only `id` and `title` are required; every other field is hidden when missing, so the card never shows invented times, readings or permissions. When `href` or `onOpen` is set the whole card is one link/button whose name is the title; secondary metadata is attached as its description.

| Member | Type | Description |
| --- | --- | --- |
| `label` * | `React.ReactNode` |  |
| `tone` * | `StatusKind` |  |

### `DataTableColumn`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `align` | `"center" \| "start" \| "end"` |  |
| `cell` | `((row: Row) => React.ReactNode)` | Cell content. Defaults to `String(row[key])` when the row has that property. |
| `header` * | `React.ReactNode` |  |
| `hideHeader` | `boolean` | Header text visually hidden but kept for screen readers (e.g. an actions column). |
| `key` * | `string` |  |
| `mono` | `boolean` | Monospace, tabular figures for IDs, numbers and timestamps. |
| `rowHeader` | `boolean` | Use this column's cell as the row header (<th scope="row">). One per table. |
| `sortable` | `boolean` | Allow sorting by this column. |
| `width` | `string` | Fixed column width as a CSS length or token, e.g. `var(--rl-space-16)`. |

### `MetadataItem`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `dateTime` | `string` | Machine-readable date/time; wraps the value in <time dateTime>. |
| `hint` | `React.ReactNode` | Short note under the value, e.g. a unit basis or provenance. |
| `key` | `string` | Stable key; defaults to the label when it is a string. |
| `label` * | `React.ReactNode` |  |
| `mono` | `boolean` | Monospace value for IDs, codes, measurements and timestamps. |
| `value` * | `React.ReactNode` |  |
| `wide` | `boolean` | Let a long value span the full row in multi-column layouts. |

### `RecordStatus`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `label` * | `React.ReactNode` | Visible text; colour never carries the status alone. |
| `tone` * | `StatusKind` |  |

### `RecordTrailItem`

*interface* — Archive record header: location trail, record ID, status, title, classification, summary, key timestamps and actions. Every field except `title` is optional and is omitted when absent — the header never fabricates IDs, dates or access levels.

| Member | Type | Description |
| --- | --- | --- |
| `href` | `string` | Omit for the current record; links render as <a>. |
| `label` * | `React.ReactNode` |  |

### `RhineMotion`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `get` * | `(name: RhineTransitionName) => Transition` | Returns the named preset, or an instant transition when motion is reduced. |
| `reduced` * | `boolean` | True when the OS preference or the nearest `<MotionConfig reducedMotion>` asks for reduced motion. |

### `SelectGroup`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `label` * | `React.ReactNode` |  |
| `options` * | `readonly SelectOption[]` |  |

### `SelectOption`

*interface* — Single-value select on Base UI Select (ADR-0001): combobox + listbox semantics, typeahead, arrow/Home/End navigation, Escape to cancel, focus return. Inside `<Field>` it takes the field's label, description, error and validity; standalone, pass `aria-label`. Popup motion is a CSS transition on Base UI's starting/ending styles (--rl-motion-fast).

| Member | Type | Description |
| --- | --- | --- |
| `disabled` | `boolean` |  |
| `label` * | `React.ReactNode` |  |
| `value` * | `string` |  |

### `SortState`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `column` * | `string` |  |
| `direction` * | `SortDirection` |  |

### `TimelineEvent`

*interface* — Chronological event log as an ordered list. Each event needs a real timestamp (`dateTime` is machine-readable, `time` is the visible text); the component does not sort, invent or reformat times — pass events in the order they should read.

| Member | Type | Description |
| --- | --- | --- |
| `actor` | `React.ReactNode` | Who or what recorded the event. |
| `dateTime` * | `string` | ISO 8601 date or date-time, used for <time dateTime>. |
| `description` | `React.ReactNode` |  |
| `id` * | `string` |  |
| `time` | `React.ReactNode` | Visible time text; defaults to `dateTime`. |
| `title` * | `React.ReactNode` |  |
| `tone` | `StatusKind` | Optional status marker; the title must still say what happened. |

### `ToastApi`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `dismiss` * | `(id?: string) => void` |  |
| `show` * | `(options: ToastOptions) => string` | Show a toast; returns its id. |
| `update` * | `(id: string, options: Partial<ToastOptions>) => void` | Replace the content of an existing toast (e.g. 处理中 → 已完成). |

### `ToastOptions`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `action` | `{ label: string; onClick: () => void; }` | A single follow-up action, e.g. 撤销 / 查看. |
| `description` | `React.ReactNode` |  |
| `onClose` | `(() => void)` |  |
| `priority` | `"low" \| "high"` | `high` interrupts screen readers (role=alert). Reserve for failures and time-critical notices. |
| `status` | `ToastStatus` |  |
| `timeout` | `number` | Auto-dismiss delay in ms. `0` keeps it until dismissed; use for errors that need action. |
| `title` * | `React.ReactNode` |  |

## Types

### `ArchiveCardProps`

*type*

### `ButtonProps`

*type*

### `ButtonSize`

*type*

```ts
type ButtonSize = 'sm' | 'md' | 'lg'
```

### `ButtonVariant`

*type*

```ts
type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost'
```

### `CheckboxGroupProps`

*type*

### `CheckboxProps`

*type*

### `ChoiceOrientation`

*type*

```ts
type ChoiceOrientation = 'vertical' | 'horizontal'
```

### `DataTableProps`

*type*

### `DialogCloseProps`

*type*

```ts
type DialogCloseProps = { /** The element that closes the dialog, typically `<Button variant="ghost">取消</Button>`. */ children: React.ReactElement<Record<string, unknown>>; }
```

### `DialogProps`

*type*

### `DialogSize`

*type* — Modal dialog on Base UI Dialog (ADR-0001): focus trap, Escape, scroll lock, inert background and focus return are handled by Base UI; enter/exit run through motion/react (panel 280ms, 8px rise; opacity-only under reduced motion). Open state is always owned here so exit animations can finish before unmount, whether the caller controls `open` or not.

```ts
type DialogSize = 'sm' | 'md' | 'lg'
```

### `FieldProps`

*type*

### `FieldsetProps`

*type*

### `FieldValidationMode`

*type*

```ts
type FieldValidationMode = 'onSubmit' | 'onBlur' | 'onChange'
```

### `FormProps`

*type*

```ts
type FormProps = Omit<BaseFormProps, 'className' | 'style' | 'render'> & { className?: string; style?: React.CSSProperties; }
```

### `IconButtonProps`

*type*

### `IconButtonVariant`

*type*

```ts
type IconButtonVariant = 'secondary' | 'ghost' | 'primary'
```

### `InputProps`

*type*

### `InputSize`

*type*

```ts
type InputSize = 'sm' | 'md' | 'lg'
```

### `MenuAlign`

*type*

```ts
type MenuAlign = 'start' | 'center' | 'end'
```

### `MenuCheckboxItemProps`

*type*

```ts
type MenuCheckboxItemProps = { children: React.ReactNode; checked?: boolean; defaultChecked?: boolean; onCheckedChange?: (checked: boolean) => void; disabled?: boolean; }
```

### `MenuGroupProps`

*type*

```ts
type MenuGroupProps = { label?: React.ReactNode; children: React.ReactNode; }
```

### `MenuItemProps`

*type*

### `MenuProps`

*type*

### `MenuRadioGroupProps`

*type*

```ts
type MenuRadioGroupProps = { /** Visible group heading; also names the group for assistive tech. */ label?: React.ReactNode; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; children: React.ReactNode; }
```

### `MenuRadioItemProps`

*type*

```ts
type MenuRadioItemProps = { value: string; children: React.ReactNode; disabled?: boolean; }
```

### `MenuSide`

*type* — Action menu on Base UI Menu (ADR-0001): menu / menuitem semantics, arrow-key roving focus, typeahead, Home/End, Escape and outside-click dismissal, focus return to the trigger. Use for commands on an object ("导出 / 复制编号 / 归档"); use Select to choose a value and Tabs to switch views. Popup motion is a CSS transition (--rl-motion-fast).

```ts
type MenuSide = 'top' | 'bottom' | 'left' | 'right'
```

### `MetadataEmpty`

*type*

```ts
type MetadataEmpty = 'hide' | 'placeholder'
```

### `MetadataListLayout`

*type*

```ts
type MetadataListLayout = 'inline' | 'stacked'
```

### `MetadataListProps`

*type*

### `MetadataValue`

*type* — Archive metadata as a semantic description list (<dl>). Values come from the caller's real record; missing values are hidden by default so the component never displays invented placeholders as if they were data.

```ts
type MetadataValue = React.ReactNode
```

### `PopoverAlign`

*type*

```ts
type PopoverAlign = 'start' | 'center' | 'end'
```

### `PopoverCloseProps`

*type*

```ts
type PopoverCloseProps = { /** The element that closes the popover, e.g. `<Button variant="ghost">完成</Button>`. */ children: React.ReactElement<Record<string, unknown>>; }
```

### `PopoverProps`

*type*

### `PopoverSide`

*type* — Non-modal floating panel on Base UI Popover (ADR-0001). Unlike Tooltip it may hold interactive content and is reachable by touch and assistive tech: the trigger gets aria-expanded / aria-controls, the popup is a labelled dialog, focus moves in on open and returns on close, Escape and outside clicks dismiss. Popup motion is a CSS transition on Base UI's starting/ending styles (--rl-motion-fast).

```ts
type PopoverSide = 'top' | 'bottom' | 'left' | 'right'
```

### `PopoverSize`

*type*

```ts
type PopoverSize = 'sm' | 'md' | 'lg'
```

### `RadioGroupProps`

*type*

### `RadioProps`

*type*

### `RecordHeaderProps`

*type*

### `RhineDensity`

*type*

```ts
type RhineDensity = 'comfortable' | 'compact'
```

### `RhineMotionPreference`

*type* — `user` follows the OS setting; `reduce` forces reduced motion for this subtree.

```ts
type RhineMotionPreference = 'user' | 'reduce'
```

### `RhineProviderProps`

*type*

### `RhineTheme`

*type*

```ts
type RhineTheme = 'light' | 'dark' | 'system'
```

### `RhineTransitionName`

*type*

```ts
type RhineTransitionName = keyof typeof transition
```

### `SelectProps`

*type*

### `SeparatorOrientation`

*type*

```ts
type SeparatorOrientation = 'horizontal' | 'vertical'
```

### `SeparatorProps`

*type*

### `SeparatorTone`

*type*

```ts
type SeparatorTone = 'subtle' | 'default' | 'strong'
```

### `SortDirection`

*type* — Data table on a native <table>: real header cells, a caption, sortable columns that report `aria-sort`, optional row selection with named checkboxes, and an empty state. Wide tables scroll horizontally inside a focusable, labelled region instead of shrinking text. Sorting is controlled: the component reports the requested order and the caller supplies sorted rows, so it never reorders data it does not understand.

```ts
type SortDirection = 'ascending' | 'descending'
```

### `StatusBadgeAppearance`

*type*

```ts
type StatusBadgeAppearance = 'subtle' | 'outline'
```

### `StatusBadgeProps`

*type*

### `StatusBadgeSize`

*type*

```ts
type StatusBadgeSize = 'sm' | 'md'
```

### `StatusIndicatorProps`

*type* — Inline live/system status: a shaped marker plus visible text, e.g. "同步中 · 2 分钟前". For changing values set `live` so updates are announced politely. The optional pulse is a Showcase-grade signal only for genuinely live connections; it stops under reduced motion and is never used to imply activity that is not happening.

### `StatusKind`

*type*

```ts
type StatusKind = 'neutral' | 'info' | 'success' | 'warning' | 'danger'
```

### `SurfaceElement`

*type*

```ts
type SurfaceElement = 'section' | 'div' | 'article' | 'aside'
```

### `SurfacePadding`

*type*

```ts
type SurfacePadding = 'none' | 'sm' | 'md' | 'lg'
```

### `SurfaceProps`

*type*

### `SurfaceTone`

*type*

```ts
type SurfaceTone = 'default' | 'subtle' | 'raised'
```

### `SwitchProps`

*type*

### `TabListProps`

*type*

### `TabPanelProps`

*type*

```ts
type TabPanelProps = Omit<React.ComponentProps<typeof BaseTabs.Panel>, 'className' | 'style' | 'render' | 'value'> & { value: string; className?: string; style?: React.CSSProperties; }
```

### `TabProps`

*type*

### `TabsProps`

*type*

### `TabsSize`

*type*

```ts
type TabsSize = 'sm' | 'md'
```

### `TabsVariant`

*type* — Tabs on Base UI Tabs (ADR-0001): roving focus with arrow keys, Home/End, automatic tab/tabpanel wiring. The indicator slides via CSS transition on Base UI's --active-tab-* variables (--rl-motion-base); it jumps under reduced motion and retargets from its current position when switched mid-flight.

```ts
type TabsVariant = 'line' | 'segmented'
```

### `TextareaProps`

*type*

### `TextareaResize`

*type*

```ts
type TextareaResize = 'vertical' | 'none'
```

### `TextElement`

*type*

```ts
type TextElement = 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label' | 'strong' | 'em' | 'small' | 'code' | 'time' | 'dt' | 'dd' | 'figcaption' | 'legend'
```

### `TextProps`

*type*

### `TextTone`

*type*

```ts
type TextTone = 'primary' | 'muted' | 'subtle' | 'accent' | 'danger' | 'success' | 'warning' | 'info'
```

### `TextVariant`

*type*

```ts
type TextVariant = 'display' | 'heading-1' | 'heading-2' | 'heading-3' | 'body' | 'body-sm' | 'label' | 'meta' | 'mono' | 'eyebrow'
```

### `TimelineProps`

*type*

### `ToastStatus`

*type* — Notifications on Base UI Toast (ADR-0001). The viewport is a polite live region (F6 jumps into it); `priority: 'high'` toasts are announced assertively. Toasts pause their timer while hovered or focused, stack with a peek, and can be swiped away on touch. `RhineProvider` mounts the provider and viewport, so call `useToast()` anywhere inside it.

```ts
type ToastStatus = Exclude<StatusKind, 'neutral'> | 'neutral'
```

### `TooltipProps`

*type*

### `TooltipSide`

*type*

```ts
type TooltipSide = 'top' | 'bottom' | 'left' | 'right'
```

### `VisuallyHiddenElement`

*type*

```ts
type VisuallyHiddenElement = 'span' | 'div' | 'p' | 'h2' | 'h3' | 'label' | 'legend'
```

### `VisuallyHiddenProps`

*type*

```ts
type VisuallyHiddenProps = React.HTMLAttributes<HTMLElement> & { as?: VisuallyHiddenElement; /** Become visible while it or a descendant has focus (skip links). */ focusable?: boolean; }
```

