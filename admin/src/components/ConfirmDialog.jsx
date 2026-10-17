// window.confirm isn't reliable inside desktop webviews, so use an in-app dialog
export default function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onCancel }) {
  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <div className="card dialog" role="alertdialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="dialog-actions">
          <button onClick={onCancel}>Cancel</button>
          <button autoFocus className={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
