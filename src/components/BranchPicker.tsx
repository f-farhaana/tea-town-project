import { branches, type Branch } from '../config/site'

/** Compact branch selector used by WhatsApp, review and contact flows. */
export function BranchPicker({ onPick, label, dark = true }: { onPick: (b: Branch) => void; label: string; dark?: boolean }) {
  return (
    <fieldset>
      <legend className={`mb-3 text-sm font-bold ${dark ? 'text-cream' : 'text-ink'}`}>{label}</legend>
      <div className="grid gap-2">
        {branches.map((b) => (
          <button key={b.id} type="button" onClick={() => onPick(b)} className={`flex items-center justify-between border px-4 py-3 text-left text-sm font-extrabold uppercase tracking-[0.12em] transition ${dark ? 'border-cream/20 hover:border-orange hover:bg-orange hover:text-ink' : 'border-ink/20 hover:bg-ink hover:text-cream'}`}>
            {b.shortName}<span aria-hidden>→</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
