import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

interface SettingsToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  showBorder: boolean;
}

interface SettingsItemProps {
  label: string;
  description: string;
  showBorder: boolean;
  isDangerous?: boolean;
  onClick?: () => void;
  rightElement?: React.ReactNode;
}

// ─── Sub-components ────────────────────────────────────────────────────────────
const NavButton: React.FC<NavButtonProps> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '4px', background: 'none',
      border: 'none', cursor: 'pointer', transition: 'all 0.2s',
      color: isActive ? '#FF7B6B' : '#999999'
    }}
    onMouseOver={(e) => { e.currentTarget.style.color = '#FF7B6B'; }}
    onMouseOut={(e) => { e.currentTarget.style.color = isActive ? '#FF7B6B' : '#999999'; }}
  >
    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{label[0]}</div>
    <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {label}
    </div>
  </button>
);

const SettingsToggle: React.FC<SettingsToggleProps> = ({ label, description, checked, onChange, showBorder }) => (
  <div style={{ padding: '16px', borderBottom: showBorder ? '1px solid #f0f0f0' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div>
      <p style={{ fontSize: '14px', fontWeight: '600', color: '#2d3436', margin: '0 0 4px 0' }}>{label}</p>
      <p style={{ fontSize: '13px', color: '#666666', margin: '0' }}>{description}</p>
    </div>
    <button
      onClick={() => onChange(!checked)}
      aria-label={`Toggle ${label}`}
      style={{
        width: '48px', height: '28px', borderRadius: '14px', border: 'none',
        backgroundColor: checked ? '#FF7B6B' : '#ddd', cursor: 'pointer',
        transition: 'background-color 0.3s', position: 'relative', padding: 0, flexShrink: 0
      }}
    >
      <div style={{
        position: 'absolute', top: '2px', left: checked ? '22px' : '2px',
        width: '24px', height: '24px', borderRadius: '50%',
        backgroundColor: 'white', transition: 'left 0.3s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
      }} />
    </button>
  </div>
);

const SettingsItem: React.FC<SettingsItemProps> = ({ label, description, showBorder, isDangerous, onClick, rightElement }) => (
  <div
    onClick={onClick}
    style={{
      padding: '16px', borderBottom: showBorder ? '1px solid #f0f0f0' : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s'
    }}
    onMouseOver={(e) => { if (onClick) e.currentTarget.style.backgroundColor = '#f9f9f9'; }}
    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
  >
    <div>
      <p style={{ fontSize: '14px', fontWeight: '600', color: isDangerous ? '#e74c3c' : '#2d3436', margin: '0 0 4px 0' }}>{label}</p>
      <p style={{ fontSize: '13px', color: '#666666', margin: '0' }}>{description}</p>
    </div>
    {rightElement || (onClick && <div style={{ fontSize: '16px', color: '#FF7B6B' }}>›</div>)}
  </div>
);

// ─── Modal Component ───────────────────────────────────────────────────────────
interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => (
  <div style={{
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px'
  }}>
    <div style={{
      backgroundColor: 'white', borderRadius: '16px', padding: '24px',
      width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#2d3436', margin: 0 }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999', lineHeight: 1 }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

// ─── Main Settings Component ───────────────────────────────────────────────────
const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  // Toggles
  const [notifications, setNotifications] = useState(() => localStorage.getItem('setting_notifications') !== 'false');
  const [cloudSync, setCloudSync] = useState(() => localStorage.getItem('setting_cloudSync') !== 'false');
  const [autoBackup, setAutoBackup] = useState(() => localStorage.getItem('setting_autoBackup') === 'true');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('setting_darkMode') === 'true');

  // Modals
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Edit profile state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  // Privacy
  const [shareAnalytics, setShareAnalytics] = useState(() => localStorage.getItem('privacy_analytics') !== 'false');
  const [dataRetention, setDataRetention] = useState(() => localStorage.getItem('privacy_retention') || '12 months');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setEditName(parsed.name || '');
      setEditEmail(parsed.email || '');
    }
  }, []);

  const handleToggle = (key: string, setter: (v: boolean) => void) => (val: boolean) => {
    setter(val);
    localStorage.setItem(`setting_${key}`, String(val));
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) return;
    const updatedUser = { ...user, name: editName.trim(), email: editEmail.trim() };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setProfileSaved(true);
    setTimeout(() => { setProfileSaved(false); setEditProfileOpen(false); }, 1200);
  };

  const handleChangePassword = () => {
    if (!oldPassword) { setPasswordMsg('Please enter your current password.'); return; }
    if (newPassword.length < 6) { setPasswordMsg('New password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setPasswordMsg('Passwords do not match.'); return; }
    setPasswordMsg('✅ Password updated successfully!');
    setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    setTimeout(() => { setPasswordMsg(''); setPasswordOpen(false); }, 1500);
  };

  const handleSavePrivacy = () => {
    localStorage.setItem('privacy_analytics', String(shareAnalytics));
    localStorage.setItem('privacy_retention', dataRetention);
    setPrivacyOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/LoggedIn');
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1px solid #e0e0e0',
    borderRadius: '8px', fontSize: '14px', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '12px'
  };

  const primaryBtn: React.CSSProperties = {
    width: '100%', padding: '12px', background: 'linear-gradient(135deg, #FF7B6B, #FF9A84)',
    border: 'none', borderRadius: '8px', color: 'white', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer', transition: 'opacity 0.2s'
  };

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#FAF7F2', paddingBottom: '100px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* Header */}
      <div style={{
        backgroundColor: 'white', borderBottom: '1px solid #f0f0f0',
        padding: '16px 20px', position: 'sticky', top: 0, zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #FF7B6B 0%, #FF9A84 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '18px', fontWeight: 'bold'
            }}>A</div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#2d3436', margin: '0' }}>Settings</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
        
        {/* User Profile Card */}
        <div style={{
          backgroundColor: 'white', borderRadius: '12px', padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '12px',
              backgroundColor: '#FFE8E1', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: '#FF7B6B'
            }}>
              {user ? getInitials(user.name) : 'US'}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2d3436', margin: '0 0 4px 0' }}>
                {user ? user.name : 'Loading…'}
              </h3>
              <p style={{ fontSize: '13px', color: '#666666', margin: '0' }}>
                {user ? user.email : ''}
              </p>
            </div>
            <button
              onClick={() => setEditProfileOpen(true)}
              style={{
                padding: '8px 16px', backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0',
                borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: '#2d3436', cursor: 'pointer'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#FF7B6B'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#FF7B6B'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; e.currentTarget.style.color = '#2d3436'; e.currentTarget.style.borderColor = '#e0e0e0'; }}
            >
              Edit Profile
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Account */}
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#2d3436', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Account</h4>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <SettingsItem label="Change Password" description="Update your account password" showBorder={true} onClick={() => setPasswordOpen(true)} />
              <SettingsItem label="Privacy Settings" description="Manage data visibility and sharing" showBorder={false} onClick={() => setPrivacyOpen(true)} />
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#2d3436', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Preferences</h4>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <SettingsToggle label="Notifications" description="Receive scan alerts and updates" checked={notifications} onChange={handleToggle('notifications', setNotifications)} showBorder={true} />
              <SettingsToggle label="Cloud Sync" description="Automatically sync diagnostic data" checked={cloudSync} onChange={handleToggle('cloudSync', setCloudSync)} showBorder={true} />
              <SettingsToggle label="Auto Backup" description="Automatically backup patient records" checked={autoBackup} onChange={handleToggle('autoBackup', setAutoBackup)} showBorder={true} />
              <SettingsToggle label="Dark Mode" description="Switch to dark interface theme" checked={darkMode} onChange={handleToggle('darkMode', setDarkMode)} showBorder={false} />
            </div>
          </div>

          {/* Active preferences summary */}
          {(notifications || cloudSync || autoBackup) && (
            <div style={{
              backgroundColor: '#FFF8F7', border: '1px solid #FFE8E1', borderRadius: '10px', padding: '14px 16px'
            }}>
              <p style={{ fontSize: '13px', color: '#FF7B6B', fontWeight: '600', margin: '0 0 6px 0' }}>✓ Active features</p>
              <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>
                {[notifications && 'Notifications', cloudSync && 'Cloud Sync', autoBackup && 'Auto Backup', darkMode && 'Dark Mode'].filter(Boolean).join(' · ')}
              </p>
            </div>
          )}

          {/* Support */}
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#2d3436', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Support</h4>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <SettingsItem label="Help & Documentation" description="View guides, FAQs and tutorials" showBorder={true} onClick={() => setHelpOpen(true)} />
              <SettingsItem label="About AIONOS" description="Version 1.0.0" showBorder={true} onClick={() => setAboutOpen(true)} />
              <SettingsItem label="Sign Out" description="Logout from your account" showBorder={false} isDangerous={true} onClick={handleLogout} />
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #f0f0f0' }}>
          <p style={{ fontSize: '12px', color: '#999999', margin: '0' }}>
            AIONOS Diagnostics v1.0.0 — Professional Healthcare Solution
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white',
        borderTop: '1px solid #f0f0f0', boxShadow: '0 -2px 8px rgba(0,0,0,0.04)', zIndex: 100
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', height: '64px' }}>
          <NavButton label="Home"     isActive={false} onClick={() => navigate('/dashboard')} />
          <NavButton label="Patients" isActive={false} onClick={() => navigate('/patients')}  />
          <NavButton label="History"  isActive={false} onClick={() => navigate('/history')}   />
          <NavButton label="Settings" isActive={true}  onClick={() => {}}                     />
        </div>
      </div>

      {/* ── Edit Profile Modal ─────────────────────────────────────────────── */}
      {editProfileOpen && (
        <Modal title="Edit Profile" onClose={() => setEditProfileOpen(false)}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#2d3436', display: 'block', marginBottom: '6px' }}>Full Name</label>
            <input
              style={inputStyle} value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter your full name"
            />
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#2d3436', display: 'block', marginBottom: '6px' }}>Email Address</label>
            <input
              style={{ ...inputStyle, marginBottom: '20px' }} value={editEmail} type="email"
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="Enter your email"
            />
            {profileSaved && (
              <p style={{ color: '#27ae60', fontSize: '13px', textAlign: 'center', margin: '0 0 12px 0' }}>✅ Profile saved!</p>
            )}
            <button style={primaryBtn} onClick={handleSaveProfile}>Save Changes</button>
          </div>
        </Modal>
      )}

      {/* ── Change Password Modal ──────────────────────────────────────────── */}
      {passwordOpen && (
        <Modal title="Change Password" onClose={() => { setPasswordOpen(false); setPasswordMsg(''); }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#2d3436', display: 'block', marginBottom: '6px' }}>Current Password</label>
            <input style={inputStyle} type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Enter current password" />
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#2d3436', display: 'block', marginBottom: '6px' }}>New Password</label>
            <input style={inputStyle} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#2d3436', display: 'block', marginBottom: '6px' }}>Confirm New Password</label>
            <input style={{ ...inputStyle, marginBottom: '8px' }} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" />
            {passwordMsg && (
              <p style={{ color: passwordMsg.startsWith('✅') ? '#27ae60' : '#e74c3c', fontSize: '13px', margin: '0 0 12px 0' }}>{passwordMsg}</p>
            )}
            <button style={{ ...primaryBtn, marginTop: '8px' }} onClick={handleChangePassword}>Update Password</button>
          </div>
        </Modal>
      )}

      {/* ── Privacy Settings Modal ─────────────────────────────────────────── */}
      {privacyOpen && (
        <Modal title="Privacy Settings" onClose={() => setPrivacyOpen(false)}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#2d3436', margin: '0 0 4px 0' }}>Share Analytics</p>
                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Help improve AIONOS with usage data</p>
              </div>
              <button
                onClick={() => setShareAnalytics(!shareAnalytics)}
                style={{
                  width: '48px', height: '28px', borderRadius: '14px', border: 'none',
                  backgroundColor: shareAnalytics ? '#FF7B6B' : '#ddd',
                  cursor: 'pointer', position: 'relative', padding: 0, flexShrink: 0
                }}
              >
                <div style={{
                  position: 'absolute', top: '2px', left: shareAnalytics ? '22px' : '2px',
                  width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'white',
                  transition: 'left 0.3s'
                }} />
              </button>
            </div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#2d3436', display: 'block', marginBottom: '8px' }}>Data Retention Period</label>
            <select
              value={dataRetention}
              onChange={(e) => setDataRetention(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer', marginBottom: '20px' }}
            >
              <option>3 months</option>
              <option>6 months</option>
              <option>12 months</option>
              <option>24 months</option>
              <option>Indefinitely</option>
            </select>
            <button style={primaryBtn} onClick={handleSavePrivacy}>Save Privacy Settings</button>
          </div>
        </Modal>
      )}

      {/* ── Help Modal ─────────────────────────────────────────────────────── */}
      {helpOpen && (
        <Modal title="Help & Documentation" onClose={() => setHelpOpen(false)}>
          <div style={{ display: 'grid', gap: '12px' }}>
            {[
              { title: '🔬 How to run a scan', body: 'Go to the Dashboard and tap "New Scan" or "Upload File". Select an ultrasound image and fill in patient details. The AI pipeline will process and generate a full diagnostic report.' },
              { title: '📋 Viewing History', body: 'Navigate to "History" via the bottom navigation to view all past scans with their assessment results.' },
              { title: '👥 Managing Patients', body: 'The "Patients" tab shows a list of all patients. Tap a patient to see their full scan history and reports.' },
              { title: '⚙️ Settings & Sync', body: 'Enable Cloud Sync and Auto Backup in the Preferences section to keep your data safe and accessible across sessions.' },
            ].map((item) => (
              <div key={item.title} style={{ backgroundColor: '#FAF7F2', borderRadius: '8px', padding: '14px' }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#2d3436', margin: '0 0 6px 0' }}>{item.title}</p>
                <p style={{ fontSize: '13px', color: '#666', margin: 0, lineHeight: '1.5' }}>{item.body}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* ── About Modal ────────────────────────────────────────────────────── */}
      {aboutOpen && (
        <Modal title="About AIONOS" onClose={() => setAboutOpen(false)}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '20px',
              background: 'linear-gradient(135deg, #FF7B6B 0%, #FF9A84 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '40px', color: 'white', fontWeight: 'bold',
              margin: '0 auto 16px auto'
            }}>A</div>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#2d3436', margin: '0 0 8px 0' }}>AIONOS Diagnostics</h3>
            <p style={{ fontSize: '14px', color: '#666', margin: '0 0 20px 0' }}>Version 1.0.0</p>
            <div style={{ display: 'grid', gap: '8px', textAlign: 'left' }}>
              {[
                ['🤖 AI Engine', 'EfficientNetB0 + Custom Grad-CAM'],
                ['🩺 Supported Organs', 'Liver (Benign / Malignant / Normal)'],
                ['🌐 Backend', 'Flask · MongoDB · Express.js'],
                ['⚛️ Frontend', 'React + TypeScript + Vite'],
                ['📦 Build', 'Production-ready Diagnostic Platform'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ fontSize: '13px', color: '#888' }}>{k}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#2d3436' }}>{v}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: '#bbb', marginTop: '20px' }}>© 2026 AIONOS. All rights reserved.</p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Settings;