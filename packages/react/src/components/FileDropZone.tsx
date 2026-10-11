'use client';

import * as React from 'react';
import { useRhineLocale } from '../provider/messages.js';
import type { RhineNumberFormat } from '../provider/messages.js';
import { cx } from '../utils/cx.js';

/**
 * File picker and drop target (ADR-0010 §2). The control is a real `<input type="file">`: it is
 * visually hidden but stays focusable, and its visible `<label>` looks like a button, so Tab,
 * Enter / Space and screen readers use the native picker. Dropping files on the area runs the
 * same validation (`accept` like the native attribute, `maxSize`, `maxFiles`). Rejections are
 * announced in a polite live region. No upload logic: `onFiles` receives the accepted files.
 *
 *   <FileDropZone label="样本图像" accept="image/*" maxSize={1024 * 1024} onFiles={add} />
 */

export type FileRejectionReason = 'type' | 'size' | 'count';

export interface FileRejection {
  file: File;
  reason: FileRejectionReason;
}

export type FileDropZoneProps = {
  /** Visible label above the drop area. */
  label: React.ReactNode;
  description?: React.ReactNode;
  /** Same syntax as the native attribute: `.png,.jpg`, `image/*`, `application/pdf`. */
  accept?: string;
  multiple?: boolean;
  /** Maximum size of one file, in bytes. */
  maxSize?: number;
  /** Maximum number of files accepted from one pick or drop (default: 1 unless `multiple`). */
  maxFiles?: number;
  disabled?: boolean;
  /** Form field name of the native input. The input is cleared after each pick, so submit files yourself. */
  name?: string;
  /** Accepted files of one pick or drop (not called when every file was rejected). */
  onFiles?: (files: File[]) => void;
  /** Rejected files of one pick or drop, with the first reason found (type, then size, then count). */
  onReject?: (rejections: FileRejection[]) => void;
  /** Custom prompt inside the drop area (replaces the default text, not the button). */
  children?: React.ReactNode;
  /** Text of the browse button (default from messages). */
  browseLabel?: React.ReactNode;
  /** Formats `maxSize` for rejection messages (default: B / KB / MB in the provider locale). */
  formatSize?: (bytes: number) => string;
  /** Visual and semantic invalid state, e.g. a required attachment is missing. */
  invalid?: boolean;
  /** Error text shown under the area while `invalid`. */
  error?: React.ReactNode;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
};

/** Whether `file` matches a native-style `accept` list (extensions, exact MIME types, `type/*`). */
export function matchesAccept(file: Pick<File, 'name' | 'type'>, accept: string | undefined): boolean {
  if (!accept || accept.trim() === '') return true;
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  return accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)
    .some((token) => {
      if (token.startsWith('.')) return name.endsWith(token);
      if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
      return type === token;
    });
}

/** Splits files into accepted and rejected ones; first failing rule wins (type → size → count). */
export function validateFiles(
  files: readonly File[],
  { accept, maxSize, maxFiles }: { accept?: string; maxSize?: number; maxFiles?: number },
): { accepted: File[]; rejected: FileRejection[] } {
  const accepted: File[] = [];
  const rejected: FileRejection[] = [];
  for (const file of files) {
    if (!matchesAccept(file, accept)) rejected.push({ file, reason: 'type' });
    else if (maxSize !== undefined && file.size > maxSize) rejected.push({ file, reason: 'size' });
    else if (maxFiles !== undefined && accepted.length >= maxFiles) rejected.push({ file, reason: 'count' });
    else accepted.push(file);
  }
  return { accepted, rejected };
}

function defaultFormatSize(bytes: number, format: RhineNumberFormat) {
  if (bytes >= 1024 * 1024) return `${format(Math.round((bytes / (1024 * 1024)) * 10) / 10)} MB`;
  if (bytes >= 1024) return `${format(Math.round((bytes / 1024) * 10) / 10)} KB`;
  return `${format(bytes)} B`;
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" focusable="false">
      <path d="M12 15V4m0 0-4 4m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 14v4.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V14" strokeLinecap="round" />
    </svg>
  );
}

const hasFiles = (event: React.DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes('Files');

export const FileDropZone = React.forwardRef<HTMLInputElement, FileDropZoneProps>(function FileDropZone(
  {
    label,
    description,
    accept,
    multiple = false,
    maxSize,
    maxFiles,
    disabled = false,
    name,
    onFiles,
    onReject,
    children,
    browseLabel,
    formatSize,
    invalid = false,
    error,
    id,
    className,
    style,
  },
  ref,
) {
  const { messages, formatNumber } = useRhineLocale();
  const copy = messages.fileDropZone;
  const autoId = React.useId();
  const inputId = id ?? `${autoId}-input`;
  const labelId = `${autoId}-label`;
  const descriptionId = `${autoId}-description`;
  const errorId = `${autoId}-error`;
  const [dragOver, setDragOver] = React.useState(false);
  const [announcement, setAnnouncement] = React.useState('');
  // Nested children fire dragenter / dragleave; count them so the highlight doesn't flicker.
  const depth = React.useRef(0);
  const limit = maxFiles ?? (multiple ? undefined : 1);

  const describeRejection = (rejection: FileRejection) => {
    const fileName = rejection.file.name;
    if (rejection.reason === 'type') return copy.rejectedType(fileName);
    if (rejection.reason === 'size') {
      const size = maxSize ?? 0;
      return copy.rejectedSize(fileName, formatSize ? formatSize(size) : defaultFormatSize(size, formatNumber));
    }
    return copy.rejectedCount(fileName, limit ?? 0, formatNumber);
  };

  const handleFiles = (list: FileList | readonly File[] | null | undefined) => {
    const files = list ? Array.from(list) : [];
    if (files.length === 0) return;
    const { accepted, rejected } = validateFiles(files, { accept, maxSize, maxFiles: limit });
    const lines = [...(accepted.length > 0 ? [copy.accepted(accepted.length, formatNumber)] : []), ...rejected.map(describeRejection)];
    setAnnouncement(lines.join('\n'));
    if (accepted.length > 0) onFiles?.(accepted);
    if (rejected.length > 0) onReject?.(rejected);
  };

  const onDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (disabled || !hasFiles(event)) return;
    event.preventDefault();
    depth.current += 1;
    setDragOver(true);
  };
  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (disabled || !hasFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };
  const onDragLeave = () => {
    if (disabled) return;
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setDragOver(false);
  };
  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    depth.current = 0;
    setDragOver(false);
    if (disabled) return;
    event.preventDefault();
    handleFiles(event.dataTransfer?.files);
  };

  const describedBy = [description != null ? descriptionId : null, invalid && error != null ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div
      className={cx('rl-file-drop', className)}
      style={style}
      data-slot="file-drop-zone"
      data-disabled={disabled || undefined}
      data-invalid={invalid || undefined}
    >
      <span id={labelId} className="rl-file-drop__label">
        {label}
      </span>
      {description != null && (
        <p id={descriptionId} className="rl-file-drop__description">
          {description}
        </p>
      )}
      {/* Drop target only; every keyboard and AT path goes through the native input below. */}
      <div
        className="rl-file-drop__area"
        data-drag-over={dragOver || undefined}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <span className="rl-file-drop__icon" aria-hidden="true">
          <UploadIcon />
        </span>
        <span className="rl-file-drop__prompt">{children ?? copy.prompt}</span>
        <input
          ref={ref}
          id={inputId}
          type="file"
          className="rl-file-drop__input"
          name={name}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          aria-labelledby={`${labelId} ${inputId}-browse`}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          onChange={(event) => {
            handleFiles(event.currentTarget.files);
            // Allow picking the same file again.
            event.currentTarget.value = '';
          }}
        />
        <label id={`${inputId}-browse`} htmlFor={inputId} className="rl-file-drop__browse">
          {browseLabel ?? copy.browse}
        </label>
      </div>
      {invalid && error != null && (
        <p id={errorId} className="rl-file-drop__error">
          {error}
        </p>
      )}
      <p className="rl-file-drop__status" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
});
