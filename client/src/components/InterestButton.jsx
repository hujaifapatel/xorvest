import { useInterests } from '../lib/interests.jsx';

const Heart = ({ filled }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />
  </svg>
);

export default function InterestButton({ planSlug, planName, assessmentId, size = '', block = false }) {
  const { slugs, toggle, busy } = useInterests();
  const on = slugs.has(planSlug);
  return (
    <button
      type="button"
      className={`btn ${on ? 'interested' : 'accent'} ${size}${block ? ' block' : ''}`}
      aria-pressed={on}
      aria-label={on ? `Remove ${planName} from interested` : `I'm interested in ${planName}`}
      disabled={busy === planSlug}
      onClick={() => toggle(planSlug, assessmentId)}
    >
      <Heart filled={on} />
      {busy === planSlug ? 'Saving…' : on ? 'Interested' : 'I’m interested'}
    </button>
  );
}
