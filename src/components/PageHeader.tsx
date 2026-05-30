import { useEffect, useRef, useState } from 'react';
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

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [menuOpen]);

  const handleExportImage = () => {
    setMenuOpen(false);
    exportMatchAsImage();
  };

  const handleExportQr = () => {
    setMenuOpen(false);
    exportMatchAsQrCode();
  };

  return (
    <header className="page-header">
      <div className="page-header__actions page-header__actions--left">
        <button type="button" className="btn-text" onClick={() => openHistory()}>
          历史
        </button>
        <button type="button" className="btn-text" onClick={openNewMatchModal}>
          新比赛
        </button>
      </div>
      <h1 className="page-header__title">台球追分记分器</h1>
      <div className="page-header__actions">
        {isReadOnly ? (
          <div className="export-dropdown" ref={menuRef} data-export-hide>
            <button
              type="button"
              className="btn-text export-dropdown__trigger"
              onClick={() => setMenuOpen((v) => !v)}
              disabled={exporting}
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              {exporting ? '导出中…' : '导出'}
              <span className="export-dropdown__arrow" aria-hidden="true">
                ▾
              </span>
            </button>
            {menuOpen && (
              <div className="export-dropdown__menu" role="menu">
                <button
                  type="button"
                  className="export-dropdown__item"
                  role="menuitem"
                  onClick={handleExportImage}
                >
                  导出图片
                </button>
                <button
                  type="button"
                  className="export-dropdown__item"
                  role="menuitem"
                  onClick={handleExportQr}
                >
                  分享二维码
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="btn-text btn-text--danger"
            onClick={openArchiveModal}
          >
            结束本场比赛
          </button>
        )}
      </div>
    </header>
  );
}
