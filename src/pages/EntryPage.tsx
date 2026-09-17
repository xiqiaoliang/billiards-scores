import { ClockCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import { Button, Card, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';

const featureCards = [
  {
    key: 'score',
    title: '台球追分',
    description: '记录每一杆得分、查看回合与胜负分析。',
    to: '/score',
    icon: <TrophyOutlined className="text-xl text-cyan-600" />,
    actionText: '进入追分',
  },
  {
    key: 'timer',
    title: '计时器',
    description: '支持秒表/倒计时，并可调节时间流速。',
    to: '/timer',
    icon: <ClockCircleOutlined className="text-xl text-sky-600" />,
    actionText: '打开计时器',
  },
];

export default function EntryPage() {
  return (
    <div className="entry-page min-h-dvh px-4 py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <header className="entry-hero rounded-2xl px-5 py-6 text-white shadow-lg">
          <Typography.Text className="entry-hero-tag text-xs uppercase tracking-[0.32em] text-cyan-100">
            Billiards Toolkit
          </Typography.Text>
          <Typography.Title level={2} className="!mb-2 !mt-2 !text-white">
            台球追分记分器
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-cyan-50/90">
            选择一个功能开始使用：追分记分或独立计时。
          </Typography.Paragraph>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {featureCards.map((card) => (
            <Card key={card.key} className="entry-card border-0" bodyStyle={{ padding: 18 }}>
              <Space align="start" size={12} className="w-full">
                <div className="entry-card-icon flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50">
                  {card.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <Typography.Title level={4} className="!mb-1 !text-[18px]">
                    {card.title}
                  </Typography.Title>
                  <Typography.Paragraph className="!mb-3 text-slate-500">
                    {card.description}
                  </Typography.Paragraph>
                  <Link to={card.to}>
                    <Button type="primary" className="entry-card-btn">
                      {card.actionText}
                    </Button>
                  </Link>
                </div>
              </Space>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}