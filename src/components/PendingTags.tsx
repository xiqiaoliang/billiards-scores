import { PLAYER1_COLOR, PLAYER2_COLOR, PLAYER3_COLOR } from '../domain/constants';
import { formatTagLabel, sortScoreTags } from '../domain/scoring';
import { useMatch } from '../context/MatchContext';
import { Space, Tag, Typography } from 'antd';

export function PendingTags() {
  const { activeSession, tagFormReadOnly, removePendingTag } = useMatch();
  const { pendingTags, player1Name, player2Name, player3Name } = activeSession;

  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2">
      {pendingTags.length === 0 ? (
        <Typography.Text className="block py-2 text-sm text-slate-500">
          暂无待提交得分
        </Typography.Text>
      ) : (
        <Space wrap size={[8, 8]}>
          {sortScoreTags(pendingTags).map((tag) => {
            const name =
              tag.player === 1
                ? player1Name
                : tag.player === 2
                  ? player2Name
                  : player3Name;
            const color =
              tag.player === 1
                ? PLAYER1_COLOR
                : tag.player === 2
                  ? PLAYER2_COLOR
                  : PLAYER3_COLOR;
            return (
              <Tag
                key={tag.id}
                className={`mr-0 rounded-full px-3 py-1 text-sm ${tagFormReadOnly ? '' : 'cursor-pointer'}`}
                style={{ borderColor: color, color }}
                onClick={() => {
                  if (!tagFormReadOnly) {
                    removePendingTag(tag.id);
                  }
                }}
              >
                <Typography.Text style={{ color }}>{formatTagLabel(name, tag)}</Typography.Text>
              </Tag>
            );
          })}
        </Space>
      )}
    </div>
  );
}
