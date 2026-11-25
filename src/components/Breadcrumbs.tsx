import { Link } from 'react-router-dom'
export function Breadcrumbs({ trail }: { trail: { name: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="eyebrow text-cream/60">
      <ol className="flex flex-wrap gap-2">
        {trail.map((t, i) => (
          <li key={t.name} className="flex gap-2">
            {t.to ? <Link to={t.to} className="hover:text-orange">{t.name}</Link> : <span aria-current="page" className="text-orange">{t.name}</span>}
            {i < trail.length - 1 && <span aria-hidden>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
