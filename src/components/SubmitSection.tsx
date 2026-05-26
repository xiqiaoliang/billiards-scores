import { useMatch } from '../context/MatchContext';

export function SubmitSection() {
  const { session, isReadOnly, submitRound } = useMatch();
  const { pendingTags, submitError, toastMessage } = session;
  const canSubmit = !isReadOnly && pendingTags.length > 0;

  return (
    <div className="submit-section">
      {toastMessage && (
        <div className="submit-section__toast" role="alert">
          {toastMessage}
        </div>
      )}
      {submitError && (
        <div className="submit-section__error" role="alert">
          {submitError}
        </div>
      )}
      <button
        type="button"
        className="btn-submit"
        disabled={!canSubmit}
        onClick={() => submitRound()}
      >
        提交本局成绩
      </button>
    </div>
  );
}
