import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [cloudSync, setCloudSync] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/LoggedIn");
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAF7F2',
      paddingBottom: '100px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #f0f0f0',
        padding: '16px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #FF7B6B 0%, #FF9A84 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              A
            </div>
            <h1 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#2d3436',
              margin: '0'
            }}>
              Settings
            </h1>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#2d3436',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#FF7B6B';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = '#FF7B6B';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
              e.currentTarget.style.color = '#2d3436';
              e.currentTarget.style.borderColor = '#e0e0e0';
            }}
          >
            Back
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 20px'
      }}>
        
        {/* User Profile */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '12px',
              backgroundColor: '#FFE8E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#FF7B6B'
            }}>
              DR
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#2d3436',
                margin: '0 0 4px 0'
              }}>
                Dr. Healthcare Professional
              </h3>
              <p style={{
                fontSize: '13px',
                color: '#666666',
                margin: '0'
              }}>
                doctor@example.com
              </p>
            </div>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#2d3436',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#FF7B6B';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = '#FF7B6B';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
                e.currentTarget.style.color = '#2d3436';
                e.currentTarget.style.borderColor = '#e0e0e0';
              }}
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Settings Sections */}
        <div style={{ display: 'grid', gap: '16px' }}>
          
          {/* Account Settings */}
          <div>
            <h4 style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#2d3436',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '12px'
            }}>
              Account
            </h4>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              overflow: 'hidden'
            }}>
              <SettingsItem label="Password" description="Change your password" showBorder={true} />
              <SettingsItem label="Privacy Settings" description="Manage data visibility" showBorder={false} />
            </div>
          </div>

          {/* Data & Storage */}
          <div>
            <h4 style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#2d3436',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '12px'
            }}>
              Data & Storage
            </h4>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              overflow: 'hidden'
            }}>
              <SettingsToggle
                label="Notifications"
                description="Receive scan alerts and updates"
                checked={notifications}
                onChange={setNotifications}
                showBorder={true}
              />
              <SettingsToggle
                label="Cloud Sync"
                description="Automatically sync diagnostic data"
                checked={cloudSync}
                onChange={setCloudSync}
                showBorder={true}
              />
              <SettingsToggle
                label="Auto Backup"
                description="Automatically backup patient records"
                checked={autoBackup}
                onChange={setAutoBackup}
                showBorder={false}
              />
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#2d3436',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '12px'
            }}>
              Support
            </h4>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              overflow: 'hidden'
            }}>
              <SettingsItem label="Help & Documentation" description="View guides and FAQs" showBorder={true} />
              <SettingsItem label="About AIONOS" description="Version 1.0.0" showBorder={true} />
              <SettingsItem
                label="Sign Out"
                description="Logout from your account"
                showBorder={false}
                isDangerous={true}
                onClick={handleLogout}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '40px',
          paddingTop: '24px',
          borderTop: '1px solid #f0f0f0'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#999999',
            margin: '0'
          }}>
            AIONOS Diagnostics v1.0.0 - Professional Healthcare Solution
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTop: '1px solid #f0f0f0',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.04)',
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          height: '64px'
        }}>
          <NavButton
            label="Home"
            isActive={false}
            onClick={() => navigate('/dashboard')}
          />
          <NavButton
            label="Patients"
            isActive={false}
            onClick={() => navigate('/patients')}
          />
          <NavButton
            label="History"
            isActive={false}
            onClick={() => navigate('/history')}
          />
          <NavButton
            label="Settings"
            isActive={true}
            onClick={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

interface SettingsItemProps {
  label: string;
  description: string;
  showBorder: boolean;
  isDangerous?: boolean;
  onClick?: () => void;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ label, description, showBorder, isDangerous, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px',
        borderBottom: showBorder ? '1px solid #f0f0f0' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s'
      }}
      onMouseOver={(e) => {
        if (onClick) {
          e.currentTarget.style.backgroundColor = '#f9f9f9';
        }
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div>
        <p style={{
          fontSize: '14px',
          fontWeight: '600',
          color: isDangerous ? '#d9534f' : '#2d3436',
          margin: '0 0 4px 0'
        }}>
          {label}
        </p>
        <p style={{
          fontSize: '13px',
          color: '#666666',
          margin: '0'
        }}>
          {description}
        </p>
      </div>
      {onClick && (
        <div style={{
          fontSize: '14px',
          color: '#FF7B6B'
        }}>
          →
        </div>
      )}
    </div>
  );
};

interface SettingsToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  showBorder: boolean;
}

const SettingsToggle: React.FC<SettingsToggleProps> = ({ label, description, checked, onChange, showBorder }) => {
  return (
    <div
      style={{
        padding: '16px',
        borderBottom: showBorder ? '1px solid #f0f0f0' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <div>
        <p style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#2d3436',
          margin: '0 0 4px 0'
        }}>
          {label}
        </p>
        <p style={{
          fontSize: '13px',
          color: '#666666',
          margin: '0'
        }}>
          {description}
        </p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: '48px',
          height: '28px',
          borderRadius: '14px',
          border: 'none',
          backgroundColor: checked ? '#FF7B6B' : '#ddd',
          cursor: 'pointer',
          transition: 'all 0.3s',
          position: 'relative',
          padding: 0
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '24px' : '2px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'white',
            transition: 'all 0.3s'
          }}
        />
      </button>
    </div>
  );
};

interface NavButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
        color: isActive ? '#FF7B6B' : '#999999'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.color = '#FF7B6B';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.color = isActive ? '#FF7B6B' : '#999999';
      }}
    >
      <div style={{
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        {label[0]}
      </div>
      <div style={{
        fontSize: '11px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {label}
      </div>
    </button>
  );
};

export default Settings;