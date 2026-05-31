import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Divider, Modal, Typography } from 'antd';
import { useState } from 'react';
import { useMatch } from '../context/MatchContext';

export function ScoreRuleGuide() {
  const { match } = useMatch();
  const [open, setOpen] = useState(false);

  if (!match) return null;

  const isTrio = match.mode === 'trio';
  const modeLabel = isTrio ? '三人追分' : '二人追分';

  return (
    <>
      <Button
        data-export-hide
        type="text"
        size="small"
        className="text-slate-500"
        icon={<InfoCircleOutlined />}
        aria-label="查看计分规则"
        onClick={() => setOpen(true)}
      />
      <Modal
        open={open}
        title="计分规则说明"
        onCancel={() => setOpen(false)}
        footer={null}
        centered
        width={560}
        style={{ maxWidth: 'calc(100vw - 24px)' }}
      >
        <div className="space-y-4 text-sm leading-6 text-slate-700">
          <Typography.Text className="block text-slate-600">
            当前比赛模式：<Typography.Text strong>{modeLabel}</Typography.Text>
          </Typography.Text>

          <section>
            <Typography.Title level={5} className="!mb-2">
              计分规则
            </Typography.Title>
            <ul className="list-disc space-y-1 pl-5">
              <li>犯规：1 分/次，可重复选择，无上限。</li>
              <li>
                让杆犯规：1 分/次，仅在三人模式且处于让杆状态时可选。
              </li>
              <li>开球犯规：1 分/次，单局每名选手最多选择 1 次。</li>
              <li>分球：2 分/局，单局每名选手最多选择 1 次。</li>
              <li>普胜：4 分/局。</li>
              <li>黄金9：4 分/局。</li>
              <li>小金：7 分/局。</li>
              <li>大金：10 分/局。</li>
            </ul>
          </section>

          <section>
            <Typography.Title level={5} className="!mb-2">
              统计与结算规则
            </Typography.Title>
            <ul className="list-disc space-y-1 pl-5">
              <li>常规得分只累加到基础统计列，不计入额外分。</li>
              <li>
                让杆得分按“基础分值 × 2”结算，基础统计列记原始分值，额外分列记加倍差值。
              </li>
              <li>
                总分 = 100 + 累计净分；净分为当前累计净分，所有选手净分和始终为 0。
              </li>
              <li>二人模式下，允许让杆与黑金同时勾选；同时勾选时按让杆语义处理，不再额外翻倍。</li>
              <li>
                让杆黑金标签会显示为：让杆黑普胜、让杆黑小金、让杆黑大金。
              </li>
            </ul>
          </section>

          {isTrio ? (
            <section>
              <Typography.Title level={5} className="!mb-2">
                三人模式额外规则
              </Typography.Title>
              <ul className="list-disc space-y-1 pl-5">
                <li>三人模式默认选手名为：吴、席、王。</li>
                <li>让杆含义为：下家不打，本家继续打。</li>
                <li>让杆状态下可选“让杆犯规”，分值 1，赔下家。</li>
                <li>让杆与黑金可以同时勾选，但同时存在时优先按让杆处理，只与下家结算，且不触发让杆翻倍。</li>
                <li>若本家为赔分方，则赔分仍按原分值结算。</li>
                <li>开球犯规、分球、胜负项支持快速切换，点 A 后再点 B 时直接替换为 B。</li>
                <li>开球犯规与黄金9仅在当局第一位选手（发球位）的得分卡片中显示。</li>
              </ul>
            </section>
          ) : (
            <section>
              <Typography.Title level={5} className="!mb-2">
                二人模式额外规则
              </Typography.Title>
              <ul className="list-disc space-y-1 pl-5">
                <li>允许让杆与黑金同时勾选。</li>
                <li>让杆状态下可选：犯规、分球、普胜、小金、大金。</li>
                <li>勾选让杆时隐藏黄金9。</li>
                <li>若让杆与黑金同时勾选，则隐藏犯规、分球，仅保留普胜、小金、大金。</li>
                <li>二人模式下，普通犯规、开球犯规总次数会在总览里合并统计。</li>
              </ul>
            </section>
          )}

          <Divider className="!my-0" />

          <section>
            <Typography.Title level={5} className="!mb-2">
              击球顺序规则
            </Typography.Title>
            <ul className="list-disc space-y-1 pl-5">
              <li>页面上的选手栏顺序即本局击球顺序。</li>
              <li>首局从当前顺序第 1 位开始，后续对局自动承接上一局结束后的顺序。</li>
              {isTrio ? (
                <>
                  <li>三人模式下默认顺序为：选手 1 → 选手 2 → 选手 3。</li>
                  <li>三人模式支持按当前击球顺序展示选手栏位，首局前可先调整顺序。</li>
                  <li>系统会根据本局胜负项以及让杆/黑金关系，自动计算下一局顺序。</li>
                </>
              ) : (
                <>
                  <li>二人模式下按两名选手轮流击球，顺序始终在当前两位选手之间切换。</li>
                  <li>若本局产生胜负项，下一局顺序仍以系统承接后的顺序为准。</li>
                </>
              )}
            </ul>
          </section>
        </div>
      </Modal>
    </>
  );
}



