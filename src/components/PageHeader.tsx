import { DownOutlined } from '@ant-design/icons';
import { Button, Dropdown, Typography } from 'antd';
import { useMatch } from '../context/MatchContext';
import { formatArchivedMatchTitle } from '../utils/formatTime';

export function PageHeader() {
  const {
    match,
    isReadOnly,
    exporting,
    openNewMatchModal,
    openArchiveModal,
    openHistory,
    exportMatchAsImage,
    exportMatchAsQrCode,
  } = useMatch();

  const title = isReadOnly && match ? formatArchivedMatchTitle(match) : '台球追分记分器';

  return (
    <header className="relative grid min-h-14 grid-cols-[1fr_auto_1fr] items-center border-b border-slate-200 bg-white px-3 shadow-sm">
      <div className="justify-self-start flex items-center gap-1" data-export-hide>
        <Button type="text" className="!px-2" onClick={() => void openHistory()}>
          历史
        </Button>
        <Button type="text" className="!px-2" onClick={openNewMatchModal}>
          新比赛
        </Button>
      </div>
      <Typography.Title level={4} className="page-header-title !m-0 justify-self-center text-center !text-[17px]">
        {title}
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
            <Button type="text" className="!px-2" disabled={exporting}>
              {exporting ? '导出中…' : '导出'} <DownOutlined />
            </Button>
          </Dropdown>
        ) : (
          <Button danger type="text" className="!px-2" onClick={openArchiveModal}>
            结束本场比赛
          </Button>
        )}
      </div>
    </header>
  );
}
