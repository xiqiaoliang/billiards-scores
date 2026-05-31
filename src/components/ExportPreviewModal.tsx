import { useMatch } from '../context/MatchContext';
import { Button, Image, Modal, Space, Typography } from 'antd';

export function ExportPreviewModal() {
  const {
    exportPreviewUrl,
    exportPreviewKind,
    closeExportPreview,
    downloadExportPreview,
    exporting,
  } = useMatch();

  if (!exportPreviewUrl) return null;

  const isQr = exportPreviewKind === 'qr';

  return (
    <Modal
      open
      title={isQr ? '二维码预览' : '导出图片预览'}
      onCancel={closeExportPreview}
      centered
      destroyOnClose
      width={480}
      footer={null}
    >
      <Space direction="vertical" className="w-full" size={12}>
        <Typography.Paragraph className="!mb-0 text-center text-sm text-slate-600">
          {isQr ? '先预览二维码，再点击下方按钮下载' : '请长按图片保存到相册，或点击下方按钮下载'}
        </Typography.Paragraph>
        <div className="max-h-[65vh] overflow-y-auto rounded-xl bg-slate-100 p-2">
          <Image
            src={exportPreviewUrl}
            alt={isQr ? '比赛二维码导出' : '比赛记分导出'}
            preview={false}
            className="w-full rounded-lg"
          />
        </div>
        <Button type="primary" block onClick={downloadExportPreview} loading={exporting}>
          {exporting ? '下载中...' : isQr ? '下载二维码' : '下载图片'}
        </Button>
        <Button block onClick={closeExportPreview}>
          关闭
        </Button>
      </Space>
    </Modal>
  );
}
