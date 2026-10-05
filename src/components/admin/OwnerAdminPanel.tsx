import React, { useEffect, useState } from 'react';
import {
  checkIsAdmin,
  fetchAdminDashboard,
  adminUpdateProject,
  adminDeleteProject,
  adminSetAnnouncement,
  type AdminDashboardData,
  type AdminCheckResult,
  type Announcement,
  type AnnouncementTone,
} from '../../services/admin';
import {
  signInWithGoogle,
  signInWithEmail,
  signOutUser,
  subscribeAuthChanges,
} from '../../services/supabase';
import { ownerReturnUrl, leaveOwnerRoute } from '../../services/ownerGate';
import type { AuthUser } from '../../types';
import {
  Shield,
  Users,
  FolderKanban,
  Megaphone,
  LogOut,
  RefreshCw,
  ExternalLink,
  Lock,
  Unlock,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Search,
  MessageCircle,
  Copy,
  Check,
  Eye,
  KeyRound,
  Mail,
  Loader2,
} from 'lucide-react';

export default function OwnerAdminPanel() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authStatus, setAuthStatus] = useState<AdminCheckResult | 'loading'>('loading');
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Tab
  const [tab, setTab] = useState<'stats' | 'vendors' | 'projects' | 'announcement'>('stats');

  // Filter & Search
  const [vendorSearch, setVendorSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Announcement Draft
  const [announcementDraft, setAnnouncementDraft] = useState<Announcement>({
    active: false,
    message: '',
    tone: 'info',
  });
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [announcementSuccess, setAnnouncementSuccess] = useState(false);

  // Direct login state for owner
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Subscribe to auth
  useEffect(() => {
    return subscribeAuthChanges((user) => {
      setCurrentUser(user);
    });
  }, []);

  // Check admin role whenever user changes
  useEffect(() => {
    if (!currentUser) {
      setAuthStatus('not_admin');
      setData(null);
      return;
    }

    setAuthStatus('loading');
    checkIsAdmin().then((res) => {
      setAuthStatus(res);
      if (res === 'admin') {
        loadData();
      }
    });
  }, [currentUser]);

  const loadData = async () => {
    setIsRefreshing(true);
    setErrorMsg('');
    try {
      const res = await fetchAdminDashboard();
      setData(res);
      setAnnouncementDraft(res.announcement);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat data dashboard.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPass.trim()) return;
    setIsLoggingIn(true);
    setErrorMsg('');
    try {
      await signInWithEmail(loginEmail, loginPass);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login gagal.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMsg('');
    try {
      await signInWithGoogle(ownerReturnUrl());
    } catch (err: any) {
      setErrorMsg(err.message || 'Login Google gagal.');
      setIsLoggingIn(false);
    }
  };

  const handleToggleProjectLock = async (id: string, currentLock: boolean) => {
    try {
      await adminUpdateProject(id, { locked: !currentLock });
      await loadData();
    } catch (err: any) {
      alert('Gagal mengubah status: ' + err.message);
    }
  };

  const handleToggleProjectWatermark = async (id: string, currentWm: boolean) => {
    try {
      await adminUpdateProject(id, { hasWatermark: !currentWm });
      await loadData();
    } catch (err: any) {
      alert('Gagal mengubah watermark: ' + err.message);
    }
  };

  const handleDeleteProject = async (id: string, clientName: string) => {
    if (!confirm(`HAPUS PROYEK: "${clientName}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    try {
      await adminDeleteProject(id);
      await loadData();
    } catch (err: any) {
      alert('Gagal menghapus proyek: ' + err.message);
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnouncementSaving(true);
    setAnnouncementSuccess(false);
    try {
      await adminSetAnnouncement(announcementDraft);
      setAnnouncementSuccess(true);
      setTimeout(() => setAnnouncementSuccess(false), 3000);
      await loadData();
    } catch (err: any) {
      alert('Gagal menyimpan pengumuman: ' + err.message);
    } finally {
      setAnnouncementSaving(false);
    }
  };

  const copyToClipboard = (text: string, slugKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSlug(slugKey);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // 1. GATE UNLOGGED / NOT ADMIN SCREEN
  if (!currentUser || authStatus === 'not_admin' || authStatus === 'setup_required') {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0B0B0F',
          color: '#F0F0F5',
          fontFamily: "'Inter', -apple-system, sans-serif",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '440px',
            backgroundColor: '#14141E',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '32px 28px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 45, 85, 0.12)',
              color: 'var(--heart, #FF2D55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              boxShadow: '0 0 30px rgba(255, 45, 85, 0.2)',
            }}
          >
            <Shield size={28} />
          </div>

          <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.3px', marginBottom: '8px' }}>
            Tandain Owner Gateway
          </h1>
          <p style={{ fontSize: '13px', color: '#8E8E9F', lineHeight: 1.5, marginBottom: '24px' }}>
            Panel kendali super akun tersembunyi. Akses terbatas khusus pemilik sistem.
          </p>

          {authStatus === 'setup_required' ? (
            <div
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '14px',
                padding: '16px',
                textAlign: 'left',
                fontSize: '12.5px',
                color: '#FCD34D',
                lineHeight: 1.5,
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontWeight: 700 }}>
                <AlertTriangle size={16} />
                <span>Migrasi SQL Belum Dijalankan</span>
              </div>
              <p style={{ margin: 0 }}>
                Jalankan file <code>supabase/migrations/002_owner_admin.sql</code> di Supabase SQL Editor sekali untuk mendaftarkan akun owner.
              </p>
            </div>
          ) : authStatus === 'not_admin' && currentUser ? (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '14px',
                padding: '16px',
                textAlign: 'left',
                fontSize: '12.5px',
                color: '#FCA5A5',
                lineHeight: 1.5,
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontWeight: 700 }}>
                <AlertTriangle size={16} />
                <span>Bukan Akun Super Admin</span>
              </div>
              <p style={{ margin: 0 }}>
                Akun <b>{currentUser.email}</b> tidak terdaftar di daftar admin. Pastikan login dengan email owner Anda.
              </p>
              <button
                type="button"
                onClick={() => signOutUser()}
                className="pill-btn"
                style={{
                  marginTop: '12px',
                  height: '36px',
                  fontSize: '12px',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  width: '100%',
                }}
              >
                Ganti Akun / Logout
              </button>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#FCA5A5',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    textAlign: 'left',
                    marginBottom: '16px',
                  }}
                >
                  {errorMsg}
                </div>
              )}

              {/* Login Email Owner */}
              <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6A6A80' }} />
                  <input
                    type="email"
                    required
                    placeholder="Email Owner"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 14px 0 38px',
                      borderRadius: '12px',
                      backgroundColor: '#1D1D2B',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      fontSize: '16px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6A6A80' }} />
                  <input
                    type="password"
                    required
                    placeholder="Password Owner"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 14px 0 38px',
                      borderRadius: '12px',
                      backgroundColor: '#1D1D2B',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      fontSize: '16px',
                      outline: 'none',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="pill-btn"
                  style={{
                    width: '100%',
                    height: '44px',
                    backgroundColor: 'var(--heart, #FF2D55)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 700,
                  }}
                >
                  {isLoggingIn ? <Loader2 size={16} className="animate-spin" /> : 'Masuk Master Console'}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
                <span style={{ fontSize: '11px', color: '#6A6A80', textTransform: 'uppercase' }}>atau</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
              </div>

              {/* 1-Click Google for Owner */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="pill-btn"
                style={{
                  width: '100%',
                  height: '44px',
                  backgroundColor: '#1F1F2F',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  gap: '8px',
                  marginBottom: '20px',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                Masuk dengan Akun Google Owner
              </button>
            </>
          )}

          <button
            type="button"
            onClick={leaveOwnerRoute}
            style={{
              background: 'none',
              border: 'none',
              color: '#8E8E9F',
              fontSize: '12px',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            ← Kembali ke Website Publik
          </button>
        </div>
      </div>
    );
  }

  // 2. MAIN OWNER DASHBOARD
  const stats = data?.stats;
  const filteredVendors = (data?.vendors || []).filter((v) => {
    const q = vendorSearch.toLowerCase();
    return (
      (v.studio_name || '').toLowerCase().includes(q) ||
      (v.email || '').toLowerCase().includes(q) ||
      (v.whatsapp || '').includes(q)
    );
  });

  const filteredProjects = (data?.projects || []).filter((p) => {
    const q = projectSearch.toLowerCase();
    return (
      (p.client_name || '').toLowerCase().includes(q) ||
      (p.studio_name || '').toLowerCase().includes(q) ||
      (p.slug || '').toLowerCase().includes(q)
    );
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0A0A0F',
        color: '#E4E4EB',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Top Navbar */}
      <header
        className="safe-top"
        style={{
          backgroundColor: '#12121B',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '14px 20px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {/* Logo & Super Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 45, 85, 0.18)',
                color: 'var(--heart, #FF2D55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>Tandain</span>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: '#FF2D55',
                    color: '#FFFFFF',
                    textTransform: 'uppercase',
                  }}
                >
                  Owner Super Admin
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#8E8E9F' }}>
                Login sebagai: <b>{currentUser.email}</b>
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={loadData}
              disabled={isRefreshing}
              className="pill-btn"
              style={{
                height: '36px',
                padding: '0 12px',
                backgroundColor: '#1A1A26',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#D1D1DE',
                fontSize: '12.5px',
                gap: '6px',
              }}
              title="Refresh Data"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => window.open('/', '_blank')}
              className="pill-btn"
              style={{
                height: '36px',
                padding: '0 12px',
                backgroundColor: '#1A1A26',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#D1D1DE',
                fontSize: '12.5px',
                gap: '6px',
              }}
            >
              <ExternalLink size={14} /> Buka Web Publik
            </button>

            <button
              onClick={leaveOwnerRoute}
              className="pill-btn"
              style={{
                height: '36px',
                padding: '0 14px',
                backgroundColor: '#26151B',
                border: '1px solid rgba(255, 45, 85, 0.3)',
                color: '#FF4D6D',
                fontSize: '12.5px',
                fontWeight: 600,
                gap: '6px',
              }}
            >
              <LogOut size={14} /> Keluar & Kunci
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px 80px' }}>
        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => setTab('stats')}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: tab === 'stats' ? '#FF2D55' : '#1A1A26',
              color: tab === 'stats' ? '#FFFFFF' : '#8E8E9F',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            📊 Metrik & Ringkasan
          </button>

          <button
            type="button"
            onClick={() => setTab('vendors')}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: tab === 'vendors' ? '#FF2D55' : '#1A1A26',
              color: tab === 'vendors' ? '#FFFFFF' : '#8E8E9F',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Users size={14} /> Seluruh Vendor ({data?.vendors.length || 0})
          </button>

          <button
            type="button"
            onClick={() => setTab('projects')}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: tab === 'projects' ? '#FF2D55' : '#1A1A26',
              color: tab === 'projects' ? '#FFFFFF' : '#8E8E9F',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <FolderKanban size={14} /> Semua Galeri ({data?.projects.length || 0})
          </button>

          <button
            type="button"
            onClick={() => setTab('announcement')}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: tab === 'announcement' ? '#FF2D55' : '#1A1A26',
              color: tab === 'announcement' ? '#FFFFFF' : '#8E8E9F',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Megaphone size={14} /> Pengumuman Global {data?.announcement?.active && '🟢'}
          </button>
        </div>

        {/* ==============================================================
            TAB 1: STATS
            ============================================================== */}
        {tab === 'stats' && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '28px',
              }}
            >
              {/* Card 1: Total Vendor */}
              <div
                style={{
                  backgroundColor: '#13131E',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '18px',
                  padding: '20px',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#8E8E9F' }}>Total Fotografer Terdaftar</span>
                <div style={{ fontSize: '34px', fontWeight: 800, color: '#FFFFFF', margin: '6px 0 2px' }}>
                  {stats?.vendors ?? 0}
                </div>
                <span style={{ fontSize: '11.5px', color: '#10B981', fontWeight: 600 }}>
                  +{stats?.new_vendors_7d ?? 0} vendor baru 7 hari terakhir
                </span>
              </div>

              {/* Card 2: Total Proyek */}
              <div
                style={{
                  backgroundColor: '#13131E',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '18px',
                  padding: '20px',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#8E8E9F' }}>Total Galeri Proyek</span>
                <div style={{ fontSize: '34px', fontWeight: 800, color: '#FFFFFF', margin: '6px 0 2px' }}>
                  {stats?.projects ?? 0}
                </div>
                <span style={{ fontSize: '11.5px', color: '#3B82F6', fontWeight: 600 }}>
                  {stats?.active_projects ?? 0} aktif • {stats?.submitted_projects ?? 0} selesai
                </span>
              </div>

              {/* Card 3: Total Foto */}
              <div
                style={{
                  backgroundColor: '#13131E',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '18px',
                  padding: '20px',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#8E8E9F' }}>Foto Dipilih Klien</span>
                <div style={{ fontSize: '34px', fontWeight: 800, color: 'var(--heart, #FF2D55)', margin: '6px 0 2px' }}>
                  {stats?.selected_photos ?? 0}
                </div>
                <span style={{ fontSize: '11.5px', color: '#8E8E9F' }}>
                  dari total {stats?.photos ?? 0} foto diproses
                </span>
              </div>
            </div>

            {/* Quick Summary Cards */}
            <div
              style={{
                backgroundColor: '#13131E',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '18px',
                padding: '24px',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: '#FFFFFF' }}>
                Status Sistem & Akses Super Admin
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#A0A0B2' }}>
                <div>✅ <b>Server Database Supabase:</b> Terhubung ({data?.vendors.length || 0} akun aktif).</div>
                <div>✅ <b>Row Level Security (RLS):</b> Mode isolasi vendor aktif. Admin menggunakan SECURITY DEFINER.</div>
                <div>✅ <b>Secret Gate:</b> Hash SHA-256 tersimpan di browser, tidak ada tombol publik.</div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 2: VENDORS
            ============================================================== */}
        {tab === 'vendors' && (
          <div>
            {/* Search Input */}
            <div style={{ marginBottom: '18px', position: 'relative', maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6A6A80' }} />
              <input
                type="text"
                placeholder="Cari vendor, nama studio, email..."
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 14px 0 40px',
                  borderRadius: '12px',
                  backgroundColor: '#13131E',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  fontSize: '16px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Vendor List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredVendors.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6A6A80' }}>
                  Tidak ada vendor yang cocok dengan pencarian.
                </div>
              ) : (
                filteredVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    style={{
                      backgroundColor: '#13131E',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                          {vendor.studio_name || '(Tanpa Nama Studio)'}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: vendor.provider === 'google' ? 'rgba(66, 133, 244, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                            color: vendor.provider === 'google' ? '#60A5FA' : '#9CA3AF',
                          }}
                        >
                          {vendor.provider}
                        </span>
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#8E8E9F', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        <span>✉️ {vendor.email || '-'}</span>
                        {vendor.whatsapp && (() => {
                          const cleanWa = vendor.whatsapp.replace(/[^0-9]/g, '');
                          const waTarget = cleanWa.startsWith('0') ? '62' + cleanWa.slice(1) : cleanWa;
                          return (
                            <a
                              href={`https://wa.me/${waTarget}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#34D399', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                            >
                              <MessageCircle size={13} /> {vendor.whatsapp}
                            </a>
                          );
                        })()}
                        <span>📅 Daftar: {new Date(vendor.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
                        {vendor.project_count}
                      </span>
                      <span style={{ fontSize: '12px', color: '#8E8E9F', display: 'block' }}>galeri proyek</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 3: PROJECTS
            ============================================================== */}
        {tab === 'projects' && (
          <div>
            {/* Search Input */}
            <div style={{ marginBottom: '18px', position: 'relative', maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6A6A80' }} />
              <input
                type="text"
                placeholder="Cari nama klien, studio, slug..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 14px 0 40px',
                  borderRadius: '12px',
                  backgroundColor: '#13131E',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  fontSize: '16px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Projects List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredProjects.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6A6A80' }}>
                  Tidak ada proyek yang cocok.
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    style={{
                      backgroundColor: '#13131E',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
                          {project.client_name}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            backgroundColor: project.locked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                            color: project.locked ? '#F87171' : '#34D399',
                          }}
                        >
                          {project.locked ? 'Terkunci' : 'Lagi Milih'}
                        </span>
                        {project.has_watermark && (
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(59, 130, 246, 0.15)',
                              color: '#60A5FA',
                            }}
                          >
                            Watermark ON
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '12.5px', color: '#8E8E9F', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        <span>Studio: <b>{project.studio_name || '-'}</b></span>
                        <span>Seleksi: <b>{project.selected_count}/{project.quota} foto</b></span>
                        <span>Total File: <b>{project.photo_count}</b></span>
                        <span>Slug: <code>{project.slug}</code></span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => window.open(`/?p=${project.slug}`, '_blank')}
                        className="pill-btn"
                        style={{
                          height: '36px',
                          padding: '0 12px',
                          backgroundColor: '#1E1E2F',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          gap: '5px',
                        }}
                        title="Buka Preview Klien"
                      >
                        <Eye size={14} /> Preview
                      </button>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(`${window.location.origin}/?p=${project.slug}`, project.id)}
                        className="pill-btn"
                        style={{
                          height: '36px',
                          padding: '0 12px',
                          backgroundColor: '#1E1E2F',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          gap: '5px',
                        }}
                        title="Salin Link Klien"
                      >
                        {copiedSlug === project.id ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                        {copiedSlug === project.id ? 'Tersalin' : 'Link'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleProjectLock(project.id, project.locked)}
                        className="pill-btn"
                        style={{
                          height: '36px',
                          padding: '0 12px',
                          backgroundColor: '#1E1E2F',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: project.locked ? '#F87171' : '#34D399',
                          fontSize: '12px',
                          gap: '5px',
                        }}
                        title={project.locked ? 'Buka Kunci Galeri' : 'Kunci Galeri'}
                      >
                        {project.locked ? <Unlock size={14} /> : <Lock size={14} />}
                        {project.locked ? 'Buka Kunci' : 'Kunci'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleProjectWatermark(project.id, project.has_watermark)}
                        className="pill-btn"
                        style={{
                          height: '36px',
                          padding: '0 10px',
                          backgroundColor: '#1E1E2F',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: project.has_watermark ? '#60A5FA' : '#8E8E9F',
                          fontSize: '12px',
                        }}
                        title="Toggle Watermark"
                      >
                        WM: {project.has_watermark ? 'ON' : 'OFF'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProject(project.id, project.client_name)}
                        className="pill-btn"
                        style={{
                          height: '36px',
                          padding: '0 10px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: '#EF4444',
                        }}
                        title="Hapus Proyek"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 4: ANNOUNCEMENT
            ============================================================== */}
        {tab === 'announcement' && (
          <div
            style={{
              maxWidth: '680px',
              backgroundColor: '#13131E',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '24px',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
              Pengumuman Global (Broadcast Banner)
            </h3>
            <p style={{ fontSize: '13px', color: '#8E8E9F', marginBottom: '20px', lineHeight: 1.5 }}>
              Pesan ini akan ditampilkan sebagai pita pengumuman di atas dashboard seluruh fotografer yang login.
            </p>

            <form onSubmit={handleSaveAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Active Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: '#1A1A28',
                }}
              >
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>Status Banner</span>
                  <span style={{ fontSize: '12px', color: '#8E8E9F', display: 'block' }}>
                    {announcementDraft.active ? 'Banner aktif tampil ke semua fotografer' : 'Banner nonaktif (tersembunyi)'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={announcementDraft.active}
                  onChange={(e) => setAnnouncementDraft((prev) => ({ ...prev, active: e.target.checked }))}
                  style={{ width: '22px', height: '22px', cursor: 'pointer' }}
                />
              </div>

              {/* Message */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#FFFFFF' }}>
                  Isi Pesan Pengumuman
                </label>
                <textarea
                  required={announcementDraft.active}
                  rows={3}
                  maxLength={280}
                  placeholder="Misal: Perawatan server dijadwalkan malam ini pukul 01:00 WIB. Terima kasih."
                  value={announcementDraft.message}
                  onChange={(e) => setAnnouncementDraft((prev) => ({ ...prev, message: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#1A1A28',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    fontSize: '16px',
                    outline: 'none',
                    lineHeight: 1.5,
                  }}
                />
                <span style={{ fontSize: '11px', color: '#6A6A80' }}>Maksimal 280 karakter.</span>
              </div>

              {/* Tone */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#FFFFFF' }}>
                  Warna & Tipe Banner
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['info', 'warning', 'success'] as AnnouncementTone[]).map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setAnnouncementDraft((prev) => ({ ...prev, tone }))}
                      style={{
                        flex: 1,
                        height: '38px',
                        borderRadius: '10px',
                        border: announcementDraft.tone === tone ? '2px solid #FF2D55' : '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor:
                          tone === 'info' ? 'rgba(59, 130, 246, 0.15)' : tone === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: tone === 'info' ? '#60A5FA' : tone === 'warning' ? '#FBBF24' : '#34D399',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview */}
              {announcementDraft.message && (
                <div style={{ marginTop: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#8E8E9F', marginBottom: '6px', display: 'block' }}>Preview Tampilan:</span>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      backgroundColor:
                        announcementDraft.tone === 'info' ? '#EFF6FF' : announcementDraft.tone === 'warning' ? '#FFFBEB' : '#ECFDF5',
                      border:
                        announcementDraft.tone === 'info' ? '1px solid #BFDBFE' : announcementDraft.tone === 'warning' ? '1px solid #FDE68A' : '1px solid #A7F3D0',
                      color:
                        announcementDraft.tone === 'info' ? '#1E40AF' : announcementDraft.tone === 'warning' ? '#92400E' : '#065F46',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Megaphone size={16} />
                    <span>{announcementDraft.message}</span>
                  </div>
                </div>
              )}

              {announcementSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34D399', fontSize: '13px', fontWeight: 600 }}>
                  <CheckCircle2 size={16} /> Pengumuman berhasil disimpan dan aktif!
                </div>
              )}

              <button
                type="submit"
                disabled={announcementSaving}
                className="pill-btn"
                style={{
                  height: '46px',
                  backgroundColor: '#FF2D55',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 700,
                  marginTop: '8px',
                }}
              >
                {announcementSaving ? 'Menyimpan...' : 'Simpan & Terapkan Pengumuman'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
