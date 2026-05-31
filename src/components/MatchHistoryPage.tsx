import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  ScanOutlined,
  UploadOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { Button, Card, Checkbox, Empty, List, Space, Spin, Tag, Typography } from 'antd';
import { calcMatchOverview } from '../domain/scoring';
import { useMatch } from '../context/MatchContext';
import { formatDateTime, formatMatchPlayersLabel } from '../utils/formatTime';
import { ConfirmModal } from './ConfirmModal';
import { GlobalToast } from './GlobalToast';
import { ImportTextModal } from './ImportTextModal';
import { QrErrorDetailModal } from './QrErrorDetailModal';
import { QrScanModal } from './QrScanModal';

export function MatchHistoryPage() {
  const {
    historyMatches,
    historyLoading,
    match: currentMatch,
    closeHistory,
    loadMatchFromHistory,
    requestDeleteHistory,
    importMatchFromQrPayload,
    importMatchFromQrImage,
    importMatchFromQrText,
  } = useMatch();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scanOpen, setScanOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedIds((prev) => {
      const validIds = new Set(historyMatches.map((m) => m.id));
      const next = [...prev].filter((id) => validIds.has(id));
      if (next.length === prev.size) return prev;
      return new Set(next);
    });
  }, [historyMatches]);

  const allSelected =
    historyMatches.length > 0 &&
    selectedIds.size === historyMatches.length;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await importMatchFromQrImage(file);
  };

  const handleScanResult = async (text: string) => {
    setScanOpen(false);
    await importMatchFromQrPayload(text);
  };

  const handlePasteImport = async (text: string) => {
    setPasteOpen(false);
    await importMatchFromQrText(text);
  };

  const historyModeLabel = (status: string) => (status === 'archived' ? '已封存' : '进行中');

  return (
    <div className="flex min-h-dvh flex-col bg-slate-100">
      <header className="sticky top-0 z-20 grid min-h-14 grid-cols-[1fr_auto_1fr] items-center border-b border-slate-200 bg-white px-3 shadow-sm">
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={closeHistory} aria-label="返回" className="justify-self-start" />
        <Typography.Title level={4} className="!m-0 justify-self-center text-[17px]">
          历史比赛
        </Typography.Title>
        <Space size={0} wrap className="justify-self-end">
          <Button type="link" icon={<UploadOutlined />} onClick={handleImportClick} aria-label="导入" />
          <Button type="link" icon={<EditOutlined />} onClick={() => setPasteOpen(true)} aria-label="粘贴导入" />
          <Button type="link" icon={<ScanOutlined />} onClick={() => setScanOpen(true)} aria-label="扫码导入" />
        </Space>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.txt,text/plain"
          className="sr-only"
          onChange={handleFileChange}
          aria-hidden="true"
          tabIndex={-1}
        />
      </header>

      {historyMatches.length > 0 && !historyLoading && (
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
          <Checkbox
            checked={allSelected}
            onChange={() => {
              if (allSelected) {
                setSelectedIds(new Set());
              } else {
                setSelectedIds(new Set(historyMatches.map((m) => m.id)));
              }
            }}
          >
            全选
          </Checkbox>
          <Button
            danger
            type="text"
            disabled={selectedIds.size === 0}
            onClick={() => requestDeleteHistory([...selectedIds])}
          >
            批量删除{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {historyLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <Spin size="large" />
            <Typography.Text className="text-slate-500">加载中...</Typography.Text>
          </div>
        ) : historyMatches.length === 0 ? (
          <Empty description="暂无历史比赛记录" />
        ) : (
          <List
            dataSource={historyMatches}
            split={false}
            renderItem={(m) => {
              const overview = calcMatchOverview(m);
              const isCurrent = currentMatch?.id === m.id;
              const isSelected = selectedIds.has(m.id);
              const playersLabel = formatMatchPlayersLabel(m);

              return (
                <List.Item className="!mb-3 !p-0 last:!mb-0">
                  <div className="flex w-full items-center gap-2">
                    <Checkbox
                      className="mt-4 shrink-0"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(m.id)) next.delete(m.id);
                          else next.add(m.id);
                          return next;
                        });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`选择 ${playersLabel}`}
                    />
                    <Card
                      className={`flex-1 rounded-2xl border-slate-200 shadow-sm ${isCurrent ? 'border-blue-500 shadow-md' : ''} ${isSelected ? 'ring-1 ring-blue-400' : ''}`}
                      onClick={() => {
                        void loadMatchFromHistory(m.id);
                        setSelectedIds(new Set());
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Typography.Text strong className="text-base">
                          {playersLabel}
                        </Typography.Text>
                        <Tag color={m.status === 'archived' ? 'default' : 'processing'}>
                          {historyModeLabel(m.status)}
                        </Tag>
                      </div>
                      <Typography.Text className="mt-1 block text-xs text-slate-500">
                        {formatDateTime(m.createdAt)} · 共 {m.rounds.length} 局
                      </Typography.Text>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                        <Tag className="m-0 inline-flex w-auto flex-none whitespace-nowrap rounded-full px-2 py-1 text-center" style={{ color: '#1677ff' }}>
                          {m.player1Name} {overview.player1.totalScore}
                        </Tag>
                        <Tag className="m-0 inline-flex w-auto flex-none whitespace-nowrap rounded-full px-2 py-1 text-center" style={{ color: '#f53f3f' }}>
                          {m.player2Name} {overview.player2.totalScore}
                        </Tag>
                        {m.mode === 'trio' && overview.player3 && (
                          <Tag className="m-0 inline-flex w-auto flex-none whitespace-nowrap rounded-full px-2 py-1 text-center" style={{ color: '#d48806' }}>
                            {m.player3Name ?? '选手3'} {overview.player3.totalScore}
                          </Tag>
                        )}
                      </div>
                    </Card>
                    <Button
                      danger
                      type="text"
                      className="self-center"
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        requestDeleteHistory([m.id]);
                      }}
                      aria-label="删除"
                    />
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </div>
      <ConfirmModal />
      <QrErrorDetailModal />
      <GlobalToast />
      {scanOpen && (
        <QrScanModal
          onScan={handleScanResult}
          onClose={() => setScanOpen(false)}
        />
      )}
      {pasteOpen && (
        <ImportTextModal
          onImport={handlePasteImport}
          onClose={() => setPasteOpen(false)}
        />
      )}
    </div>
  );
}
