import React, { useState, useRef } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  HardDrive,
  FolderOpen,
  Terminal,
  Download,
  Copy,
  Check,
  Apple,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Modal } from '../Modal';
import {
  isFileSystemAccessSupported,
  matchAndCopyLocalFiles,
  matchLocalFilesFromList,
  generateMacCopyScript,
  generateTerminalCopyCommand,
  downloadTextFile,
  downloadSingleFile,
  type CopyProgress,
  type SafariMatchingResult,
} from '../../services/rawMatcher';
import type { MatchingResult } from '../../types';

interface FgRawModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFileNames: string[];
  clientName: string;
}

export const FgRawModal: React.FC<FgRawModalProps> = ({
  isOpen,
  onClose,
  selectedFileNames,
  clientName,
}) => {
  const [targetType, setTargetType] = useState<'raw' | 'jpg' | 'both'>('raw');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<CopyProgress | null>(null);
  const [result, setResult] = useState<MatchingResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Safari & Mac Native Support
  const safariInputRef = useRef<HTMLInputElement | null>(null);
  const [isScanningSafari, setIsScanningSafari] = useState(false);
  const [safariResult, setSafariResult] = useState<SafariMatchingResult | null>(null);
  const [copiedTerminal, setCopiedTerminal] = useState(false);
  const [downloadingBatch, setDownloadingBatch] = useState(false);

  const supported = isFileSystemAccessSupported();

  const handleStartCopyChrome = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await matchAndCopyLocalFiles(
        selectedFileNames,
        targetType,
        clientName,
        (prog) => setProgress(prog)
      );
      setResult(res);
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setErrorMsg(err?.message || 'Terjadi kesalahan saat mengakses folder.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Safari Folder Scanner
  const handleSafariFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsScanningSafari(true);
    setErrorMsg(null);

    try {
      const res = matchLocalFilesFromList(files, selectedFileNames, targetType);
      setSafariResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memindai folder di Safari.');
    } finally {
      setIsScanningSafari(false);
    }
  };

  // Download Mac Executable Script (.command)
  const handleDownloadMacScript = () => {
    const filenames = safariResult && safariResult.matchedNames.length > 0
      ? safariResult.matchedNames
      : selectedFileNames;
    const script = generateMacCopyScript(filenames, clientName);
    const cleanClient = (clientName || 'klien').toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadTextFile(script, `salin_raw_${cleanClient}.command`);
  };

  // Copy Terminal 1-Line Command
  const handleCopyTerminal = () => {
    const filenames = safariResult && safariResult.matchedNames.length > 0
      ? safariResult.matchedNames
      : selectedFileNames;
    const cmd = generateTerminalCopyCommand(filenames, clientName);
    navigator.clipboard.writeText(cmd);
    setCopiedTerminal(true);
    setTimeout(() => setCopiedTerminal(false), 3000);
  };

  // Download files directly in browser
  const handleDownloadAllMatched = () => {
    if (!safariResult || safariResult.matched.length === 0) return;
    setDownloadingBatch(true);
    safariResult.matched.forEach((item, idx) => {
      setTimeout(() => {
        downloadSingleFile(item.file);
        if (idx === safariResult.matched.length - 1) {
          setDownloadingBatch(false);
        }
      }, idx * 180);
    });
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    if (bytes > 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }
    return (bytes / (1024 * 1024)).toFixed(0) + ' MB';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ambil RAW Otomatis dari Laptop" maxWidth="580px">
      <div>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.6 }}>
          Fotografer <b>tidak perlu mencari satu per satu</b> di folder laptop atau kartu SD. Cukup tentukan folder sumber foto, Tandain akan otomatis mencocokkan {selectedFileNames.length} file pilihan klien.
        </p>

        {/* Target file types selector */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
            Format file yang ingin dicari & disalin:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                setTargetType('raw');
                setSafariResult(null);
              }}
              className={`pill-btn ${targetType === 'raw' ? 'pill-btn-primary' : 'pill-btn-secondary'}`}
              style={{ height: '38px', fontSize: '12.5px' }}
            >
              Hanya RAW (.CR3, .ARW...)
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetType('jpg');
                setSafariResult(null);
              }}
              className={`pill-btn ${targetType === 'jpg' ? 'pill-btn-primary' : 'pill-btn-secondary'}`}
              style={{ height: '38px', fontSize: '12.5px' }}
            >
              Hanya JPG
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetType('both');
                setSafariResult(null);
              }}
              className={`pill-btn ${targetType === 'both' ? 'pill-btn-primary' : 'pill-btn-secondary'}`}
              style={{ height: '38px', fontSize: '12.5px' }}
            >
              RAW + JPG
            </button>
          </div>
        </div>

        {/* =========================================================================
            ALUR 1: BROWSER CHROME / EDGE (File System Access API Direct Write)
            ========================================================================= */}
        {supported && (
          <div style={{ marginBottom: '20px' }}>
            {!isProcessing && !result && (
              <button
                type="button"
                onClick={handleStartCopyChrome}
                className="pill-btn pill-btn-primary"
                style={{
                  width: '100%',
                  height: '48px',
                  fontSize: '14.5px',
                  backgroundColor: '#007AFF',
                  boxShadow: '0 4px 14px rgba(0, 122, 255, 0.25)',
                  marginBottom: '12px',
                }}
              >
                <HardDrive size={18} /> Pilih Folder di Laptop & Salin Otomatis
              </button>
            )}

            {isProcessing && progress && (
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--surface-subtle)',
                  border: '1px solid var(--border)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>
                    {progress.statusText}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#007AFF' }}>
                    {progress.current}/{progress.total}
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', borderRadius: '9999px', backgroundColor: 'var(--border)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(progress.current / progress.total) * 100}%`,
                      height: '100%',
                      backgroundColor: '#007AFF',
                      transition: 'width 0.15s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {result && (
              <div
                style={{
                  padding: '16px 18px',
                  borderRadius: '14px',
                  backgroundColor: '#E8F5E9',
                  border: '1px solid #C8E6C9',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <CheckCircle2 size={20} color="#2E7D32" />
                  <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#1B5E20' }}>
                    {result.copiedCount} file berhasil disalin ke subfolder baru!
                  </span>
                </div>
                {result.missing.length > 0 && (
                  <p style={{ fontSize: '12px', color: '#B25E00', marginTop: '6px' }}>
                    ⚠️ {result.missing.length} file belum ditemukan di folder: {result.missing.slice(0, 5).join(', ')}
                    {result.missing.length > 5 ? '...' : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            ALUR 2: SAFARI / macOS NATIVE WORKFLOW (100% Support Safari)
            ========================================================================= */}
        <div
          style={{
            borderRadius: '16px',
            border: '1.5px solid #D1E3FF',
            backgroundColor: '#F8FAFF',
            padding: '16px',
            marginBottom: '18px',
          }}
        >
          {/* Header Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Apple size={18} color="#007AFF" />
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E3A8A' }}>
                Mode Safari Mac (macOS Native)
              </span>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: '#DBEAFE',
                color: '#1D4ED8',
                padding: '3px 8px',
                borderRadius: '999px',
              }}
            >
              100% Cocok di Safari
            </span>
          </div>

          <p style={{ fontSize: '12px', color: '#4B5563', lineHeight: 1.5, marginBottom: '14px' }}>
            Safari Mac melindungi file lokal Anda. Pilih folder foto master di Mac untuk memindai file RAW secara instan, lalu jalankan penyalinan 1-klik:
          </p>

          {/* Hidden Safari Folder Input */}
          <input
            ref={safariInputRef}
            type="file"
            // @ts-expect-error webkitdirectory is standard in Safari/WebKit
            webkitdirectory=""
            directory=""
            multiple
            style={{ display: 'none' }}
            onChange={handleSafariFolderSelect}
          />

          {/* Safari Step 1: Pick Folder */}
          <button
            type="button"
            disabled={isScanningSafari}
            onClick={() => safariInputRef.current?.click()}
            style={{
              width: '100%',
              minHeight: '44px',
              borderRadius: '11px',
              border: '1px solid #BFDBFE',
              backgroundColor: '#FFFFFF',
              color: '#1D4ED8',
              fontSize: '13.5px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(37, 99, 235, 0.08)',
              marginBottom: '12px',
              transition: 'all 0.15s ease',
            }}
          >
            {isScanningSafari ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Memindai file di folder Mac...
              </>
            ) : (
              <>
                <FolderOpen size={17} /> {safariResult ? 'Ganti Folder Master Foto di Mac' : '1. Pilih Folder Master Foto di Safari Mac'}
              </>
            )}
          </button>

          {/* Safari Scan Result Preview */}
          {safariResult && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '12px 14px',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#10B981' }}>
                  ✅ Ditemukan {safariResult.matched.length} file cocok!
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
                  Total: {formatBytes(safariResult.totalBytes)}
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: '#64748B', lineHeight: 1.4, margin: 0 }}>
                {safariResult.matched.length === selectedFileNames.length
                  ? `Semua ${selectedFileNames.length} file pilihan klien berhasil dicocokkan.`
                  : `${safariResult.matched.length} dari ${selectedFileNames.length} file pilihan ditemukan di folder ini.`}
              </p>
              {safariResult.missing.length > 0 && (
                <p style={{ fontSize: '11px', color: '#D97706', marginTop: '6px' }}>
                  ⚠️ {safariResult.missing.length} file belum ditemukan: {safariResult.missing.slice(0, 3).join(', ')}...
                </p>
              )}
            </div>
          )}

          {/* Safari Action 1: Download Mac Script (.command) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={handleDownloadMacScript}
              style={{
                width: '100%',
                minHeight: '44px',
                borderRadius: '11px',
                backgroundColor: '#007AFF',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 122, 255, 0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              <Download size={16} /> 🚀 Download Script Salin RAW Mac (.command)
            </button>
            <span style={{ fontSize: '11px', color: '#6B7280', textAlign: 'center', marginBottom: '4px' }}>
              💡 Cukup double-click file ini di folder foto Mac Anda, file RAW langsung tersalin dalam 1 detik!
            </span>

            {/* Safari Action 2: Copy Terminal 1-line command */}
            <button
              type="button"
              onClick={handleCopyTerminal}
              style={{
                width: '100%',
                minHeight: '42px',
                borderRadius: '10px',
                backgroundColor: '#FFFFFF',
                color: '#1F2937',
                border: '1px solid #D1D5DB',
                fontSize: '12.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {copiedTerminal ? (
                <>
                  <Check size={16} color="#10B981" /> Perintah Terminal Tersalin!
                </>
              ) : (
                <>
                  <Terminal size={15} color="#4B5563" /> <Copy size={14} /> Salin Perintah Terminal Mac (1-Klik)
                </>
              )}
            </button>

            {/* Safari Action 3: Direct Download in browser if scanned */}
            {safariResult && safariResult.matched.length > 0 && (
              <button
                type="button"
                disabled={downloadingBatch}
                onClick={handleDownloadAllMatched}
                style={{
                  width: '100%',
                  minHeight: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'transparent',
                  color: '#4B5563',
                  border: '1px dashed #CBD5E1',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: downloadingBatch ? 'wait' : 'pointer',
                  marginTop: '2px',
                }}
              >
                <Sparkles size={14} /> {downloadingBatch ? 'Sedang mengunduh file...' : `Download ${safariResult.matched.length} File RAW via Browser Safari`}
              </button>
            )}
          </div>
        </div>

        {/* Global Error Notice */}
        {errorMsg && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: '#FFF0F0',
              color: 'var(--heart)',
              fontSize: '13px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={18} /> {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={onClose} className="pill-btn pill-btn-secondary" style={{ width: '100%', height: '44px' }}>
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
