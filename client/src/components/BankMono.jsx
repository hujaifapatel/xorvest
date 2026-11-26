export default function BankMono({ monogram, tint, size = '' }) {
  return (
    <span className={`mono ${size}`} style={{ background: tint }} aria-hidden="true">
      {monogram}
    </span>
  );
}
