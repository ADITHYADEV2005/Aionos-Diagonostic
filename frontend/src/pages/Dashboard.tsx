import React, { useState, useEffect, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [recentPatients, setRecentPatients] = useState([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate("/LoggedIn");
    }

    fetch("http://localhost:5000/api/patient/recent")
      .then((response) => response.json())
      .then((data) => setRecentPatients(data))
      .catch((error) => {
        console.error("Failed to load recent patients:", error);
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/LoggedIn");
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      navigate("/upload-details", { state: { file } });
    }
  };

  const getInitials = (name: string): string =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

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
            <div>
              <h1 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#2d3436',
                margin: '0'
              }}>
                AIONOS
              </h1>
              <p style={{
                fontSize: '11px',
                color: '#FF7B6B',
                margin: '2px 0 0 0',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Diagnostics
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
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
              e.currentTarget.style.backgroundColor = '#ff7b6b';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = '#FF7B6B';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
              e.currentTarget.style.color = '#2d3436';
              e.currentTarget.style.borderColor = '#e0e0e0';
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 20px'
      }}>
        
        {/* User Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '32px',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
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
            color: '#FF7B6B',
            flexShrink: 0
          }}>
            {user ? getInitials(user.name) : 'US'}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#2d3436',
              margin: '0 0 4px 0'
            }}>
              {user ? user.name : 'Loading...'}
            </h2>
            <p style={{
              fontSize: '13px',
              color: '#666666',
              margin: '0'
            }}>
              {user ? user.email : 'Fetching...'}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {/* New Scan Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px 16px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,123,107,0.15)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          >
            <div style={{
              fontSize: '32px',
              marginBottom: '12px'
            }}>
              +
            </div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#2d3436',
              margin: '0 0 8px 0'
            }}>
              New Scan
            </h3>
            <p style={{
              fontSize: '12px',
              color: '#666666',
              margin: '0'
            }}>
              Start diagnostic scan
            </p>
          </div>

          {/* Upload Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px 16px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,123,107,0.15)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          onClick={() => document.getElementById('fileInput')?.click()}
          >
            <div style={{
              fontSize: '32px',
              marginBottom: '12px'
            }}>
              ^
            </div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#2d3436',
              margin: '0 0 8px 0'
            }}>
              Upload File
            </h3>
            <p style={{
              fontSize: '12px',
              color: '#666666',
              margin: '0'
            }}>
              Import files
            </p>
          </div>

          {/* Patients Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px 16px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,123,107,0.15)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          onClick={() => navigate('/patients')}
          >
            <div style={{
              fontSize: '32px',
              marginBottom: '12px'
            }}>
              P
            </div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#2d3436',
              margin: '0 0 8px 0'
            }}>
              Patients
            </h3>
            <p style={{
              fontSize: '12px',
              color: '#666666',
              margin: '0'
            }}>
              Patient list
            </p>
          </div>

          {/* History Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px 16px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,123,107,0.15)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          onClick={() => navigate('/history')}
          >
            <div style={{
              fontSize: '32px',
              marginBottom: '12px'
            }}>
              H
            </div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#2d3436',
              margin: '0 0 8px 0'
            }}>
              History
            </h3>
            <p style={{
              fontSize: '12px',
              color: '#666666',
              margin: '0'
            }}>
              Scan history
            </p>
          </div>
        </div>

        {/* Recent Scans Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#2d3436',
            margin: '0 0 16px 0'
          }}>
            Recent Scans
          </h2>
          {recentPatients.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: '#999999'
            }}>
              <p style={{
                fontSize: '14px',
                margin: '0'
              }}>
                No scans yet. Upload a scan or connect a device to begin.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '8px'
            }}>
              {recentPatients.map((patient: any, index: number) => (
                <div
                  key={index}
                  style={{
                    padding: '12px 16px',
                    borderBottom: index < recentPatients.length - 1 ? '1px solid #f0f0f0' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9f9f9';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: '#FFE8E1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#FF7B6B',
                    flexShrink: 0
                  }}>
                    {getInitials(patient.patientName || 'P')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#2d3436',
                      margin: '0 0 2px 0'
                    }}>
                      {patient.patientName || 'Patient'}
                    </p>
                    <p style={{
                      fontSize: '12px',
                      color: '#666666',
                      margin: '0'
                    }}>
                      {patient.organ || 'Diagnostic Scan'}
                    </p>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#999999'
                  }}>
                    {new Date(patient.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
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
            isActive={true}
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
            isActive={false}
            onClick={() => navigate('/settings')}
          />
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        id="fileInput"
        type="file"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        accept="image/*,.dcm"
      />
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

export default Dashboard;
