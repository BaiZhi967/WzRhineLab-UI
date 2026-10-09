import * as React from 'react';
import { cx } from '../utils/cx.js';
import type { StatusKind } from './StatusBadge.js';

/**
 * Chronological event log as an ordered list. Each event needs a real timestamp
 * (`dateTime` is machine-readable, `time` is the visible text); the component does
 * not sort, invent or reformat times — pass events in the order they should read.
 */

export interface TimelineEvent {
  id: string;
  title: React.ReactNode;
  /** ISO 8601 date or date-time, used for <time dateTime>. */
  dateTime: string;
  /** Visible time text; defaults to `dateTime`. */
  time?: React.ReactNode;
  description?: React.ReactNode;
  /** Optional status marker; the title must still say what happened. */
  tone?: StatusKind;
  /** Who or what recorded the event. */
  actor?: React.ReactNode;
}

export type TimelineProps = Omit<React.OlHTMLAttributes<HTMLOListElement>, 'children'> & {
  events: readonly TimelineEvent[];
  /** Shown when `events` is empty. */
  emptyText?: React.ReactNode;
  /** Newest-first lists set `reversed` so ordinal semantics match reading order. */
  reversed?: boolean;
};

export const Timeline = React.forwardRef<HTMLOListElement, TimelineProps>(function Timeline(
  { events, emptyText = '暂无记录', className, ...rest },
  ref,
) {
  if (events.length === 0) {
    return (
      <p className={cx('rl-timeline__empty', className)} data-slot="timeline">
        {emptyText}
      </p>
    );
  }
  return (
    <ol {...rest} ref={ref} className={cx('rl-timeline', className)} data-slot="timeline">
      {events.map((event) => (
        <li key={event.id} className="rl-timeline__event" data-tone={event.tone ?? 'neutral'}>
          <time className="rl-timeline__time" dateTime={event.dateTime}>
            {event.time ?? event.dateTime}
          </time>
          <span className="rl-timeline__marker" aria-hidden="true" />
          <div className="rl-timeline__body">
            <p className="rl-timeline__title">{event.title}</p>
            {event.description != null && <p className="rl-timeline__description">{event.description}</p>}
            {event.actor != null && <p className="rl-timeline__actor">{event.actor}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
});
