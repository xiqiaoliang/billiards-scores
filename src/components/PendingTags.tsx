import { PLAYER1_COLOR, PLAYER2_COLOR, PLAYER3_COLOR } from '../domain/constants';
import { formatTagLabel, sortScoreTags } from '../domain/scoring';
import { useMatch } from '../context/MatchContext';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { Empty, Space, Tag, Typography } from 'antd';

export function PendingTags() {
  const { activeSession, tagFormReadOnly, removePendingTag } = useMatch();
  const { pendingTags, player1Name, player2Name, player3Name } = activeSession;

  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2">
      {pendingTags.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无得分" />
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
                className="mr-0 cursor-pointer rounded-full px-3 py-1 text-sm"
                closable={!tagFormReadOnly}
                style={{ borderColor: color, color }}
                onClose={(e: ReactMouseEvent<HTMLElement>) => {
                  e.preventDefault();
                  removePendingTag(tag.id);
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
