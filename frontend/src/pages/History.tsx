import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const History = () => {
  const navigate = useNavigate();
  const [scanHistory, setScanHistory] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/patient/history")
      .then((res) => res.json())
      .then((data) => setScanHistory(data))
      .catch((err) => console.error("Failed to load scan history:", err));
  }, []);

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
              History
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
        
        {/* Title */}
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#2d3436',
          margin: '0 0 8px 0'
        }}>
          Scan History
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#666666',
          margin: '0 0 24px 0'
        }}>
          Review your previous diagnostic scans and reports
        </p>

        {/* History List */}
        {scanHistory.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '60px 40px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <p style={{
              fontSize: '16px',
              color: '#999999',
              margin: '0'
            }}>
              No scan history available. Run a scan to see it displayed here.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '12px'
          }}>
            {scanHistory.map((scan: any, index: number) => (
              <div
                key={index}
                onClick={() => navigate("/final-report", {
                  state: {
                    patientName: scan.patientName,
                    patientId: scan.patientId,
                    organ: scan.organ,
                    images: {
                      bmode: scan.bmode_png_b64 ? `data:image/png;base64,${scan.bmode_png_b64}` : null,
                      doppler: scan.doppler_png_b64 ? `data:image/png;base64,${scan.doppler_png_b64}` : null,
                      elast: scan.elast_png_b64 ? `data:image/png;base64,${scan.elast_png_b64}` : null,
                      mask: scan.mask_png_b64 ? `data:image/png;base64,${scan.mask_png_b64}` : null,
                    },
                    summary: JSON.stringify(scan.summary),
                  },
                })}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
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
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#2d3436',
                      margin: '0'
                    }}>
                      {scan.patientName}
                    </p>
                    <div style={{
                      display: 'inline-block',
                      paddingX: '8px',
                      paddingY: '4px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: scan.scanStatus === "Completed" ? '#e8f5e9' : '#fff3e0',
                      color: scan.scanStatus === "Completed" ? '#2e7d32' : '#e65100'
                    }}>
                      {scan.scanStatus || "Completed"}
                    </div>
                  </div>
                  <p style={{
                    fontSize: '13px',
                    color: '#666666',
                    margin: '0 0 4px 0'
                  }}>
                    {scan.organ || "Ultrasound Scan"}
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: '#999999',
                    margin: '0'
                  }}>
                    {new Date(scan.createdAt).toLocaleDateString()} - {scan._id}
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '8px'
                }}>
                  <button
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '12px',
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
                    Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
            isActive={true}
            onClick={() => {}}
          />
          <NavButton
            label="Settings"
            isActive={false}
            onClick={() => navigate('/settings')}
          />
        </div>
      </div>
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

export default History;