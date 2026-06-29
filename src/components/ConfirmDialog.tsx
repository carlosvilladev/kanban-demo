/**
 * ConfirmDialog — lightweight in-app confirmation.
 *
 * Uses role="dialog" + aria-modal for accessibility.
 * Does not use window.confirm (NFR-5 — visual polish).
 */

interface ConfirmDialogProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div
      className="confirm-dialog"
      role="dialog"
      aria-modal="true"
      data-testid="confirm-dialog"
      style={{
        background: '#fff',
        border: '1px solid #dfe1e6',
        borderRadius: '6px',
        padding: '1rem',
        boxShadow: '0 4px 16px rgba(0,0,0,0.16)',
      }}
    >
      <p
        className="confirm-message"
        data-testid="confirm-message"
        style={{ margin: '0 0 1rem', fontWeight: 500 }}
      >
        {message}
      </p>
      <div className="confirm-actions" style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          data-testid="confirm-yes"
          onClick={onConfirm}
          style={{
            padding: '0.4rem 0.8rem',
            background: '#de350b',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 500,
            minHeight: '40px',
          }}
        >
          Delete
        </button>
        <button
          data-testid="confirm-cancel"
          onClick={onCancel}
          style={{
            padding: '0.4rem 0.8rem',
            background: '#f4f5f7',
            border: '1px solid #dfe1e6',
            borderRadius: '4px',
            cursor: 'pointer',
            minHeight: '40px',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
