export default function SkeletonRow() {
  const cell = (width) => (
    <td style={{ padding: '0 16px', verticalAlign: 'middle' }}>
      <div className="skeleton" style={{ height: '14px', width, borderRadius: '4px' }} />
    </td>
  );
  return (
    <tr style={{ height: '56px', borderBottom: '1px solid var(--color-border)' }}>
      {cell('80px')}
      {cell('120px')}
      {cell('240px')}
      {cell('40px')}
      {cell('100px')}
    </tr>
  );
}
