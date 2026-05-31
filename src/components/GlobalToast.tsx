import { useMatch } from '../context/MatchContext';
import { Alert } from 'antd';

export function GlobalToast() {
  const { activeSession } = useMatch();
  const { toastMessage } = activeSession;

  if (!toastMessage) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[120] -translate-x-1/2 px-4">
      <Alert message={toastMessage} type="info" showIcon className="shadow-lg" />
    </div>
  );
}
