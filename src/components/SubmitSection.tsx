import { useMatch } from '../context/MatchContext';

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
    <div className="submit-section">
      {submitError && (
        <div className="submit-section__error" role="alert">
          {submitError}
        </div>
      )}
      <button
        type="button"
        className="btn-submit"
        disabled={!canSubmit}
        onClick={() => (isEditingRound ? saveEditRound() : submitRound())}
      >
        {isEditingRound ? '保存修改' : '提交本局成绩'}
      </button>
    </div>
  );
}
