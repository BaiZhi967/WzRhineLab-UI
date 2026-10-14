# @wzrhine/react · API reference

> 由 `scripts/api-report.mjs` 从 `dist/index.d.ts` 生成，请勿手改。版本 0.2.0，共 294 个导出（83 components，19 functions & hooks，8 constants，31 interfaces，153 types）。

## Components

### `Accordion`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` | Composition form: `AccordionItem` elements. |
| `defaultValue` | `string[]` |  |
| `disabled` | `boolean` |  |
| `headingLevel` | `AccordionHeadingLevel` | Heading element wrapping each trigger; pick the level that fits the page outline. |
| `hiddenUntilFound` | `boolean` | Closed panels use `hidden="until-found"` so browser find-in-page can open them. |
| `items` | `readonly AccordionItemData[]` | Convenience data form. Ignored when `children` is given. |
| `keepMounted` | `boolean` | Keep closed panels in the DOM (hidden). |
| `multiple` | `boolean` | Allow more than one item open at a time (default: opening one closes the others). |
| `onValueChange` | `((value: string[]) => void)` |  |
| `value` | `string[]` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `AccordionItem`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` |  |
| `disabled` | `boolean` |  |
| `headingLevel` | `AccordionHeadingLevel` | Overrides the parent Accordion's `headingLevel`. |
| `meta` | `React.ReactNode` |  |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `title` * | `React.ReactNode` |  |
| `value` * | `string` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Alert`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `action` | `React.ReactNode` | Follow-up control(s), e.g. a small Button 「查看」. |
| `children` | `React.ReactNode` |  |
| `dismissLabel` | `string` | Accessible name of the close button. |
| `icon` | `React.ReactNode` | Replace the tone icon; `null` removes it. |
| `live` | `AlertLive` |  |
| `onDismiss` | `(() => void)` | Shows a close button. The caller removes the Alert and places focus. |
| `size` | `AlertSize` |  |
| `title` | `React.ReactNode` |  |
| `tone` | `AlertTone` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `AlertDialog`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `alternateAction` | `AlertDialogAlternateAction` |  |
| `aria-label` | `undefined` | The accessible name and description always come from `title` / `description`. |
| `aria-labelledby` | `undefined` |  |
| `cancelLabel` | `React.ReactNode` |  |
| `children` | `React.ReactNode` | Extra detail about the consequences, e.g. the affected records. |
| `className` | `string` |  |
| `confirmDisabled` | `boolean` |  |
| `confirmLabel` * | `React.ReactNode` | Label of the confirming action; name it after the action ("删除记录"), not "确定". |
| `defaultOpen` | `boolean` |  |
| `description` * | `React.ReactNode` | Required: a confirmation must say what will happen. |
| `emphasis` | `"confirm" \| "cancel"` |  |
| `errorText` | `React.ReactNode` | Shown in a role="alert" message when the Promise from `onConfirm` rejects. |
| `eyebrow` | `React.ReactNode` | Small archive-style label above the title, e.g. "ARCHIVE / DELETE". |
| `onClosed` | `(() => void)` | Fires after the exit animation, when focus has returned. |
| `onConfirm` * | `() => void \| Promise<unknown>` | Runs on confirm. Return a Promise to keep the dialog open until it settles. |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `open` | `boolean` |  |
| `title` * | `React.ReactNode` |  |
| `tone` | `AlertDialogTone` | `danger` (default) fills the confirm button with the danger colour. |
| `trigger` | `React.ReactElement<Record<string, unknown>, string \| React.JSXElementConstructor<any>>` | Element that opens the dialog (usually a Button). Omit when opening programmatically. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

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
| `motion` | `"none" \| "identity"` | `identity`: the record ID continues into a matching `ArchiveIdentity` (list → detail). Default `none`. |
| `onOpen` | `(() => void)` | Open the record in place (renders <button>). Ignored when `href` is set. |
| `selected` | `boolean` | Selected in a list/detail layout. |
| `status` | `ArchiveCardStatus` |  |
| `subcategory` | `React.ReactNode` | Short secondary classification, e.g. a discipline. |
| `title` * | `React.ReactNode` |  |
| `updatedAt` | `string` | ISO date for <time dateTime>; `updatedLabel` is the visible text (defaults to the ISO string). |
| `updatedLabel` | `React.ReactNode` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ArchiveIdentity`

*component* — Target end of an ArchiveCard shared identity, e.g. the ID line of a detail pane.

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` | Visible text; defaults to the ID. |
| `className` | `string` |  |
| `id` * | `string` | Record ID; must match the `ArchiveCard` it continues from. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Breadcrumb`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `expandLabel` | `((count: number) => string)` | Accessible name of the expand button; receives the total number of levels. |
| `items` * | `readonly BreadcrumbItem[]` |  |
| `label` | `string` | Accessible name of the navigation landmark. |
| `maxItems` | `number` | Collapse when the path has more than this many items: the first item and the last two stay, the rest hide behind an expand button. `0` never collapses. |
| `renderLink` | `((props: BreadcrumbLinkProps) => React.ReactNode)` | Render links with a router component instead of `<a>`. |

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
| `tone` | `ButtonTone` |  |
| `variant` | `ButtonVariant` | Visual weight. `primary` = ink fill; `accent` = research-orange signal, use once per view. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Callout`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` |  |
| `icon` | `React.ReactNode` | Replace the tone icon; `null` removes it. |
| `title` | `React.ReactNode` |  |
| `tone` | `AlertTone` |  |

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

### `Collapsible`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `chevron` | `boolean` | Show the rotating chevron at the end of the trigger. |
| `children` | `React.ReactNode` |  |
| `defaultOpen` | `boolean` |  |
| `disabled` | `boolean` |  |
| `keepMounted` | `boolean` | Keep the panel in the DOM (hidden) while closed, e.g. to preserve scroll position inside it. |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `open` | `boolean` |  |
| `panelClassName` | `string` | Class name for the panel element. |
| `triggerProps` | `Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" \| "type">` | Extra props for the trigger button (accessible name override, data attributes). |
| `trigger` * | `React.ReactNode` | Content of the trigger button (label, status, meta). The chevron is added unless `chevron={false}`. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Combobox`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `className` | `string` |  |
| `clearLabel` | `string` | Accessible name of the clear button (default from messages). |
| `clearable` | `boolean` | Show the clear button while a value is selected (default `true`). |
| `defaultInputValue` | `string` |  |
| `defaultValue` | `string \| null` |  |
| `description` | `React.ReactNode` |  |
| `disabled` | `boolean` |  |
| `emptyText` | `React.ReactNode` | Shown when nothing matches (default from messages). |
| `error` | `React.ReactNode` | Error text; shown on native validity failure, or always together with `invalid`. |
| `filter` | `ComboboxFilter \| null` | Matching logic. Default: locale-aware "contains" on `label`. `null` turns filtering off, for results that are already filtered on the server. |
| `id` | `string` |  |
| `inputValue` | `string` | Text in the input (controlled). Use with `onInputValueChange` for async search. |
| `invalid` | `boolean` |  |
| `items` * | `readonly ComboboxOption[]` |  |
| `label` * | `React.ReactNode` | Visible label and accessible name of the input. |
| `loadingText` | `React.ReactNode` | Status text while `loading` (default from messages). |
| `loading` | `boolean` | Shows a status row with a spinner and marks the list busy. |
| `name` | `string` | Form field name; the selected `value` is submitted. |
| `onInputValueChange` | `((inputValue: string) => void)` |  |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `onValueChange` | `((value: string \| null) => void)` |  |
| `openLabel` | `string` | Accessible name of the open-list button (default from messages). |
| `open` | `boolean` |  |
| `placeholder` | `string` |  |
| `readOnly` | `boolean` |  |
| `required` | `boolean` |  |
| `size` | `InputSize` |  |
| `style` | `React.CSSProperties` |  |
| `value` | `string \| null` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `CommandPalette`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `className` | `string` |  |
| `commands` * | `readonly CommandItem[]` |  |
| `defaultOpen` | `boolean` |  |
| `emptyText` | `React.ReactNode` |  |
| `filter` | `CommandFilter \| null` | Custom match. Default: every whitespace-separated term appears in label, keywords, group or description. `null` turns local filtering off (results already filtered by the host / server). |
| `hint` | `React.ReactNode` | Footer keyboard hint (default from messages); `null` hides it. |
| `hotkey` | `string` | Global shortcut that toggles the palette, e.g. `mod+k` (`mod` = ⌘ on Apple platforms, Ctrl elsewhere). Combine with `ctrl`, `meta`, `alt`, `shift`. Ignored during IME composition. |
| `loadingText` | `React.ReactNode` | Status text while `loading` (default from messages). |
| `loading` | `boolean` | A search is in flight: shows the status row and marks the list busy. |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `onQueryChange` | `((query: string) => void)` | Every change of the search text (typing, clearing, reset on open). |
| `onSelect` * | `(command: CommandItem) => boolean \| void` | Runs a command. Return `false` to keep the palette open. |
| `open` | `boolean` |  |
| `placeholder` | `string` |  |
| `query` | `string` | Controlled search text. |
| `title` | `string` | Accessible name of the dialog (visually hidden; default from messages). |
| `trigger` | `React.ReactElement<Record<string, unknown>, string \| React.JSXElementConstructor<any>>` | Element that opens the palette (usually a Button). |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ContextMenu`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` | Menu items (`MenuItem` and friends from Menu). |
| `className` | `string` | Class name for the popup. |
| `defaultOpen` | `boolean` |  |
| `disabled` | `boolean` | Leave the browser's native context menu in place. |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `open` | `boolean` |  |
| `trigger` * | `React.ReactElement<Record<string, unknown>, string \| React.JSXElementConstructor<any>>` | The area that opens the menu: one element (usually a row or card) that can hold focus. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `CountBadge`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `live` | `boolean` |  |
| `max` | `number` |  |
| `value` * | `number` |  |

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
| `emptyAction` | `React.ReactNode` | Optional action under the empty text, e.g. a "clear filters" button. |
| `emptyDescription` | `React.ReactNode` | Secondary line under the empty text, e.g. how to get results. |
| `emptyText` | `React.ReactNode` | Empty-state title (rendered by EmptyState size="sm", as a paragraph). |
| `errorText` | `React.ReactNode` |  |
| `getRowId` * | `(row: Row) => string` |  |
| `getRowLabel` | `((row: Row) => string)` | Accessible name for a row's checkbox; defaults to the row id. |
| `hideCaption` | `boolean` | Hide the caption visually (keep it for assistive tech) when a heading already labels the table. |
| `loadingRows` | `number` | Skeleton rows on first load. |
| `loadingText` | `React.ReactNode` |  |
| `onRetry` | `(() => void)` |  |
| `onSelectionChange` | `((ids: Set<string>) => void)` |  |
| `onSortChange` | `((sort: SortState) => void)` |  |
| `pagination` | `DataTablePagination` |  |
| `retryLabel` | `React.ReactNode` |  |
| `rows` * | `readonly Row[]` |  |
| `scrollLabel` | `string` | Accessible label for the horizontal scroll region; defaults to the caption text. |
| `selectedIds` | `ReadonlySet<string>` | Enables a checkbox column. |
| `sort` | `SortState \| null` |  |
| `status` | `DataTableStatus` | `loading`: skeleton rows on first load; with existing rows they stay visible but dimmed. `error`: message + optional retry. Sorting, selection and paging are disabled in both. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Dialog`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `actions` | `React.ReactNode` | Footer actions. Use `<DialogClose>` for buttons that only dismiss. |
| `children` | `React.ReactNode` |  |
| `className` | `string` |  |
| `closeButton` | `boolean` | Render the standard top-right close control (default true). |
| `defaultOpen` | `boolean` |  |
| `description` | `React.ReactNode` |  |
| `dismissOnOutsideClick` | `boolean` | `false` keeps outside clicks from dismissing (use for destructive confirmations). |
| `eyebrow` | `React.ReactNode` | Small archive-style label above the title, e.g. "ARCHIVE / CONFIRM". |
| `finalFocus` | `boolean \| React.RefObject<HTMLElement \| null> \| null` | Focus target after closing; `false` leaves focus where the browser left it. |
| `initialFocus` | `React.RefObject<HTMLElement \| null>` | Element to focus on open; defaults to the first tabbable element. |
| `onCloseRequest` | `((reason: DialogCloseReason) => boolean \| void)` | Called before a user-initiated close. Return `false` to keep the dialog open (focus stays put), e.g. to ask "放弃未保存的更改？" in a nested AlertDialog. Programmatic `open={false}` skips it. |
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

### `Drawer`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `actions` | `React.ReactNode` | Footer action bar. Use `<DrawerClose>` for buttons that only dismiss. |
| `children` | `React.ReactNode` |  |
| `className` | `string` |  |
| `closeLabel` | `string` | Accessible name of the header close button. |
| `defaultOpen` | `boolean` |  |
| `description` | `React.ReactNode` |  |
| `eyebrow` | `React.ReactNode` | Small archive-style label above the title, e.g. "ARCHIVE / DETAIL". |
| `finalFocus` | `React.RefObject<HTMLElement \| null>` | Element to focus after closing; defaults to the trigger or the previously focused element. |
| `initialFocus` | `React.RefObject<HTMLElement \| null>` | Element to focus on open; defaults to the panel itself so its title is announced first. |
| `onCloseRequest` | `((reason: DrawerCloseReason) => boolean \| void)` | Called before a user-initiated close. Return `false` to keep the drawer open (focus stays put), e.g. while a save is in flight. Programmatic `open={false}` skips it. |
| `onClosed` | `(() => void)` | Fires after the exit transition, when focus has returned. |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `open` | `boolean` |  |
| `side` | `DrawerSide` | Logical edge the panel attaches to on wide viewports; follows the writing direction. |
| `size` | `DrawerSize` | Panel width on wide viewports (the bottom sheet is always full width). |
| `title` * | `React.ReactNode` |  |
| `trigger` | `React.ReactElement<Record<string, unknown>, string \| React.JSXElementConstructor<any>>` | Element that opens the drawer (usually a Button). Omit when opening programmatically. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `DrawerClose`

*component* — Wraps a button so activating it closes the nearest Drawer (reason `close-button`).

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactElement<Record<string, unknown>, string \| React.JSXElementConstructor<any>>` | The element that closes the drawer, typically `<Button variant="ghost">取消</Button>`. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `EmptyState`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `action` | `React.ReactNode` | Next step, e.g. 「清除筛选」 or 「新建记录」. |
| `description` | `React.ReactNode` |  |
| `headingLevel` | `EmptyStateHeadingLevel` | Render the title as `<h2>`–`<h6>`; omitted = `<p>`. |
| `icon` | `React.ReactNode` | Replace the kind's icon; `null` removes it. Always decorative. |
| `kind` | `EmptyStateKind` |  |
| `size` | `EmptyStateSize` | `sm` inside tables and cards; `md` for a whole region. |
| `title` * | `React.ReactNode` |  |

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
| `children` | `React.ReactNode` |  |
| `className` | `string` |  |
| `description` | `React.ReactNode` | Read after the legend as the group's description. |
| `disabled` | `boolean` | `disabled` disables every Field and control inside, including Base UI ones. |
| `legendOptional` | `boolean` |  |
| `legend` * | `React.ReactNode` | Section title; names the group for assistive tech. |
| `style` | `React.CSSProperties` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `FileDropZone`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `accept` | `string` | Same syntax as the native attribute: `.png,.jpg`, `image/*`, `application/pdf`. |
| `browseLabel` | `React.ReactNode` | Text of the browse button (default from messages). |
| `children` | `React.ReactNode` | Custom prompt inside the drop area (replaces the default text, not the button). |
| `className` | `string` |  |
| `description` | `React.ReactNode` |  |
| `disabled` | `boolean` |  |
| `error` | `React.ReactNode` | Error text shown under the area while `invalid`. |
| `formatSize` | `((bytes: number) => string)` | Formats `maxSize` for rejection messages (default: B / KB / MB in the provider locale). |
| `id` | `string` |  |
| `invalid` | `boolean` | Visual and semantic invalid state, e.g. a required attachment is missing. |
| `label` * | `React.ReactNode` | Visible label above the drop area. |
| `maxFiles` | `number` | Maximum number of files accepted from one pick or drop (default: 1 unless `multiple`). |
| `maxSize` | `number` | Maximum size of one file, in bytes. |
| `multiple` | `boolean` |  |
| `name` | `string` | Form field name of the native input. The input is cleared after each pick, so submit files yourself. |
| `onFiles` | `((files: File[]) => void)` | Accepted files of one pick or drop (not called when every file was rejected). |
| `onReject` | `((rejections: FileRejection[]) => void)` | Rejected files of one pick or drop, with the first reason found (type, then size, then count). |
| `style` | `React.CSSProperties` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Form`

*component* — `<form>` on Base UI Form. On submit it validates every Field / CheckboxGroup / RadioGroup inside, shows their errors, moves focus to the first invalid control and only then calls `onSubmit`. `errors` maps field `name`s to server-side messages after a failed submission. A plain `<form>` still works, but then errors only appear per field on change / blur.

| Prop | Type | Description |
| --- | --- | --- |
| `className` | `string` |  |
| `disabled` | `boolean` |  |
| `style` | `React.CSSProperties` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Icon`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` | Custom SVG inner nodes; win over the built-in path for `name`. |
| `name` * | `(string & {}) \| "Settings" \| "Settings2" \| "SlidersHorizontal" \| "Minus" \| "Maximize" \| "Maximize2" \| "Minimize2" \| "PanelTopClose" \| "PanelTopOpen" \| "Power" \| "Square" \| "FolderOpen" \| "FolderPlus" \| "FolderMinus" \| "FileCode2" \| "FoldVertical" \| "Plug" \| "Puzzle" \| "Boxes" \| "ShieldAlert" \| "ShieldHalf" \| "ChevronUp" \| "Eye" \| "ImagePlus" \| "MessagesSquare" \| "PinOff" \| "RotateCcw" \| "SquareChartGantt" \| "Users" \| "ChevronDown" \| "ChevronLeft" \| "ChevronRight" \| "Plus" \| "X" \| "Check"` | Built-in icon name. Any other string is accepted together with `children` (custom SVG content). |
| `size` | `string \| number` |  |

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
| `columns` | `2 \| 3 \| 1` | Number of item columns on wide containers; collapses to one on narrow ones. |
| `empty` | `MetadataEmpty` | How to treat items whose value is null / undefined / ''. `hide` (default) omits the row; `placeholder` keeps the row with a dash announced as「未记录」. |
| `items` * | `readonly MetadataItem[]` |  |
| `layout` | `MetadataListLayout` | `inline`: label column + value; `stacked`: label above value (narrow panels). |
| `size` | `"sm" \| "md"` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Meter`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `aria-label` | `undefined` | The accessible name comes from `label`. |
| `aria-labelledby` | `undefined` |  |
| `className` | `string` |  |
| `description` | `React.ReactNode` |  |
| `getValueText` | `((formatted: string, value: number) => string)` |  |
| `hideLabel` | `boolean` |  |
| `high` | `number` |  |
| `label` * | `React.ReactNode` |  |
| `low` | `number` | Values below `low` / above `high` are out of the preferred range (like native <meter>). |
| `optimum` | `number` | Where the good region is; decides whether low or high values are the warning side. |
| `size` | `ProgressSize` |  |
| `stateLabels` | `Partial<Record<MeterState, string>>` | Text for the derived state, appended to the spoken value: e.g. { warning: '偏高' }. |
| `style` | `React.CSSProperties` |  |
| `valueText` | `React.ReactNode` | Visible value text; defaults to the formatted value. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `MotionPresence`

*component* — Enter / exit wrapper over `AnimatePresence`. Toggling `show` mid-flight reverses from the current visual state (no queued animations). Hidden content is unmounted, so it never lingers in the accessibility tree.

| Prop | Type | Description |
| --- | --- | --- |
| `as` | `"span" \| "div" \| "li" \| "ol" \| "section" \| "ul"` | Element rendered for the animated wrapper. |
| `children` | `React.ReactNode` |  |
| `initial` | `boolean` | Animate on first render too. Off by default: content present at load just appears. |
| `onExitComplete` | `(() => void)` | Fires after the exit animation, once the content has unmounted. |
| `preset` | `MotionPresencePreset` |  |
| `show` * | `boolean` | Mount (true) or animate out and unmount (false). |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `MotionSpeed`

*component* — Slows every `useRhineMotion()` transition in this subtree. Review and showcase only (e.g. the motion player's Slow ×0.25 lane); never ship it in a product view.

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `speed` * | `number` | 0.25 = four times slower. Values ≤ 0 are ignored. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `NavGroup`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `collapsed` | `boolean` |  |
| `label` * | `React.ReactNode` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `NavItem`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `active` | `boolean` |  |
| `badge` | `React.ReactNode` |  |
| `collapsed` | `boolean` |  |
| `disabled` | `boolean` |  |
| `href` | `string` |  |
| `icon` | `React.ReactNode` |  |
| `label` * | `React.ReactNode` |  |
| `render` | `React.ReactElement<Record<string, unknown>, string \| React.JSXElementConstructor<any>> \| ((props: React.HTMLAttributes<HTMLElement>) => React.ReactElement)` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `NavList`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `label` | `string` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `NavRail`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `collapsed` | `boolean` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `NumberField`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `defaultValue` | `number` |  |
| `description` | `React.ReactNode` |  |
| `disabled` | `boolean` |  |
| `error` | `React.ReactNode` | Error text: shows on native validity failure, or always together with `invalid`. |
| `format` | `Intl.NumberFormatOptions` | Intl options for display and parsing (e.g. `{ style: 'percent' }`); locale comes from RhineProvider. |
| `hideLabel` | `boolean` |  |
| `inherited` | `string \| number \| boolean` |  |
| `inputRef` | `React.Ref<HTMLInputElement>` | Ref to the visible text input. |
| `invalid` | `boolean` |  |
| `label` * | `React.ReactNode` |  |
| `largeStep` | `number` |  |
| `max` | `number` |  |
| `min` | `number` |  |
| `name` | `string` |  |
| `onValueChange` | `((value: number \| null) => void)` |  |
| `onValueCommitted` | `((value: number \| null) => void)` | Fires on blur after typing and on pointer release after stepping. |
| `optional` | `boolean` |  |
| `placeholder` | `string` |  |
| `readOnly` | `boolean` |  |
| `ref` | `React.Ref<HTMLDivElement>` |  |
| `required` | `boolean` |  |
| `size` | `InputSize` |  |
| `smallStep` | `number` |  |
| `snapOnStep` | `boolean` | Snap stepped values to multiples of `step`. |
| `step` | `number` |  |
| `submitOnEnter` | `boolean` |  |
| `unit` | `React.ReactNode` | Trailing unit text (e.g. "个"), read as part of the description. |
| `value` | `number \| null` | `null` means empty. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Pagination`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `busy` | `boolean` | A page request is in flight: controls ignore presses and announce `aria-disabled`, but stay focusable so keyboard focus is not dropped to <body> while the table reloads. |
| `defaultPage` | `number` |  |
| `disabled` | `boolean` | Disable every control. |
| `labels` | `PaginationLabels` |  |
| `onPageChange` | `((page: number) => void)` |  |
| `pageCount` | `number` |  |
| `pageSize` | `number` |  |
| `page` | `number` |  |
| `showStatus` | `boolean` | Show the "第 a–b 条，共 n 条" summary (needs `totalItems` and `pageSize`). |
| `siblingCount` | `number` | Pages shown on each side of the current page. |
| `totalItems` | `number` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Popover`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `actions` | `React.ReactNode` | Footer actions. Wrap dismiss-only buttons in `<PopoverClose>`. |
| `align` | `PopoverAlign` |  |
| `anchor` | `HTMLElement \| React.RefObject<HTMLElement \| null> \| { getBoundingClientRect: () => DOMRect; }` | External element or virtual rectangle used when the popover has no trigger. |
| `aria-label` | `string` | Accessible name when no visible `title` is rendered. |
| `arrow` | `boolean` | Show a pointer arrow toward the trigger. |
| `children` | `React.ReactNode` |  |
| `className` | `string` |  |
| `defaultOpen` | `boolean` |  |
| `description` | `React.ReactNode` |  |
| `initialFocus` | `boolean \| React.RefObject<HTMLElement \| null>` | Element to focus on open; defaults to the first tabbable element, or the popup. |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `openOnHover` | `boolean` | Also open on hover (for preview content). Focus and click still open it. |
| `open` | `boolean` |  |
| `sideOffset` | `number` |  |
| `side` | `PopoverSide` |  |
| `size` | `PopoverSize` |  |
| `title` | `React.ReactNode` | Visible heading; also the popup's accessible name. Use `aria-label` when there is no title. |
| `trigger` | `React.ReactElement<Record<string, unknown>, string \| React.JSXElementConstructor<any>>` | Element that toggles the popover (usually a Button or IconButton with its own name). |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `PopoverClose`

*component* — Wraps a button so activating it closes the nearest Popover.

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactElement<Record<string, unknown>, string \| React.JSXElementConstructor<any>>` | The element that closes the popover, e.g. `<Button variant="ghost">完成</Button>`. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Progress`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `aria-label` | `undefined` | The accessible name comes from `label`. |
| `aria-labelledby` | `undefined` |  |
| `className` | `string` |  |
| `description` | `React.ReactNode` |  |
| `getValueText` | `((formatted: string, value: number \| null) => string)` | Spoken value; defaults to the formatted value, or "进行中" when indeterminate. |
| `hideLabel` | `boolean` |  |
| `label` * | `React.ReactNode` |  |
| `size` | `ProgressSize` |  |
| `style` | `React.CSSProperties` |  |
| `tone` | `ProgressTone` |  |
| `valueText` | `React.ReactNode` | Visible text after the label; defaults to the formatted value (e.g. "42%"). `false` hides it. |
| `value` * | `number \| null` | Current value between `min` and `max`; `null` while the total is unknown. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Radio`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `aria-label` | `undefined` | The name comes from `label`; a second naming channel would drift from the visible text. |
| `aria-labelledby` | `undefined` |  |
| `className` | `string` |  |
| `description` | `React.ReactNode` |  |
| `icon` | `React.ReactNode` |  |
| `label` * | `React.ReactNode` |  |
| `style` | `React.CSSProperties` |  |
| `value` * | `string` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `RadioGroup`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `appearance` | `"default" \| "chip" \| "card"` |  |
| `children` * | `React.ReactNode` |  |
| `className` | `string` |  |
| `description` | `React.ReactNode` |  |
| `disabled` | `boolean` |  |
| `error` | `React.ReactNode` | Shown when nothing is chosen on submit (`required`) or when `invalid` is set. |
| `hideLabel` | `boolean` |  |
| `invalid` | `boolean` |  |
| `label` * | `React.ReactNode` |  |
| `name` | `string` |  |
| `optional` | `boolean` |  |
| `orientation` | `ChoiceOrientation` |  |
| `renderIcon` | `((value: string) => React.ReactNode)` |  |
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
| `headingLevel` | `2 \| 3 \| 1` | Heading level of the title; keep the document outline correct. |
| `meta` | `readonly MetadataItem[]` | Key facts beside the title (created / updated / owner). Empty values are hidden. |
| `recordId` | `string` | Record identifier, e.g. "ARC-1024". Rendered in mono above the title. |
| `status` | `RecordStatus` |  |
| `summary` | `React.ReactNode` |  |
| `title` * | `React.ReactNode` |  |
| `trailLabel` | `string` | Accessible name of the breadcrumb navigation. |
| `trail` | `readonly BreadcrumbItem[]` | Ancestors of this record. Rendered as a breadcrumb <nav>; the last item is the current page. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ResizeHandle`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `defaultSize` | `number` |  |
| `disabled` | `boolean` |  |
| `getAriaValueText` | `((size: number) => string)` |  |
| `label` | `string` |  |
| `largeStep` | `number` |  |
| `max` * | `number` |  |
| `min` * | `number` |  |
| `onDraggingChange` | `((dragging: boolean) => void)` |  |
| `onSizeChange` | `((size: number) => void)` |  |
| `pane` | `"start" \| "end"` |  |
| `resetSize` | `number` |  |
| `size` | `number` |  |
| `step` | `number` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `RhineMessagesProvider`

*component* — Copy (and number locale) for a region without its own RhineProvider. Nested providers merge with the outer one per namespace.

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `locale` | `string` | Number locale for this subtree; defaults to the outer provider's (or `zh-CN`). |
| `messages` | `RhineMessagesOverrides` | Partial table merged over the outer provider's (or `zhCN`). |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `RhineMotionGroup`

*component* — Staggered entrance for a short group (≤ ~8 items). Item n waits n × 24ms, capped at the `fast` token (120ms) so long lists never trickle in; reduced motion removes the stagger and the offset. Exit is one group fade, never a reverse cascade.

| Prop | Type | Description |
| --- | --- | --- |
| `as` | `"div" \| "ol" \| "section" \| "ul"` |  |
| `children` | `React.ReactNode` | `RhineMotionItem` children; their order sets the stagger. |
| `initial` | `boolean` | Animate on first render too. Off by default. |
| `onExitComplete` | `(() => void)` |  |
| `preset` | `"fade" \| "rise"` | Item preset. |
| `show` | `boolean` | Mount (true) with staggered items, or fade the whole group out and unmount (false). |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `RhineMotionItem`

*component* — One staggered item; must be a direct child of `RhineMotionGroup`.

| Prop | Type | Description |
| --- | --- | --- |
| `as` | `"span" \| "div" \| "li"` |  |
| `children` | `React.ReactNode` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `RhineProvider`

*component* — Root of a WzRhineLab UI subtree: renders the `.rl-theme` scope, a portal target inside it, the motion/react reduced-motion policy, shared tooltip timing and the toast queue. Nestable — an inner provider can switch theme or density for a region.

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `density` | `RhineDensity` |  |
| `lang` | `string` | Written as `lang` on the `.rl-theme` root (popups mount inside it) when set; otherwise inherited. |
| `locale` | `string` | Number locale for Stat, Pagination, Progress / Meter; defaults to the outer provider's, else `zh-CN`. |
| `messages` | `RhineMessagesOverrides` | Built-in copy for this subtree (ADR-0009), merged per namespace over the outer provider's table (or `zhCN`). Component props still win. |
| `motion` | `RhineMotionPreference` |  |
| `theme` | `RhineTheme` |  |
| `toastLimit` | `number` | Maximum toasts shown at once; older ones are hidden (inert) until space frees up. |
| `toastTimeout` | `number` | Default toast auto-dismiss (ms). |
| `toasts` | `boolean` | Mount a toast queue for this subtree. Nested providers default to `false` so a themed preview region shares the app's single toast viewport. |
| `tooltipDelay` | `number` | Hover delay before a tooltip opens (ms). Moving between adjacent triggers is instant. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ScrollArea`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `label` * | `string` | Accessible name of the scrollable region, e.g. 「运行日志」. |
| `maxHeight` | `string` | CSS length that caps the viewport height, e.g. `"20rem"`. Without it the area fills its parent. |
| `onScrollIntentUp` | `(() => void)` | The user tried to scroll up (see component docs). |
| `onScroll` | `React.UIEventHandler<HTMLDivElement>` | Native scroll events of the viewport. |
| `orientation` | `ScrollAreaOrientation` | `vertical` (default) wraps content to the width; `both` also scrolls horizontally. |
| `reveal` | `ScrollReveal` |  |
| `thumbMinSize` | `string` |  |
| `viewportClassName` | `string` | Class on the viewport, for padding or content layout. |
| `viewportRef` | `React.Ref<HTMLDivElement>` | Ref to the native scroller (for `scrollTo`, measuring, observers). |

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

### `Skeleton`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `height` | `string` | CSS length. Text defaults to one line height; block and circle to `--rl-space-16`. |
| `lines` | `number` | Text only: number of lines; the last one is 60% wide. |
| `shape` | `SkeletonShape` |  |
| `width` | `string` | CSS length, e.g. `'12rem'`, `'60%'` or `'var(--rl-space-16)'`. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Slider`

*component*

泛型组件：`Slider<V>`。

| Prop | Type | Description |
| --- | --- | --- |
| `aria-label` | `undefined` | The name comes from `label` (use `thumbLabels` for range thumbs). |
| `aria-labelledby` | `undefined` |  |
| `defaultValue` | `V` |  |
| `description` | `React.ReactNode` |  |
| `disabled` | `boolean` |  |
| `formatValue` | `((value: number) => string)` | Custom text for one value (display and default `aria-valuetext`). Wins over `format`. |
| `format` | `Intl.NumberFormatOptions` | Intl options for the displayed and spoken value; locale comes from RhineProvider. |
| `getAriaValueText` | `((formattedValue: string, value: number, index: number) => string)` | Spoken value per thumb; wins over mark labels and `formatValue`. |
| `hideLabel` | `boolean` | Keep the label for assistive tech only. |
| `label` * | `React.ReactNode` | Visible label; names every thumb (required, ADR-0001 naming rule). |
| `largeStep` | `number` | Step for PageUp / PageDown and Shift + arrow (default 10). |
| `marks` | `readonly SliderMark[]` |  |
| `max` | `number` |  |
| `minStepsBetweenValues` | `number` | Minimum distance, in steps, between range thumbs. |
| `min` | `number` |  |
| `name` | `string` |  |
| `onValueChange` | `((value: SliderChangeValue<V>) => void)` |  |
| `onValueCommitted` | `((value: SliderChangeValue<V>) => void)` | Fires once per interaction (pointer release, key press). |
| `ref` | `React.Ref<HTMLDivElement>` |  |
| `showValue` | `boolean` | Show the current value next to the label (`<output>`). |
| `step` | `number` |  |
| `thumbLabels` | `readonly string[]` | Distinct accessible names for range thumbs (e.g. ['下限', '上限']). |
| `value` | `V` | Single number, or an array for a range slider (one thumb per entry). |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Spinner`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `label` | `string` | Spoken status text, e.g. 「正在加载」. Omit for a decorative spinner. |
| `size` | `SpinnerSize` | Maps to the icon-size tokens. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `SplitButton`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` | Menu content: MenuItem, MenuGroup, MenuSeparator… |
| `disabled` | `boolean` |  |
| `iconStart` | `React.ReactNode` | Decorative leading icon of the main action. |
| `label` * | `string` | Text of the main action; also names the group. |
| `loading` | `boolean` | Busy main action; the toggle stays focusable but will not open until it settles. |
| `menuAlign` | `MenuAlign` |  |
| `menuLabel` * | `string` | Accessible name of the menu toggle, e.g. 「更多导出方式」. |
| `menuOpen` | `boolean` |  |
| `menuSide` | `MenuSide` |  |
| `onClick` | `((event: React.MouseEvent<HTMLButtonElement>) => void)` |  |
| `onMenuOpenChange` | `((open: boolean) => void)` |  |
| `size` | `ButtonSize` |  |
| `variant` | `ButtonVariant` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Stat`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `delta` | `StatDelta` |  |
| `description` | `React.ReactNode` |  |
| `emptyLabel` | `string` | Spoken text for missing values. |
| `format` | `Intl.NumberFormatOptions` | Formatting for numeric `value` (Intl.NumberFormat). |
| `label` * | `React.ReactNode` |  |
| `loading` | `boolean` |  |
| `locale` | `Intl.LocalesArgument` |  |
| `size` | `"sm" \| "md" \| "lg"` |  |
| `status` | `StatTone` | Business status of the figure; shown as a side rule, never as the only signal. |
| `unit` | `React.ReactNode` |  |
| `value` * | `string \| number \| null` | Number or preformatted text. `null` / `undefined` = no data. |

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

### `Tag`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `disabled` | `boolean` |  |
| `onRemove` | `(() => void)` |  |
| `removeLabel` | `string` | Override the localized remove label when the tag is used outside the default locale. |
| `tone` | `"neutral" \| "invalid"` |  |

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

### `ToastProvider`

*component* — Toast queue. Mounted by RhineProvider; render it yourself only without one.

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

### `Tree`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `defaultExpandedIds` | `readonly string[]` |  |
| `defaultSelectedId` | `string` |  |
| `empty` | `React.ReactNode` |  |
| `expandedIds` | `readonly string[]` |  |
| `label` * | `string` |  |
| `nodes` * | `readonly TreeNode[]` |  |
| `onExpandedChange` | `((ids: string[]) => void)` |  |
| `onLoadChildren` | `((node: TreeNode) => void \| Promise<void>)` |  |
| `onRetry` | `((node: TreeNode) => void \| Promise<void>)` |  |
| `onSelect` | `((node: TreeNode) => void)` |  |
| `onToggle` | `(React.ToggleEventHandler<HTMLDivElement> & ((node: TreeNode, expanded: boolean) => void))` |  |
| `renderActions` | `((node: TreeNode) => React.ReactNode)` |  |
| `selectedId` | `string` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `VisuallyHidden`

*component* — Content for assistive tech only: still in the accessibility tree, removed from layout. Not a way to hide focusable controls unless `focusable` makes them reappear on focus.

| Prop | Type | Description |
| --- | --- | --- |
| `as` | `VisuallyHiddenElement` |  |
| `focusable` | `boolean` | Become visible while it or a descendant has focus (skip links). |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Workbench`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` |  |
| `defaultIndexOpen` | `boolean` |  |
| `defaultIndexSize` | `number` |  |
| `header` | `React.ReactNode` |  |
| `indexLabel` | `string` |  |
| `indexMax` | `number` |  |
| `indexMin` | `number` |  |
| `indexOpen` | `boolean` |  |
| `indexSize` | `number` |  |
| `index` | `React.ReactNode` |  |
| `mainLabel` | `string` |  |
| `onIndexOpenChange` | `((open: boolean) => void)` |  |
| `onIndexSizeChange` | `((size: number) => void)` |  |
| `rail` | `React.ReactNode` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

## Functions & hooks

### `getMeterState`

*function* — Native <meter> rules: the range is split by `low` / `high`; the region containing `optimum` is good, the adjacent region is "suboptimum", the far region "critical". Without thresholds every value is optimum.

```ts
function getMeterState: (value: number, { min, max, low, high, optimum }: { min?: number; max?: number; low?: number; high?: number; optimum?: number; }) => MeterState
```

### `getPaginationItems`

*function* — Page list with first, last and `siblingCount` pages on each side of `page`. A gap of one page is shown as that page, not an ellipsis, so the list length stays stable while paging.

```ts
function getPaginationItems: (page: number, pageCount: number, siblingCount?: number) => PaginationItem[]
```

### `matchesAccept`

*function* — Whether `file` matches a native-style `accept` list (extensions, exact MIME types, `type/*`).

```ts
function matchesAccept: (file: Pick<File, "name" | "type">, accept: string | undefined) => boolean
```

### `matchHotkey`

*function* — Parses `mod+k` style hotkeys into a predicate over keyboard events.

```ts
function matchHotkey: (hotkey: string, event: KeyboardEvent, apple?: boolean) => boolean
```

### `paginate`

*function* — Rows of one page for client-side pagination. `page` starts at 1.

```ts
function paginate: <Row>(rows: readonly Row[], page: number, pageSize: number) => Row[]
```

### `resolveMotion`

*function* — Resolve a named preset for one kind of property. Pure: pass `reduced` from `useRhineMotion()` (or use its `resolve`, which does this for you). `speed` < 1 slows the result down (showcase review only); it never lengthens the reduced fallback, which stays within the `fast` token.

```ts
function resolveMotion: (kind: MotionPropertyKind, name: RhineTransitionName, reduced: boolean, speed?: number) => Transition
```

### `useInViewport`

*function* — True while the element intersects the viewport. Treated as visible where IntersectionObserver is unavailable.

```ts
function useInViewport: <T extends Element>(ref: React.RefObject<T | null>) => boolean
```

### `useLatestGuard`

*function* — Stale async result guard (MOTION.md lifecycle rule 2): a late response must not reopen a dialog or overwrite newer state.

```ts
function useLatestGuard: () => LatestGuard
```

### `useMotionLifecycle`

*function*

```ts
function useMotionLifecycle: ({ active, autoStart, viewportRef, reduced: forceReduced }?: MotionLifecycleOptions) => MotionLifecycle
```

### `useMotionSpeed`

*function* — Current review speed (1 outside a `MotionSpeed`).

```ts
function useMotionSpeed: () => number
```

### `usePageVisible`

*function* — True while the document is visible. Loops must pause when it turns false (MOTION.md lifecycle rule 4).

```ts
function usePageVisible: () => boolean
```

### `usePortalContainer`

*function* — Portal target for popups (Dialog, Select, Tooltip, Popover, Menu, Toast). Inside a RhineProvider it is a node within the themed root, so popups inherit --rl-* tokens, theme, density and reduced motion. The value is the element itself (not a ref) so portals re-render once it exists; a null container would otherwise make Base UI fall back to <body> and lose the theme. Returns `undefined` outside a provider.

```ts
function usePortalContainer: () => HTMLElement | null | undefined
```

### `useRhineLocale`

*function* — Messages, number locale and a cached formatter of the nearest provider (also used by

```ts
function useRhineLocale: () => RhineLocaleValue & { formatNumber: RhineNumberFormat; }
```

### `useRhineMessages`

*function* — The merged message table of the nearest provider (`zhCN` without one).

```ts
function useRhineMessages: () => RhineMessages
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

### `useWorkbench`

*function*

```ts
function useWorkbench: () => WorkbenchContextValue | null
```

### `validateFiles`

*function* — Splits files into accepted and rejected ones; first failing rule wins (type → size → count).

```ts
function validateFiles: (files: readonly File[], { accept, maxSize, maxFiles }: { accept?: string; maxSize?: number; maxFiles?: number; }) => { accepted: File[]; rejected: FileRejection[]; }
```

### `WorkbenchIndex`

*function* — Route-owned index content. A portal preserves the route's data/provider context.

```ts
function WorkbenchIndex: ({ children }: { children?: React.ReactNode; }) => React.ReactPortal | null
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

### `enUS`

*const* — Reference English translation (参考译文): wording may change before 1.0.

```ts
const enUS: RhineMessages
```

### `fadePresence`

*const* — Short presence fade used by inline feedback (spinner, status swap).

```ts
const fadePresence: { readonly initial: { readonly opacity: 0; }; readonly animate: { readonly opacity: 1; }; readonly exit: { readonly opacity: 0; }; }
```

### `iconNames`

*const* — Public, dependency-free line icon entry used by consumers that need a stable icon grid.

```ts
const iconNames: readonly ["Settings", "Settings2", "SlidersHorizontal", "Minus", "Maximize", "Maximize2", "Minimize2", "PanelTopClose", "PanelTopOpen", "Power", "Square", "FolderOpen", "FolderPlus", "FolderMinus", "FileCode2", "FoldVertical", "Plug", "Puzzle", "Boxes", "ShieldAlert", "ShieldHalf", "ChevronUp", "Eye", "ImagePlus", "MessagesSquare", "PinOff", "RotateCcw", "SquareChartGantt", "Users", "ChevronDown", "ChevronLeft", "ChevronRight", "Plus", "X", "Check"]
```

### `pressScale`

*const* — Press feedback: ≤1.5% scale, no layout shift, no hit-area change.

```ts
const pressScale: 0.985
```

### `transition`

*const* — Named transitions. Components import these instead of writing their own numbers.

```ts
const transition: { readonly press: { readonly duration: number; readonly ease: [number, number, number, number]; }; readonly release: { readonly duration: number; readonly ease: [number, number, number, number]; }; readonly fast: { readonly duration: number; readonly ease: [number, number, number, number]; }; readonly base: { readonly duration: number; readonly ease: [number, number, number, number]; }; readonly panel: { readonly duration: number; readonly ease: [number, number, number, number]; }; readonly scene: { readonly duration: number; readonly ease: [number, number, number, number]; }; readonly showcase: { readonly duration: number; readonly ease: [number, number, number, number]; }; readonly loop: { readonly duration: number; readonly ease: "linear"; readonly repeat: number; }; readonly instant: { readonly duration: 0; }; }
```

### `zhCN`

*const* — Built-in default (zh-CN). Output is identical to the pre-M9.5 hard-coded defaults.

```ts
const zhCN: RhineMessages
```

## Interfaces

### `AccordionItemData`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `content` * | `React.ReactNode` |  |
| `disabled` | `boolean` |  |
| `meta` | `React.ReactNode` | Secondary text at the end of the trigger (count, status). Part of the button's name. |
| `title` * | `React.ReactNode` |  |
| `value` * | `string` | Stable identifier used by `value` / `defaultValue`. |

### `ArchiveCardStatus`

*interface* — Compact archive record for lists and grids (COMPONENTS.md "标准档案卡"). Only `id` and `title` are required; every other field is hidden when missing, so the card never shows invented times, readings or permissions. When `href` or `onOpen` is set the whole card is one link/button whose name is the title; secondary metadata is attached as its description.

| Member | Type | Description |
| --- | --- | --- |
| `label` * | `React.ReactNode` |  |
| `tone` * | `StatusKind` |  |

### `BreadcrumbItem`

*interface* — Location path (ADR-0005 §4): `<nav>` + ordered list; the last item without `href` is the current page. Separators are CSS-generated, so assistive tech reads only the items. Long paths collapse their middle items behind a button that expands in place.

| Member | Type | Description |
| --- | --- | --- |
| `href` | `string` | Omit for the current page; items with `href` render as links. |
| `label` * | `React.ReactNode` |  |

### `BreadcrumbLinkProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `className` * | `string` |  |
| `href` * | `string` |  |
| `title` | `string` |  |

### `ComboboxOption`

*interface* — Searchable single-value select on Base UI Combobox (ADR-0001, ADR-0010 §2): a text input that filters a listbox. Base UI provides the combobox / listbox semantics, `aria-activedescendant` navigation (↓ opens, ↑ / ↓ move, Enter selects, Esc closes, then clears), Home / End in the input, and IME handling (filtering waits for `compositionend`; Enter during composition does not select). The label, description and error come from the built-in Field.

| Member | Type | Description |
| --- | --- | --- |
| `description` | `React.ReactNode` | Secondary line under the label. |
| `disabled` | `boolean` |  |
| `group` | `string` | Group heading; options sharing it are listed together in first-seen order. |
| `label` * | `string` | Visible text; also what the input shows once selected and what the default filter matches. |
| `value` * | `string` | Submitted value and the key of the option. |

### `CommandItem`

*interface* — Modal command search (ADR-0010 §2): Base UI Dialog (focus trap, Escape, scroll lock, focus return to whatever was focused before opening) around an inline, always-open Base UI Autocomplete list. Focus stays in the input; ↑ / ↓ move the active option through `aria-activedescendant`, Enter runs it, Esc closes the dialog. The first match is always highlighted. Disabled commands stay visible with their reason and cannot run. Enter/exit motion follows Dialog (motion/react: backdrop fast, panel 280ms + 8px rise; opacity only under reduced motion).

| Member | Type | Description |
| --- | --- | --- |
| `description` | `string` |  |
| `disabledReason` | `string` | Shown under a disabled command, e.g. 「需要编辑权限」. |
| `disabled` | `boolean` |  |
| `group` | `string` | Group heading; commands sharing it are listed together in first-seen order. |
| `icon` | `React.ReactNode` | Decorative leading icon (hidden from assistive tech). |
| `id` * | `string` |  |
| `keywords` | `readonly string[]` | Extra search terms (synonyms, English names). |
| `label` * | `string` |  |
| `meta` | `React.ReactNode` | Secondary trailing text such as a path or 「3 分钟前」; part of the option's name. |
| `shortcut` | `string` | Visual shortcut hint such as "Ctrl E" (hidden from assistive tech, like MenuItem). Wire it yourself. |

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

### `DataTablePagination`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `labels` | `PaginationLabels` |  |
| `onPageChange` * | `(page: number) => void` |  |
| `pageSize` * | `number` |  |
| `page` * | `number` |  |
| `siblingCount` | `number` |  |
| `totalItems` * | `number` | Total rows across all pages; drives the page count and the range summary. |

### `FileRejection`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `file` * | `File` |  |
| `reason` * | `FileRejectionReason` |  |

### `LatestGuard`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `begin` * | `() => () => boolean` | Begin a new async run; the returned check is true until a newer run begins, `cancel()` or unmount. |
| `cancel` * | `() => void` | Invalidate every pending run (e.g. when the dialog that started it closes). |

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

### `MotionLifecycle`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `pauseReason` * | `MotionPauseReason \| null` | Why a requested loop is not running; `null` when running, idle or stopped. |
| `pause` * | `() => void` |  |
| `resume` * | `() => void` |  |
| `running` * | `boolean` | True only in `running`; drive the loop from this. |
| `start` * | `() => void` |  |
| `state` * | `MotionLifecycleState` |  |
| `stop` * | `() => void` |  |

### `MotionLifecycleOptions`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `active` | `boolean` | Controlled request. When set, it overrides `start()` / `stop()`. |
| `autoStart` | `boolean` | Start on mount (uncontrolled only). |
| `reduced` | `boolean` | Extra reduced-motion signal (e.g. an effect clock forcing reduce). OS / provider preference always applies. |
| `viewportRef` | `React.RefObject<Element \| null>` | Pause while this element is outside the viewport. |

### `MotionSpeedProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `speed` * | `number` | 0.25 = four times slower. Values ≤ 0 are ignored. |

### `PaginationLabels`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `compact` | `((page: number, pageCount: number) => string)` | Compact summary shown in narrow containers, e.g. "第 3 / 40 页". |
| `nav` | `string` |  |
| `next` | `string` |  |
| `page` | `((page: number) => string)` |  |
| `previous` | `string` |  |
| `status` | `((from: number, to: number, total: number) => string)` | Range summary when `totalItems` is known, e.g. "第 51–75 条，共 1000 条". |

### `RecordStatus`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `label` * | `React.ReactNode` | Visible text; colour never carries the status alone. |
| `tone` * | `StatusKind` |  |

### `RhineLocaleValue`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `locale` * | `string` |  |
| `messages` * | `RhineMessages` |  |

### `RhineMessages`

*interface* — Parameterised entries are functions. Functions with numeric arguments receive the provider's number formatter as their last argument; using it is up to the table (`zhCN` keeps the pre-M9.5 output, which prints raw digits).

| Member | Type | Description |
| --- | --- | --- |
| `alertDialog` * | `{ cancel: string; error: string; }` |  |
| `alert` * | `{ dismiss: string; }` |  |
| `breadcrumb` * | `{ nav: string; expand: (count: number, format: RhineNumberFormat) => string; }` |  |
| `combobox` * | `{ empty: string; loading: string; clear: string; openList: string; }` |  |
| `commandPalette` * | `{ title: string; inputLabel: string; placeholder: string; empty: string; hint: string; close: string; loading: string; }` |  |
| `dataTable` * | `{ empty: string; loading: string; error: string; retry: string; selectAll: string; deselectAll: string; selectRow: (label: string) => string; selection: (count: number, offPage: number, format: RhineNumberFormat) => string; }` |  |
| `dialog` * | `{ close: string; }` |  |
| `drawer` * | `{ close: string; }` |  |
| `field` * | `{ optional: string; }` |  |
| `fileDropZone` * | `{ prompt: string; browse: string; rejectedType: (fileName: string) => string; rejectedSize: (fileName: string, limit: string) => string; rejectedCount: (fileName: string, max: number, format: RhineNumberFormat) => string; accepted: (count: number, format: RhineNumberFormat) => string; }` |  |
| `metadataList` * | `{ missing: string; }` |  |
| `numberField` * | `{ decrement: string; increment: string; roleDescription: string; }` |  |
| `pagination` * | `{ nav: string; previous: string; next: string; page: (page: number, format: RhineNumberFormat) => string; compact: (page: number, pageCount: number, format: RhineNumberFormat) => string; status: (from: number, to: number, total: number, format: RhineNumberFormat) => string; }` |  |
| `progress` * | `{ indeterminate: string; meterValue: (value: string, state: string) => string; }` |  |
| `recordHeader` * | `{ trail: string; }` |  |
| `select` * | `{ placeholder: string; }` |  |
| `stat` * | `{ loading: string; empty: string; up: string; down: string; flat: string; }` |  |
| `tag` * | `{ remove: (name: string) => string; }` |  |
| `textarea` * | `{ count: (current: number, max: number, format: RhineNumberFormat) => string; }` |  |
| `timeline` * | `{ empty: string; }` |  |
| `toast` * | `{ close: string; region: string; }` |  |
| `tree` * | `{ loading: string; empty: string; retry: (name: string) => string; expand: (name: string) => string; collapse: (name: string) => string; }` |  |
| `workbench` * | `{ index: string; content: string; resize: string; width: (width: string) => string; }` |  |

### `RhineMessagesProviderProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `locale` | `string` | Number locale for this subtree; defaults to the outer provider's (or `zh-CN`). |
| `messages` | `RhineMessagesOverrides` | Partial table merged over the outer provider's (or `zhCN`). |

### `RhineMotion`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `get` * | `(name: RhineTransitionName) => Transition` | Returns the named preset, or an instant transition when motion is reduced. |
| `reduced` * | `boolean` | True when the OS preference or the nearest `<MotionConfig reducedMotion>` asks for reduced motion. |
| `resolve` * | `(kind: MotionPropertyKind, name: RhineTransitionName) => Transition` | Returns the named preset degraded for one property kind (ADR-0007): colour / opacity keep a short fade. |
| `speed` * | `number` | Review speed from the nearest `MotionSpeed` (1 by default). |

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

### `SliderMark`

*interface* — Value on a continuous or stepped scale, on Base UI Slider (ADR-0010 §2). Each thumb is a native `<input type="range">` (visually hidden inside the thumb), named by the visible `label` through `aria-labelledby`, so the value submits with the form under `name`.

| Member | Type | Description |
| --- | --- | --- |
| `label` | `React.ReactNode` | Visible tick label; also the spoken value when the thumb is on this mark. |
| `valueText` | `string` | Spoken text when `label` is not a string. |
| `value` * | `number` |  |

### `SortState`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `column` * | `string` |  |
| `direction` * | `SortDirection` |  |

### `StatDelta`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `label` | `React.ReactNode` | Context, e.g. "较上周". |
| `text` | `React.ReactNode` | Displayed change; defaults to the signed number (e.g. "+12", "−3"). |
| `tone` | `StatTone` |  |
| `value` * | `number` | Signed change. The sign drives the arrow; it says nothing about good or bad. |

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

### `ToastAction`

*interface* — A single follow-up action, e.g. 撤销 / 查看 / 重试.

| Member | Type | Description |
| --- | --- | --- |
| `keepOpen` | `boolean` | Keep the toast open after the action runs. By default it closes. |
| `label` * | `string` |  |
| `onClick` * | `() => void` |  |

### `ToastApi`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `dismiss` * | `(id?: string) => void` |  |
| `promise` * | `<Value>(promise: Promise<Value>, options: ToastPromiseOptions<Value>) => Promise<Value>` | One toast follows the promise: `loading` until it settles, then `success` or `error` in place. Returns a promise with the same outcome (it rejects when the input rejects). |
| `show` * | `(options: ToastOptions) => string` | Show a toast; returns its id. With an existing `id`, updates that toast instead. |
| `update` * | `(id: string, options: Partial<ToastOptions>) => void` | Replace the content of an existing toast (e.g. 处理中 → 已完成). |

### `ToastOptions`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `action` | `ToastAction` | The page must still offer the same result or an equivalent control; the toast is a shortcut. |
| `description` | `React.ReactNode` |  |
| `id` | `string` | Showing a toast with the id of one still on screen updates it in place (no stacking). |
| `onClose` | `(() => void)` |  |
| `priority` | `"low" \| "high"` | `high` interrupts screen readers (role=alert). Reserve for failures and time-critical notices. |
| `status` | `ToastStatus` |  |
| `timeout` | `number` | Auto-dismiss delay in ms. `0` keeps it until dismissed; use for errors that need action. Defaults to the provider's `toastTimeout`; with an `action`, to at least 10 s. |
| `title` * | `React.ReactNode` |  |

### `ToastPromiseOptions`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `error` * | `ToastPromiseStage<unknown>` | Status defaults to `danger`, priority to `high` and timeout to `0` (stays until dismissed). |
| `loading` * | `string \| ToastOptions` | Shown until the promise settles; never auto-dismisses. Status defaults to `info`. |
| `success` * | `ToastPromiseStage<Value>` | Status defaults to `success`. |

### `TreeNode`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `children` | `TreeNode[]` |  |
| `disabled` | `boolean` |  |
| `error` | `React.ReactNode` |  |
| `hasChildren` | `boolean` |  |
| `id` * | `string` |  |
| `label` * | `React.ReactNode` |  |
| `loading` | `boolean` |  |
| `textValue` | `string` |  |

## Types

### `AccordionHeadingLevel`

*type* — Stacked disclosure sections on Base UI Accordion (ADR-0010 §2). Each header is a real heading (`headingLevel`, default 3) wrapping a `<button>` with `aria-expanded` / `aria-controls`; the panel is a labelled region. Height animates through Base UI's `--accordion-panel-height` (CSS transition, interruptible); reduced motion zeroes the duration token, so it snaps.

```ts
type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6
```

### `AccordionItemProps`

*type*

### `AccordionProps`

*type*

### `AlertDialogAlternateAction`

*type*

```ts
type AlertDialogAlternateAction = { label: React.ReactNode; onClick?: () => void | Promise<unknown>; disabled?: boolean; }
```

### `AlertDialogProps`

*type*

### `AlertDialogTone`

*type* — Confirmation for destructive or irreversible actions (ADR-0006 §2) on Base UI AlertDialog: role="alertdialog", always modal, outside clicks never dismiss, Escape = cancel. Initial focus lands on the cancel button. `onConfirm` may return a Promise: while it is pending the confirm button shows `loading` (and keeps focus) and every way of cancelling is ignored; on resolve the dialog closes, on reject it stays open with `errorText` in a role="alert" message. Motion matches Dialog (backdrop fast, panel + 8px rise; opacity only when reduced).

```ts
type AlertDialogTone = 'danger' | 'default'
```

### `AlertLive`

*type*

```ts
type AlertLive = 'off' | 'polite' | 'assertive'
```

### `AlertProps`

*type*

### `AlertSize`

*type*

```ts
type AlertSize = 'sm' | 'md'
```

### `AlertTone`

*type* — In-page status message and explanatory note (ADR-0006 §5). Tone is always carried by an icon and text as well as colour.

```ts
type AlertTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'
```

### `ArchiveCardProps`

*type*

### `ArchiveIdentityProps`

*type*

```ts
type ArchiveIdentityProps = { /** Record ID; must match the `ArchiveCard` it continues from. */ id: string; /** Visible text; defaults to the ID. */ children?: React.ReactNode; className?: string; }
```

### `BreadcrumbProps`

*type*

### `ButtonProps`

*type*

### `ButtonSize`

*type*

```ts
type ButtonSize = 'sm' | 'md' | 'lg'
```

### `ButtonTone`

*type*

```ts
type ButtonTone = 'default' | 'danger'
```

### `ButtonVariant`

*type*

```ts
type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost'
```

### `CalloutProps`

*type*

```ts
type CalloutProps = BaseProps
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

### `CollapsibleProps`

*type* — Show / hide one region on Base UI Collapsible (ADR-0010 §2). The trigger is a real `<button>` with `aria-expanded` / `aria-controls`; the panel animates its height through Base UI's `--collapsible-panel-height` variable (CSS transition, interruptible: toggling mid-flight reverses from the current height). Reduced motion zeroes the duration token, so it snaps.

### `ComboboxFilter`

*type* — Return `true` when `option` matches the typed `query` (already trimmed).

```ts
type ComboboxFilter = (option: ComboboxOption, query: string) => boolean
```

### `ComboboxProps`

*type*

### `CommandFilter`

*type* — Local match predicate of CommandPalette.

```ts
type CommandFilter = (command: CommandItem, query: string) => boolean
```

### `CommandPaletteProps`

*type*

### `ContextMenuProps`

*type* — Context menu on Base UI ContextMenu (ADR-0010 §2). Opens at the pointer on right click, on long press (touch, 500 ms) and, from the keyboard, on Shift+F10 / the ContextMenu key while the target has focus (the browser fires `contextmenu` on the focused element). It reuses the Menu parts and styling: put `MenuItem`, `MenuCheckboxItem`, `MenuRadioGroup`, `MenuGroup` and `MenuSeparator` inside. Escape and outside click close it; focus returns to the target.

### `CountBadgeProps`

*type*

```ts
type CountBadgeProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> & { value: number; max?: number; live?: boolean; }
```

### `DataTableProps`

*type*

### `DataTableStatus`

*type* — Data table on a native <table>: real header cells, a caption, sortable columns that report `aria-sort`, optional row selection with named checkboxes, and an empty state. Wide tables scroll horizontally inside a focusable, labelled region instead of shrinking text. Sorting is controlled: the component reports the requested order and the caller supplies sorted rows, so it never reorders data it does not understand. Pagination works the same way (ADR-0005 §6): the table renders the pager and the caller supplies the current page's rows (`paginate()` helps for client-side data).

```ts
type DataTableStatus = 'ready' | 'loading' | 'error'
```

### `DialogCloseProps`

*type*

```ts
type DialogCloseProps = { /** The element that closes the dialog, typically `<Button variant="ghost">取消</Button>`. */ children: React.ReactElement<Record<string, unknown>>; }
```

### `DialogCloseReason`

*type* — Why the user is trying to close the dialog (ADR-0006 §3).

```ts
type DialogCloseReason = 'escape' | 'outside' | 'close-button' | 'trigger'
```

### `DialogProps`

*type*

### `DialogSize`

*type* — Modal dialog on Base UI Dialog (ADR-0001): focus trap, Escape, scroll lock, inert background and focus return are handled by Base UI; enter/exit run through motion/react (panel 280ms, 8px rise; opacity-only under reduced motion). Open state is always owned here so exit animations can finish before unmount, whether the caller controls `open` or not.

```ts
type DialogSize = 'sm' | 'md' | 'lg'
```

### `DrawerCloseProps`

*type*

```ts
type DrawerCloseProps = { /** The element that closes the drawer, typically `<Button variant="ghost">取消</Button>`. */ children: React.ReactElement<Record<string, unknown>>; }
```

### `DrawerCloseReason`

*type* — Why the user is trying to close the drawer: the `DialogCloseReason` values (ADR-0006 §3) plus `swipe` for the dismiss gesture.

```ts
type DrawerCloseReason = 'escape' | 'outside' | 'close-button' | 'trigger' | 'swipe'
```

### `DrawerProps`

*type*

### `DrawerSide`

*type* — Edge panel on Base UI Drawer (ADR-0006 §4): focus enters, Tab loops, Escape and backdrop clicks close, page scroll is locked, the background is inert and focus returns to the trigger — all from Base UI. Below 40rem the panel becomes a bottom sheet (swipe down to dismiss); wider it slides from the inline `side` (swipe toward that edge). CSS owns `transform` (Base UI writes the swipe offset into the same property), so enter / exit are CSS transitions on data-starting-style / data-ending-style: interruptible, and Base UI unmounts after they end.

```ts
type DrawerSide = 'start' | 'end'
```

### `DrawerSize`

*type*

```ts
type DrawerSize = 'sm' | 'md' | 'lg'
```

### `EmptyStateHeadingLevel`

*type*

```ts
type EmptyStateHeadingLevel = 2 | 3 | 4 | 5 | 6
```

### `EmptyStateKind`

*type* — Placeholder for a region with nothing to show (ADR-0006 §6). `kind` only picks the default decorative icon. The title is a heading when `headingLevel` is given, otherwise a paragraph (e.g. inside a table cell). No live role: the filter result count announces empty results.

```ts
type EmptyStateKind = 'empty' | 'no-results' | 'no-permission' | 'first-use'
```

### `EmptyStateProps`

*type*

### `EmptyStateSize`

*type*

```ts
type EmptyStateSize = 'sm' | 'md'
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

### `FileDropZoneProps`

*type*

### `FileRejectionReason`

*type* — File picker and drop target (ADR-0010 §2). The control is a real `<input type="file">`: it is visually hidden but stays focusable, and its visible `<label>` looks like a button, so Tab, Enter / Space and screen readers use the native picker. Dropping files on the area runs the same validation (`accept` like the native attribute, `maxSize`, `maxFiles`). Rejections are announced in a polite live region. No upload logic: `onFiles` receives the accepted files.

```ts
type FileRejectionReason = 'type' | 'size' | 'count'
```

### `FormProps`

*type*

```ts
type FormProps = Omit<BaseFormProps, 'className' | 'style' | 'render'> & { disabled?: boolean; className?: string; style?: React.CSSProperties; }
```

### `IconButtonProps`

*type*

### `IconButtonVariant`

*type*

```ts
type IconButtonVariant = 'secondary' | 'ghost' | 'primary'
```

### `IconName`

*type*

```ts
type IconName = (typeof iconNames)[number]
```

### `IconProps`

*type*

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

### `MeterProps`

*type*

### `MeterState`

*type* — Which native <meter> region a value falls in, relative to `optimum`.

```ts
type MeterState = 'optimum' | 'suboptimum' | 'critical'
```

### `MotionLifecycleState`

*type*

```ts
type MotionLifecycleState = 'idle' | 'running' | 'paused' | 'stopped'
```

### `MotionPauseReason`

*type*

```ts
type MotionPauseReason = 'manual' | 'hidden' | 'offscreen' | 'reduced'
```

### `MotionPresencePreset`

*type* — - `fade`: opacity only, `fast` — tooltips, inline status swaps. - `panel`: opacity + 8px rise, `panel` — detail layers, dialogs, sheets. - `rise`: opacity + 4px rise, `base` — list items, inline feedback.

```ts
type MotionPresencePreset = 'fade' | 'panel' | 'rise'
```

### `MotionPresenceProps`

*type*

### `MotionPropertyKind`

*type* — What a transition animates. Reduced motion degrades by kind (ADR-0007): - `color` / `opacity`: keep a short fade, never longer than `fast`; - `transform` / `layout`: jump straight to the target; - `loop`: stop (instant, no repeat).

```ts
type MotionPropertyKind = 'color' | 'opacity' | 'transform' | 'layout' | 'loop'
```

### `NavGroupProps`

*type*

```ts
type NavGroupProps = React.HTMLAttributes<HTMLElement> & { label: React.ReactNode; children: React.ReactNode; collapsed?: boolean; }
```

### `NavItemProps`

*type*

### `NavListProps`

*type*

```ts
type NavListProps = React.HTMLAttributes<HTMLElement> & { children: React.ReactNode; label?: string; }
```

### `NavRailProps`

*type*

```ts
type NavRailProps = React.HTMLAttributes<HTMLElement> & { children: React.ReactNode; collapsed?: boolean; }
```

### `NumberFieldProps`

*type* — Numeric input with stepper buttons on Base UI NumberField + Field (ADR-0010 §2). Label, description and error are wired like `Field` (aria-labelledby / aria-describedby / aria-invalid). The visible text input parses and formats with the provider locale; a hidden native input carries the raw number for form submission under `name`.

### `PaginationItem`

*type* — One slot in the page list: a page number or an ellipsis before / after the current window.

```ts
type PaginationItem = number | 'ellipsis-start' | 'ellipsis-end'
```

### `PaginationProps`

*type*

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

### `ProgressProps`

*type*

### `ProgressSize`

*type* — Progress vs Meter (ADR-0005 §2): - Progress: a task advancing over time to completion. `value={null}` = indeterminate. - Meter: a static measurement inside a known range; never "complete", never indeterminate. Both need a visible label; the value is announced as formatted text, not colour.

```ts
type ProgressSize = 'sm' | 'md'
```

### `ProgressTone`

*type*

```ts
type ProgressTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'
```

### `RadioGroupProps`

*type*

### `RadioProps`

*type*

### `RecordHeaderProps`

*type*

### `RecordTrailItem`

*type* — Same shape as a Breadcrumb item (ADR-0005 §4).

```ts
type RecordTrailItem = BreadcrumbItem
```

### `ResizeHandleProps`

*type*

### `RhineDensity`

*type*

```ts
type RhineDensity = 'comfortable' | 'compact'
```

### `RhineMessagesOverrides`

*type* — Override shape accepted by providers: any namespace, any subset of its keys.

```ts
type RhineMessagesOverrides = { [K in keyof RhineMessages]?: Partial<RhineMessages[K]>; }
```

### `RhineMotionGroupProps`

*type*

### `RhineMotionItemProps`

*type*

```ts
type RhineMotionItemProps = ElementProps & { as?: 'div' | 'li' | 'span'; children?: React.ReactNode; }
```

### `RhineMotionPreference`

*type* — `user` follows the OS setting; `reduce` forces reduced motion for this subtree.

```ts
type RhineMotionPreference = 'user' | 'reduce'
```

### `RhineNumberFormat`

*type* — Formats a number with the provider's `locale` (Intl.NumberFormat).

```ts
type RhineNumberFormat = (value: number) => string
```

### `RhineProviderProps`

*type*

### `RhineTheme`

*type*

```ts
type RhineTheme = 'light' | 'dark' | 'system'
```

### `RhineTransitionName`

*type* — Named preset keys (`instant` … `showcase`, plus `press`/`release`/`loop`).

```ts
type RhineTransitionName = keyof typeof transition
```

### `ScrollAreaOrientation`

*type* — Scroll container with an overlay scrollbar (Base UI scroll-area, ADR-0001). The viewport is the native scroller, so wheel, touch, trackpad, keyboard (↑ ↓ PageUp PageDown Home End Space once focused), find-in-page and `scrollTo` all keep working; the custom thumb only mirrors it and can be dragged. The viewport is a named `role="region"`; Base UI puts it in the tab order only while it actually overflows (axe `scrollable-region-focusable`), so a short list adds no tab stop. Under `forced-colors: active` the overlay is hidden and the native scrollbar comes back. Motion: the overlay fades in on hover / scroll / focus (CSS opacity, --rl-motion-fast; tokens are 0 under reduced motion).

```ts
type ScrollAreaOrientation = 'vertical' | 'both'
```

### `ScrollAreaProps`

*type*

### `ScrollReveal`

*type*

```ts
type ScrollReveal = 'always' | 'hover' | 'scroll'
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

### `SkeletonProps`

*type*

### `SkeletonShape`

*type* — Placeholder block for content that is still loading (ADR-0006 §7). Always `aria-hidden`: the container owns `aria-busy` and a visible or visually hidden 「正在加载」 text. Pulses on `--rl-motion-loop`; static under reduced motion.

```ts
type SkeletonShape = 'text' | 'block' | 'circle'
```

### `SliderChangeValue`

*type* — The value shape `onValueChange` reports: a number for single sliders, an array for ranges.

```ts
type SliderChangeValue = V extends number ? number : number[]
```

### `SliderProps`

*type*

### `SortDirection`

*type*

```ts
type SortDirection = 'ascending' | 'descending'
```

### `SpinnerProps`

*type*

```ts
type SpinnerProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'children' | 'role'> & { /** Maps to the icon-size tokens. */ size?: SpinnerSize; /** Spoken status text, e.g. 「正在加载」. Omit for a decorative spinner. */ label?: string; }
```

### `SpinnerSize`

*type* — Indeterminate activity indicator (ADR-0006 §7). With `label` it is a polite status (`role="status"` + visually hidden text); without, it is decorative and the surrounding control carries the busy state (e.g. Button `aria-busy`). Rotation runs on motion/react and stops under reduced motion (OS or RhineProvider), leaving a longer static arc.

```ts
type SpinnerSize = 'sm' | 'md' | 'lg'
```

### `SplitButtonProps`

*type* — A primary action with an attached menu of related actions ("导出 CSV ▾ → 导出 JSON / 导出 PDF"). Both halves are real `<button>`s inside a `role="group"` named by `label`, drawn in one frame. The main part is the public Button (loading keeps focus and announces busy); the toggle is an IconButton (name from `menuLabel`) that opens the public Menu (Base UI: menu / menuitem semantics, arrow keys, typeahead, Escape returns focus to the toggle). Enter / Space / ↓ on the toggle open the menu. While `loading` the toggle is `aria-disabled` and refuses to open (it keeps focus, so choosing a menu item that starts the busy state never drops focus to the page), and an open menu closes. `disabled` disables both halves natively. Motion: Button press + Menu CSS transition only.

### `StatProps`

*type*

### `StatTone`

*type* — Labelled figure with an optional change (ADR-0005 §5). A rise is not assumed to be good: the caller sets `delta.tone`. Missing values show "—" and are read as "无数据"; the component never substitutes 0.

```ts
type StatTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'
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

### `TagProps`

*type*

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

### `ToastPromiseStage`

*type* — A promise stage: a title, full options, or (for success / error) a function of the outcome.

```ts
type ToastPromiseStage = string | ToastOptions | ((value: Arg) => string | ToastOptions)
```

### `ToastProviderProps`

*type*

```ts
type ToastProviderProps = React.ComponentProps<typeof BaseToast.Provider>
```

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

### `TreeProps`

*type*

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

### `WorkbenchProps`

*type*

