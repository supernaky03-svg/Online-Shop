interface Props {
  title: string;
  message: string;
  confirmText: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export default function ConfirmModal({ title, message, confirmText, onCancel, onConfirm }: Props) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="confirm-card">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="secondary" onClick={onCancel}>Cancel</button>
          <button className="danger" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
