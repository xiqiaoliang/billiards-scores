import {
  ARCHIVE_CONFIRM_TEXT,
  NEW_MATCH_CONFIRM_TEXT,
  deleteHistoryConfirmText,
} from '../domain/constants';
import { useMatch } from '../context/MatchContext';
import { Button, Modal, Space } from 'antd';

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

  if (confirmModal === 'newMatch') {
    return (
      <Modal open title="新比赛" onCancel={closeConfirmModal} footer={null} centered destroyOnClose>
        <p className="mb-4 text-sm leading-6 text-slate-600">{NEW_MATCH_CONFIRM_TEXT}</p>
        <Space direction="vertical" className="w-full" size={8}>
          <Button block type="primary" onClick={() => confirmNewMatch('duel')}>
            二人追分
          </Button>
          <Button block type="primary" onClick={() => confirmNewMatch('trio')}>
            三人追分
          </Button>
          <Button block onClick={closeConfirmModal}>
            取消
          </Button>
        </Space>
      </Modal>
    );
  }

  let text: string;
  let onConfirm: () => void | Promise<void>;

  switch (confirmModal) {
    case 'archive':
      text = ARCHIVE_CONFIRM_TEXT;
      onConfirm = confirmArchive;
      break;
    case 'deleteHistory':
      text = deleteHistoryConfirmText(pendingDeleteIds.length);
      onConfirm = confirmDeleteHistory;
      break;
    default:
      return null;
  }

  return (
    <Modal
      open
      title="请确认"
      onCancel={closeConfirmModal}
      centered
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={closeConfirmModal}>
          取消
        </Button>,
        <Button key="confirm" danger={confirmModal === 'archive' || confirmModal === 'deleteHistory'} type="primary" onClick={() => onConfirm()}>
          确定
        </Button>,
      ]}
    >
      <p className="mb-0 text-sm leading-6 text-slate-600">{text}</p>
    </Modal>
  );
}
