// Small shared UI pieces: icons, member avatar, bank logo tile, "I'm interested" button.
import { useState } from 'react';
import { useSession } from '../lib/session.jsx';
import { memberLabel } from '../lib/format.js';

const Svg = ({ d, size = 20, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
export const Check = () => <Svg size={14} d="M5 12.5l4.5 4.5L19 7.5" />;
export const Close = () => <Svg size={18} d="M6 6l12 12M18 6L6 18" />;
export const Arrow = () => <Svg size={18} d="M5 12h14M13 6l6 6-6 6" />;
export const Shield = () => <Svg d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z M9 12l2 2 4-4" />;
export const Hospital = () => <Svg d="M4 3h16v18H4z M12 7v6 M9 10h6 M9 21v-4h6v4" />;
export const Clock = () => <Svg d="M12 3a9 9 0 110 18 9 9 0 010-18z M12 7v5l3 2" />;
export const Wallet = () => <Svg d="M3 6h18v14H3z M3 10h18 M16 15h2" />;
const Heart = ({ filled }) => <Svg size={17} fill={filled ? 'currentColor' : 'none'} d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />;

export const Logo = () => (
  <span className="brand-mark" aria-hidden="true">
    <svg width="18" height="18" viewBox="0 0 24 24" stroke="#fff" strokeWidth="3.2" strokeLinecap="round"><path d="M12 4v16M4 12h16" /></svg>
  </span>
);

const AVATAR_COLOURS = { self: '#0b6e69', spouse: '#e4553b', son: '#2b7a3d', daughter: '#c58a12', father: '#5b4bb8', mother: '#a2397a' };
export const Avatar = ({ member, gender }) => (
  <span className="avatar" style={{ background: AVATAR_COLOURS[member] }} aria-hidden="true">{memberLabel(member, gender)[0]}</span>
);

export const BankMono = ({ plan, large }) => (
  <span className={`mono${large ? ' lg' : ''}`} style={{ background: plan.tint }} aria-hidden="true">{plan.monogram}</span>
);

export function InterestButton({ slug, name, assessmentId, small, block }) {
  const { isInterested, toggleInterest } = useSession();
  const [saving, setSaving] = useState(false);
  const on = isInterested(slug);
  const click = async () => {
    setSaving(true);
    await toggleInterest(slug, assessmentId).finally(() => setSaving(false));
  };
  return (
    <button type="button" className={`btn ${on ? 'interested' : 'accent'}${small ? ' sm' : ''}${block ? ' block' : ''}`} aria-pressed={on} aria-label={`${on ? 'Remove' : 'Add'} ${name} ${on ? 'from' : 'to'} interested`} disabled={saving} onClick={click}>
      <Heart filled={on} /> {saving ? 'Saving…' : on ? 'Interested' : 'I’m interested'}
    </button>
  );
}
