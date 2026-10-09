'use client';

import { useActionState } from 'react';
import { Loader2 } from 'lucide-react';
import { testAssistant, type AssistantTest } from '@/app/admin/_actions/assistant';

export function AssistantTestButton() {
  const [state, run, pending] = useActionState<AssistantTest, FormData>(testAssistant, null);
  return (
    <form action={run} className="grid gap-3">
      <div>
        <button
          type="submit"
          disabled={pending}
          className="bg-accent text-accent-ink hover:bg-accent-hover inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] px-4 text-[0.875rem] font-semibold disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {pending ? 'Testing…' : 'Test the assistant'}
        </button>
      </div>
      {state ? (
        <p
          role="status"
          className={`text-[0.875rem] leading-relaxed break-words ${state.ok ? 'text-positive' : 'text-critical'}`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
