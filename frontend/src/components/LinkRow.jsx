export default function LinkRow({ url, onDelete, onEdit }) {
  return (
    <tr style={{ height: '56px', borderBottom: '1px solid var(--color-border)' }}>
      <td style={{ padding: '0 16px' }}>{url.short_code}</td>
      <td style={{ padding: '0 16px' }}>{url.short_url}</td>
      <td style={{ padding: '0 16px' }}>{url.long_url}</td>
      <td style={{ padding: '0 16px', textAlign: 'center' }}>{url.click_count ?? 0}</td>
      <td style={{ padding: '0 16px', textAlign: 'right' }}>
        <button onClick={() => onDelete(url.short_code)}>Delete</button>
      </td>
    </tr>
  );
}
