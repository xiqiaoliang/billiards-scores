import {
  ARCHIVE_CONFIRM_TEXT,
  NEW_MATCH_CONFIRM_TEXT,
  deleteHistoryConfirmText,
} from '../domain/constants';
import { useMatch } from '../context/MatchContext';

export function ConfirmModal() {
  const {
    confirmModal,
    pendingDeleteIds,
    closeConfirmModal,
    confirmArchive,
    confirmNewMatch,
    confirmDeleteHistory,
  } = useMatch();

  if (!confirmModal) return null;

  let text: string;
  let onConfirm: () => void | Promise<void>;

  switch (confirmModal) {
    case 'archive':
      text = ARCHIVE_CONFIRM_TEXT;
      onConfirm = confirmArchive;
      break;
    case 'newMatch':
      text = NEW_MATCH_CONFIRM_TEXT;
      onConfirm = confirmNewMatch;
      break;
    case 'deleteHistory':
      text = deleteHistoryConfirmText(pendingDeleteIds.length);
      onConfirm = confirmDeleteHistory;
      break;
    default:
      return null;
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <p className="modal__text">{text}</p>
        <div className="modal__actions">
          <button
            type="button"
            className="modal__btn modal__btn--cancel"
            onClick={closeConfirmModal}
          >
            取消
          </button>
          <button
            type="button"
            className="modal__btn modal__btn--confirm"
            onClick={() => onConfirm()}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
