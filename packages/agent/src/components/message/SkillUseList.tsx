'use client';

import * as React from 'react';
import type { SkillUseView } from '@wzrhine/agent-core';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';

/**
 * SkillUseList: the skills that were actually loaded for a turn (not merely requested), as a
 * compact meta row: "已加载技能：name · source · 手动选择 / 模型加载 · digest". The digest is cut to
 * its first 8 characters in mono (the full value is the `title`), enough to tell versions apart.
 *
 * Semantics: a labelled `<ul>` (`aria-labelledby` → the visible label), one `<li>` per skill;
 * separators are `aria-hidden`. Static, no motion. Renders nothing for an empty list.
 */
export type SkillUseListProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  skills: SkillUseView[];
  /** Visible label; defaults to the copy table. */
  label?: React.ReactNode;
};

export const DIGEST_LENGTH = 8;

function Sep() {
  return (
    <span className="rl-agent-skills__sep" aria-hidden="true">
      {' · '}
    </span>
  );
}

export const SkillUseList = React.forwardRef<HTMLDivElement, SkillUseListProps>(function SkillUseList({ skills, label, className, ...rest }, ref) {
  const t = useAgentMessages().message;
  const labelId = React.useId();
  if (skills.length === 0) return null;
  return (
    <div {...rest} ref={ref} className={cx('rl-agent-skills', className)}>
      <span className="rl-agent-skills__label" id={labelId}>
        {label ?? t.skillsLabel}
      </span>
      <ul className="rl-agent-skills__list" aria-labelledby={labelId}>
        {skills.map((skill) => {
          const digest = skill.digest?.trim() ? skill.digest.trim() : undefined;
          return (
            <li key={`${skill.id}:${skill.method}`} className="rl-agent-skills__item" data-method={skill.method}>
              <span className="rl-agent-skills__name">{skill.name}</span>
              {skill.source && (
                <>
                  <Sep />
                  <span className="rl-agent-skills__source">{skill.source}</span>
                </>
              )}
              <Sep />
              <span className="rl-agent-skills__method">{t.skillMethod[skill.method]}</span>
              {digest && (
                <>
                  <Sep />
                  <span className="rl-agent-skills__digest" title={digest}>
                    <span className="rl-agent-sr">{t.skillDigest} </span>
                    {digest.slice(0, DIGEST_LENGTH)}
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
});
