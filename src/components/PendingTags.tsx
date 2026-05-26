import { PLAYER1_COLOR, PLAYER2_COLOR } from '../domain/constants';
import { formatTagLabel, sortScoreTags } from '../domain/scoring';
import { useMatch } from '../context/MatchContext';

export function PendingTags() {
  const { activeSession, tagFormReadOnly, removePendingTag } = useMatch();
  const { pendingTags, player1Name, player2Name } = activeSession;

  return (
    <div className="pending-tags">
      {pendingTags.length === 0 ? (
        <span className="pending-tags__empty">暂无得分</span>
      ) : (
        <div className="pending-tags__list">
          {sortScoreTags(pendingTags).map((tag) => {
            const name = tag.player === 1 ? player1Name : player2Name;
            const color = tag.player === 1 ? PLAYER1_COLOR : PLAYER2_COLOR;
            return (
              <span
                key={tag.id}
                className={`pending-tag${tagFormReadOnly ? ' pending-tag--readonly' : ''}`}
                style={{ borderColor: color, color }}
                onClick={() => !tagFormReadOnly && removePendingTag(tag.id)}
                role={tagFormReadOnly ? undefined : 'button'}
                tabIndex={tagFormReadOnly ? undefined : 0}
                onKeyDown={(e) => {
                  if (!tagFormReadOnly && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    removePendingTag(tag.id);
                  }
                }}
              >
                {formatTagLabel(name, tag)}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
