import type { AgentTone, ConversationView, StatusGlyphName } from '@wzrhine/agent-core';
import { effectivePhase, runPhaseMeta, runStatusMeta } from '@wzrhine/agent-core';
import type { AgentStatusMessages } from '../../provider/messages/status.js';
import type { AgentShellMessages } from '../../provider/messages/shell.js';

/** What a conversation row shows as its status: glyph + tone + label, or nothing. */
export interface RowStatus {
  glyph: StatusGlyphName;
  tone: AgentTone;
  label: string;
  /** Ongoing activity: the glyph breathes (lifecycle-gated). */
  active: boolean;
  kind: 'attention' | 'run';
}

const attentionGlyph: Record<NonNullable<ConversationView['attention']>, { glyph: StatusGlyphName; tone: AgentTone }> = {
  approval: { glyph: 'approval', tone: 'warning' },
  question: { glyph: 'waiting-user', tone: 'warning' },
  children: { glyph: 'children', tone: 'info' },
  error: { glyph: 'failed', tone: 'danger' },
};

/**
 * Attention (needs the user) wins over the run status. Settled, uneventful runs (`idle`,
 * `completed`, `cancelled`) show no glyph: the list would otherwise be a column of check marks.
 * `failed` / `interrupted` stay visible. No run status = nothing (unknown is never shown as success).
 */
export function conversationStatus(item: ConversationView, status: AgentStatusMessages, shell: AgentShellMessages): RowStatus | null {
  if (item.attention) {
    const meta = attentionGlyph[item.attention];
    return { ...meta, label: shell.attention[item.attention], active: false, kind: 'attention' };
  }
  const run = item.runStatus;
  if (!run || run === 'idle' || run === 'completed' || run === 'cancelled') return null;
  const phase = effectivePhase(run, item.runPhase);
  const runMeta = runStatusMeta[run];
  if (phase && runMeta.active) {
    const meta = runPhaseMeta[phase];
    return { glyph: meta.glyph, tone: meta.tone, label: status.phase[phase], active: meta.active, kind: 'run' };
  }
  return { glyph: runMeta.glyph, tone: runMeta.tone, label: status.run[run], active: runMeta.active, kind: 'run' };
}

/** Same calendar day in local time. */
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
