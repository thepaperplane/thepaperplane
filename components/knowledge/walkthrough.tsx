'use client';

import { useId, useState } from 'react';
import { KNOWLEDGE_SCENES } from '@/components/knowledge/scenes';
import { SequenceControls } from '@/components/site/slideshow';
import { useSequence } from '@/components/site/use-sequence';
import { SERVICE_ANATOMY } from '@/content/knowledge';
import { cn } from '@/lib/utils';

/**
 * Stepped process walkthrough.
 *
 * Replaces the stacked stage list, which asked the reader to parse five
 * paragraphs and a set of percentage bars at once. Here one stage occupies the
 * frame at a time, paired with a diagram drawn for that specific stage.
 *
 * Timing, autoplay and the pause control all come from `useSequence` — see
 * that file for why the clock lives in CSS and why it yields on first touch.
 */

const STEP_MS = 6500;

export function Walkthrough() {
  const [serviceIndex, setServiceIndex] = useState(0);
  const baseId = useId();

  const service = SERVICE_ANATOMY[serviceIndex];
  const steps = service.steps;

  const seq = useSequence(steps.length, STEP_MS);
  const { index: step, containerProps, onKeyDown, reset } = seq;

  const current = steps[Math.min(step, steps.length - 1)];
  const Scene = KNOWLEDGE_SCENES[current.diagram];

  return (
    <div {...containerProps}>
      {/* Service selector */}
      <div
        role="tablist"
        aria-label="Choose a service"
        className="scroll-lane no-scrollbar -mx-1 flex gap-2 px-1 pb-2"
      >
        {SERVICE_ANATOMY.map((s, i) => {
          const selected = i === serviceIndex;
          return (
            <button
              key={s.id}
              role="tab"
              type="button"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => reset(() => setServiceIndex(i))}
              className={cn(
                'shrink-0 rounded-[var(--radius-sm)] px-4 py-2.5 text-[length:var(--text-small)] transition-colors duration-300',
                selected
                  ? 'bg-accent text-accent-ink'
                  : 'text-ink-3 hover:text-ink ring-1 ring-[var(--hairline-strong)] ring-inset',
              )}
            >
              {s.service}
            </button>
          );
        })}
      </div>

      {/* Stage frame */}
      <div
        role="group"
        aria-roledescription="Stepped walkthrough"
        aria-describedby={`${baseId}-hint`}
        className="mt-8 grid gap-px border-t md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
        onKeyDown={onKeyDown}
      >
        {/* Copy */}
        <div className="pt-10 md:pr-10 lg:pr-16">
          <div className="flex items-center gap-4">
            <span className="numeral text-[length:var(--text-title-2)]">
              {String(step + 1).padStart(2, '0')}
            </span>
            <span className="text-ink-3 text-[length:var(--text-micro)] tracking-[0.14em] uppercase">
              Stage {step + 1} of {steps.length}
            </span>
          </div>

          <div
            key={`${serviceIndex}-${step}`}
            className="animate-[pp-step_0.6s_var(--ease-out-editorial)_both]"
          >
            <h3 className="mt-6 text-[length:var(--text-title-1)]">{current.label}</h3>
            <p className="text-ink-2 mt-5 max-w-[52ch] text-[length:var(--text-body)] leading-[1.7]">
              {current.detail}
            </p>

            <div className="border-caution/30 mt-8 border-l-2 pl-5">
              <p className="text-caution text-[length:var(--text-micro)] tracking-[0.12em] uppercase">
                If this is skipped
              </p>
              <p className="text-ink-2 mt-2 max-w-[48ch] text-[length:var(--text-small)] leading-relaxed">
                {current.risk}
              </p>
            </div>

            <p className="text-ink-3 mt-8 text-[length:var(--text-caption)]">
              <span className="text-ink font-medium">{current.share}%</span> of the total work — a
              share of effort, not a duration.
            </p>
          </div>
        </div>

        {/* Diagram */}
        <div className="glass flex items-center justify-center p-3 sm:p-5 lg:p-6">
          <div className="w-full max-w-[30rem]">
            <Scene key={`${serviceIndex}-${step}`} />
          </div>
        </div>
      </div>

      <SequenceControls seq={seq} stages={steps} className="mt-8" />

      <span className="sr-only" aria-live="polite">
        {`${service.service}, stage ${step + 1} of ${steps.length}: ${current.label}`}
      </span>
      <span id={`${baseId}-hint`} className="sr-only">
        Use the left and right arrow keys to move between stages.
      </span>
    </div>
  );
}
