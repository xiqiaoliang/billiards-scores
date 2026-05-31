import { useMatch } from '../context/MatchContext';
import { Alert, Button } from 'antd';

export function SubmitSection() {
  const {
    activeSession,
    tagFormReadOnly,
    isEditingRound,
    submitRound,
    saveEditRound,
  } = useMatch();
  const { pendingTags, submitError } = activeSession;
  const canSubmit = !tagFormReadOnly && pendingTags.length > 0;

  return (
    <div className="px-4">
      {submitError && (
        <Alert className="mb-2" type="error" message={submitError} showIcon />
      )}
      <Button
        type="primary"
        size="large"
        block
        disabled={!canSubmit}
        onClick={() => (isEditingRound ? saveEditRound() : submitRound())}
      >
        {isEditingRound ? '保存修改' : '提交本局成绩'}
      </Button>
    </div>
  );
}
