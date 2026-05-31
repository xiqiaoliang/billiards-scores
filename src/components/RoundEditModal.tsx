import { useMatch } from '../context/MatchContext';
import { buildComputedRoundOrders } from '../domain/scoring';
import { PendingTags } from './PendingTags';
import { PlayerScoreBar } from './PlayerScoreBar';
import { SubmitSection } from './SubmitSection';
import { Button, Drawer, Typography } from 'antd';

export function RoundEditModal() {
  const { editingRoundNumber, cancelEditRound, displayPlayerOrder, match } = useMatch();

  if (editingRoundNumber == null) return null;

  const computedOrders = match ? buildComputedRoundOrders(match) : {};
  const editingRound = match?.rounds.find((r) => r.roundNumber === editingRoundNumber);
  const editingPlayerOrder =
    computedOrders[editingRoundNumber] ??
    (editingRound?.playerOrder && editingRound.playerOrder.length > 0
      ? editingRound.playerOrder
      : displayPlayerOrder);

  return (
    <Drawer
      open
      placement="bottom"
      height="600px"
      title={<Typography.Title level={4} className="!m-0">编辑第 {editingRoundNumber} 局</Typography.Title>}
      closable={false}
      extra={<Button type={'link'} onClick={cancelEditRound}>取消</Button>}
      destroyOnClose
    >
      <div className="flex h-full flex-col gap-3 overflow-y-auto pb-4">
        <Typography.Paragraph className="!mb-0 text-sm text-slate-500">
          修改计分标签后点击保存，本局时间不变。
        </Typography.Paragraph>
        {editingPlayerOrder.map((player) => (
          <PlayerScoreBar key={player} player={player} playerOrder={editingPlayerOrder} />
        ))}
        <Typography.Title level={5} className="!mb-0 !mt-2">
          本局得分（点击标签可删除）
        </Typography.Title>
        <PendingTags />
        <SubmitSection />
      </div>
    </Drawer>
  );
}
