import { useMatch } from '../context/MatchContext';

export function GlobalToast() {
  const { activeSession } = useMatch();
  const { toastMessage } = activeSession;

  if (!toastMessage) return null;

  return (
    <div className="global-toast" role="alert">
      {toastMessage}
    </div>
  );
}
