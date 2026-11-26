// Simple flat avatars for family members, drawn in SVG (no stock imagery).
const LOOKS = {
  male: { bg: '#dff0ec', skin: '#f2c7a5', hair: '#3a2a20', shirt: '#0b6e69', long: false, grey: false, small: false },
  female: { bg: '#ffe9e1', skin: '#efc2a0', hair: '#4a2d22', shirt: '#e0613a', long: true, grey: false, small: false },
  boy: { bg: '#e1f5ec', skin: '#f4cdb0', hair: '#2f2219', shirt: '#11804a', long: false, grey: false, small: true },
  girl: { bg: '#fdf0d8', skin: '#f4cdb0', hair: '#3b2519', shirt: '#d48a0c', long: true, grey: false, small: true },
  oldman: { bg: '#ebe7f7', skin: '#e8b994', hair: '#c9c9c9', shirt: '#5b4bb8', long: false, grey: true, small: false },
  oldwoman: { bg: '#f6e6f0', skin: '#e8b994', hair: '#cfcfcf', shirt: '#a2397a', long: true, grey: true, small: false },
};

export function lookFor(member, gender) {
  if (member === 'self') return gender === 'female' ? 'female' : 'male';
  if (member === 'spouse') return gender === 'female' ? 'male' : 'female';
  return { son: 'boy', daughter: 'girl', father: 'oldman', mother: 'oldwoman' }[member];
}

export default function Avatar({ member, gender, size = 40 }) {
  const l = LOOKS[lookFor(member, gender)];
  const headR = l.small ? 6.2 : 7;
  const headY = l.small ? 17 : 16;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill={l.bg} />
      {l.long && <path d={`M${20 - headR - 1.5} ${headY} q0 ${headR * 2.3} ${headR + 1.5} ${headR * 2.1} q${headR + 1.5} 0.2 ${headR + 1.5} -${headR * 2.1}`} fill={l.hair} />}
      <path d={l.small ? 'M10 40c0-7 4.5-11 10-11s10 4 10 11z' : 'M8 40c0-8 5.4-12.5 12-12.5S32 32 32 40z'} fill={l.shirt} />
      <circle cx="20" cy={headY} r={headR} fill={l.skin} />
      <path d={`M${20 - headR} ${headY - 0.5} a${headR} ${headR} 0 0 1 ${headR * 2} 0 q-${headR} -3.4 -${headR * 2} 0z`} fill={l.hair} />
      {l.grey && <circle cx="20" cy={headY + 1} r="2.6" fill="none" stroke="#7b6a5c" strokeWidth="0.9" opacity="0.6" />}
    </svg>
  );
}
