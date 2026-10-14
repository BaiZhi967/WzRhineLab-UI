import * as React from 'react';

interface PageHeaderProps {
  index: string;
  section: string;
  title: string;
  children?: React.ReactNode;
  aside?: React.ReactNode;
}

export function PageHeader({ index, section, title, children, aside }: PageHeaderProps) {
  return (
    <header className="sc-page-header">
      <div>
        <p className="sc-eyebrow">
          <span className="sc-eyebrow__index">{index}</span>
          <span aria-hidden="true">/</span>
          {section}
        </p>
        <h1 className="sc-page-title" tabIndex={-1}>
          {title}
        </h1>
        {children && <div className="sc-page-lede">{children}</div>}
      </div>
      {aside && <div className="sc-page-aside">{aside}</div>}
    </header>
  );
}

interface SpecimenProps {
  id: string;
  index: string;
  title: string;
  description?: React.ReactNode;
  /** One-line technical footnote: timing, tokens, constraints. */
  note?: React.ReactNode;
  span?: 'full' | 'half' | 'third' | 'two-thirds';
  /** `start`: don't stretch to the row's tallest card (for rows of unrelated short demos). */
  align?: 'stretch' | 'start';
  /** Center the demo content in the card body (rows of standalone controls). */
  center?: boolean;
  children: React.ReactNode;
}

/** Labelled showcase panel modelled on the concept-board specimen cards: index, title, body, technical note. */
export function Specimen({ id, index, title, description, note, span = 'full', align = 'stretch', center, children }: SpecimenProps) {
  const headingId = `${id}-title`;
  return (
    <section className="sc-specimen" data-span={span} data-align={align} data-center={center || undefined} aria-labelledby={headingId}>
      <header className="sc-specimen__header">
        <h2 id={headingId} className="sc-specimen__title">
          {title}
        </h2>
        <span className="sc-specimen__index" aria-hidden="true">
          {index}
        </span>
      </header>
      {description && <p className="sc-specimen__description">{description}</p>}
      <div className="sc-specimen__body">{children}</div>
      {note && <p className="sc-specimen__note">{note}</p>}
    </section>
  );
}

export function SpecimenGrid({ children }: { children: React.ReactNode }) {
  return <div className="sc-grid">{children}</div>;
}

export function SectionRule({ index, label, meta }: { index: string; label: string; meta?: string }) {
  return (
    <div className="sc-rule">
      <span>
        <span className="sc-rule__index">{index}</span> / {label}
      </span>
      {meta && <span className="sc-rule__meta">{meta}</span>}
    </div>
  );
}

export function CodeBlock({ code, label = '示例代码' }: { code: string; label?: string }) {
  return (
    <figure className="sc-code">
      <figcaption className="sc-code__caption">{label}</figcaption>
      <pre tabIndex={0} aria-label={label}>
        <code>{code}</code>
      </pre>
    </figure>
  );
}
