'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Button, IconButton, Popover, Radio, RadioGroup, Spinner, useRhineMotion } from '@wzrhine/react';
import type { ModelEffort, ModelOptionView, ModelProviderView } from '@wzrhine/agent-core';
import { AgentIcon } from '../../primitives/icons.js';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';

export interface ModelPickerProps {
  providers: readonly ModelProviderView[];
  /** Selected model id (controlled). */
  selectedModel?: string | null;
  onModelChange?: (modelId: string, model: ModelOptionView) => void;
  /** Selected effort (controlled); must be one of the model's `efforts`. */
  effort?: ModelEffort | null;
  onEffortChange?: (effort: ModelEffort) => void;
  onEffortReset?: () => void;
  effortState?: 'unset' | 'invalid' | 'default';
  loading?: boolean;
  /** Error text for the model list (`true` → default copy). */
  error?: React.ReactNode;
  disabled?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Initial layer when the popover opens. */
  defaultLayer?: 'effort' | 'models';
  side?: 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

function findModel(providers: readonly ModelProviderView[], id: string | null | undefined): ModelOptionView | undefined {
  if (!id) return undefined;
  for (const provider of providers) {
    const hit = provider.models.find((m) => m.id === id);
    if (hit) return hit;
  }
  return undefined;
}

/**
 * Model and reasoning-effort picker (atlas 19). A trigger button (model label + effort, truncated)
 * opens a Popover with two layers:
 * - effort layer: current model with a 切换模型 drill button and a RadioGroup of the model's
 *   efforts (arrow keys move and select);
 * - model layer: providers as labelled groups (a disabled provider shows its reason), model
 *   buttons with capability tags; unavailable models are `aria-disabled` with the reason as
 *   their description; the selected one has `aria-current` and a check. ↑ / ↓ move between models.
 *
 * Selection is controlled: the picker emits `onModelChange` / `onEffortChange` and the host
 * updates `selectedModel` / `effort`. It never touches the composer draft. Focus moves to the
 * first control of the new layer on drill / back and returns to the trigger on close.
 * Motion: layer drill is motion/react `x` (single axis) + opacity with the `panel` preset;
 * reduced → instant. The popover itself uses the Popover CSS transition.
 */
export function ModelPicker({
  providers,
  selectedModel,
  onModelChange,
  effort,
  onEffortChange,
  onEffortReset,
  effortState,
  loading = false,
  error,
  disabled = false,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  defaultLayer = 'effort',
  side = 'top',
  align = 'start',
  className,
}: ModelPickerProps) {
  const messages = useAgentMessages().composer;
  const { reduced, resolve } = useRhineMotion();
  const [innerOpen, setInnerOpen] = React.useState(defaultOpen);
  const open = openProp ?? innerOpen;
  const [layer, setLayer] = React.useState<'effort' | 'models'>(defaultLayer);
  const [direction, setDirection] = React.useState(0);
  const switchRef = React.useRef<HTMLButtonElement>(null);
  const backRef = React.useRef<HTMLButtonElement>(null);
  const moved = React.useRef(false);
  const model = findModel(providers, selectedModel);
  const efforts = model?.efforts ?? [];
  const invalidEffort = effortState === 'invalid' || (effort != null && efforts.length > 0 && !efforts.includes(effort));
  const effortLabel = !invalidEffort && effort && efforts.includes(effort) ? messages.effort[effort] : undefined;
  const modelLabel = model?.label ?? messages.modelPlaceholder;

  const setOpen = (next: boolean) => {
    if (next) {
      setLayer(defaultLayer);
      setDirection(0);
    }
    if (openProp === undefined) setInnerOpen(next);
    onOpenChange?.(next);
  };

  const go = (next: 'effort' | 'models') => {
    moved.current = true;
    setDirection(next === 'models' ? 1 : -1);
    setLayer(next);
  };

  // Focus follows the layer (not on first open: Popover focuses the first control itself).
  React.useLayoutEffect(() => {
    if (!open || !moved.current) return;
    moved.current = false;
    (layer === 'models' ? backRef : switchRef).current?.focus();
  }, [layer, open]);

  const choose = (candidate: ModelOptionView, provider: ModelProviderView) => {
    if (candidate.disabled || provider.disabled) return;
    if (candidate.id !== selectedModel) onModelChange?.(candidate.id, candidate);
    go('effort');
  };

  const moveFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Home' && event.key !== 'End') return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('.rl-agent-model__option'));
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : Math.max(0, Math.min(items.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)));
    event.preventDefault();
    items[next]?.focus();
  };

  const offset = reduced || direction === 0 ? 0 : direction * 16;
  const transition = { x: resolve('transform', 'panel'), opacity: resolve('opacity', 'panel') };

  const effortLayer = (
    <div className="rl-agent-model__layer" data-layer="effort">
      <div className="rl-agent-model__current">
        <button
          ref={switchRef}
          type="button"
          className="rl-agent-model__switch"
          onClick={() => go('models')}
        >
          <AgentIcon name="model" />
          <span className="rl-agent-model__name">{modelLabel}</span>
          <span className="rl-agent-model__switch-hint">{messages.switchModel}</span>
          <AgentIcon name="chevron-right" />
        </button>
      </div>
      {model && efforts.length > 0 ? (
        <>
          {invalidEffort && <div className="rl-agent-model__invalid" role="alert"><span>{messages.effortInvalid}</span>{onEffortReset && <Button size="sm" variant="secondary" onClick={onEffortReset}>{messages.resetEffort}</Button>}</div>}
        <RadioGroup
          label={messages.effortHeading}
          className="rl-agent-model__efforts"
          value={effortLabel ? effort! : ''}
          onValueChange={(next) => {
            if (typeof next === 'string' && (efforts as string[]).includes(next)) onEffortChange?.(next as ModelEffort);
          }}
          readOnly={!onEffortChange}
          description={messages.effortNote}
          orientation="vertical"
        >
          {efforts.map((value) => (
            <Radio key={value} value={value} label={messages.effort[value]} />
          ))}
        </RadioGroup>
        </>
      ) : (
        <p className="rl-agent-model__note">{model ? messages.effortNone : messages.modelPlaceholder}</p>
      )}
    </div>
  );

  const modelLayer = (
    <div className="rl-agent-model__layer" data-layer="models">
      <div className="rl-agent-model__layer-header">
        <IconButton ref={backRef} size="sm" label={messages.back} icon={<AgentIcon name="arrow-left" />} onClick={() => go('effort')} />
        <span className="rl-agent-model__eyebrow">{messages.modelHeading}</span>
      </div>
      {loading ? (
        <p className="rl-agent-model__note" role="status">
          <Spinner size="sm" />
          {messages.modelsLoading}
        </p>
      ) : error != null && error !== false ? (
        <p className="rl-agent-model__note" data-tone="danger" role="alert">
          <AgentIcon name="warning" />
          {error === true ? messages.modelsError : error}
        </p>
      ) : providers.every((p) => p.models.length === 0) ? (
        <p className="rl-agent-model__note">{messages.modelsEmpty}</p>
      ) : (
        <div className="rl-agent-model__list" onKeyDown={moveFocus}>
          {providers.map((provider) => (
            <ProviderGroup key={provider.id} provider={provider} selectedModel={selectedModel} onChoose={choose} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      side={side}
      align={align}
      size="md"
      aria-label={messages.modelPickerLabel}
      className={cx('rl-agent-model', className)}
      trigger={
        <Button
          variant="ghost"
          size="sm"
          className="rl-agent-picker-trigger"
          disabled={disabled}
          aria-label={messages.modelTriggerLabel(modelLabel, effortLabel)}
          iconEnd={<AgentIcon name="chevron-down" />}
        >
          <span className="rl-agent-picker-trigger__text">{modelLabel}</span>
          {effortLabel && <span className="rl-agent-picker-trigger__meta">{effortLabel}</span>}
        </Button>
      }
    >
      <motion.div
        key={layer}
        className="rl-agent-model__viewport"
        initial={offset === 0 ? false : { opacity: 0, x: offset }}
        animate={{ opacity: 1, x: 0 }}
        transition={transition}
      >
        {layer === 'effort' ? effortLayer : modelLayer}
      </motion.div>
    </Popover>
  );
}

function ProviderGroup({
  provider,
  selectedModel,
  onChoose,
}: {
  provider: ModelProviderView;
  selectedModel: string | null | undefined;
  onChoose: (model: ModelOptionView, provider: ModelProviderView) => void;
}) {
  const messages = useAgentMessages().composer;
  const headingId = React.useId();
  const reasonId = React.useId();
  if (provider.models.length === 0) return null;
  return (
    <section className="rl-agent-model__group" aria-labelledby={headingId} data-disabled={provider.disabled || undefined}>
      <h3 id={headingId} className="rl-agent-model__group-label">
        {provider.label}
      </h3>
      {provider.disabled && provider.unavailableReason && (
        <p id={reasonId} className="rl-agent-model__reason">
          {messages.optionUnavailable(provider.unavailableReason)}
        </p>
      )}
      <ul className="rl-agent-model__options">
        {provider.models.map((option) => (
          <ModelRow key={option.id} option={option} provider={provider} providerReasonId={provider.disabled && provider.unavailableReason ? reasonId : undefined} selected={option.id === selectedModel} onChoose={onChoose} />
        ))}
      </ul>
    </section>
  );
}

function ModelRow({
  option,
  provider,
  providerReasonId,
  selected,
  onChoose,
}: {
  option: ModelOptionView;
  provider: ModelProviderView;
  providerReasonId: string | undefined;
  selected: boolean;
  onChoose: (model: ModelOptionView, provider: ModelProviderView) => void;
}) {
  const messages = useAgentMessages().composer;
  const descId = React.useId();
  const unavailable = Boolean(option.disabled || provider.disabled);
  const reason = option.disabled ? messages.optionUnavailable(option.unavailableReason) : undefined;
  return (
    <li>
      <button
        type="button"
        className="rl-agent-model__option"
        aria-current={selected || undefined}
        aria-disabled={unavailable || undefined}
        aria-describedby={cx(descId, providerReasonId) || undefined}
        data-selected={selected || undefined}
        onClick={() => onChoose(option, provider)}
      >
        <span className="rl-agent-model__option-body">
          <span className="rl-agent-model__name" title={option.label}>
            {option.label}
          </span>
          <span id={descId} className="rl-agent-model__option-meta">
            {option.capabilities && option.capabilities.length > 0 && (
              <span className="rl-agent-model__caps">
                {option.capabilities.map((cap, i) => (
                  <React.Fragment key={cap}>
                    {/* Spoken separator: tags otherwise run together in the description. */}
                    {i > 0 && <span className="rl-agent-sr">, </span>}
                    <span className="rl-agent-model__cap">{messages.capability[cap]}</span>
                  </React.Fragment>
                ))}
              </span>
            )}
            {option.description && <span className="rl-agent-model__description">{option.description}</span>}
            {reason && <span className="rl-agent-model__reason">{reason}</span>}
          </span>
        </span>
        {selected && <AgentIcon name="check" className="rl-agent-model__check" />}
      </button>
    </li>
  );
}
