import { DownOutlined } from '@ant-design/icons';
import { Button, Dropdown, Space, Typography } from 'antd';
import { useMatch } from '../context/MatchContext';

export function PageHeader() {
  const {
    isReadOnly,
    exporting,
    openNewMatchModal,
    openArchiveModal,
    openHistory,
    exportMatchAsImage,
    exportMatchAsQrCode,
  } = useMatch();

  return (
    <header className="grid min-h-14 grid-cols-[1fr_auto_1fr] items-center border-b border-slate-200 bg-white px-3 shadow-sm">
      <Space size={4} className="justify-self-start" data-export-hide>
        <Button type="text" onClick={() => void openHistory()}>
          历史
        </Button>
        <Button type="text" onClick={openNewMatchModal}>
          新比赛
        </Button>
      </Space>
      <Typography.Title level={4} className="!m-0 justify-self-center text-center !text-[17px]">
        台球追分记分器
      </Typography.Title>
      <div className="flex items-center justify-self-end justify-end gap-1" data-export-hide>
        {isReadOnly ? (
          <Dropdown
            menu={{
              items: [
                { key: 'image', label: '导出图片' },
                { key: 'qr', label: '分享二维码' },
              ],
              onClick: ({ key }) => {
                if (key === 'image') {
                  void exportMatchAsImage();
                }
                if (key === 'qr') {
                  void exportMatchAsQrCode();
                }
              },
            }}
            trigger={['click']}
            disabled={exporting}
          >
            <Button type="text" disabled={exporting}>
              {exporting ? '导出中…' : '导出'} <DownOutlined />
            </Button>
          </Dropdown>
        ) : (
          <Button danger type="text" onClick={openArchiveModal}>
            结束本场比赛
          </Button>
        )}
      </div>
    </header>
  );
}
