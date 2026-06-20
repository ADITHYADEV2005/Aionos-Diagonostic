import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/patient/all")
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch((err) => console.error("Failed to load patients:", err));
  }, []);

  const filteredPatients = patients.filter((patient: any) =>
    `${patient.patientName} ${patient.patientId}`.toLowerCase().includes(query.toLowerCase())
  );

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
            <h1 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#2d3436',
              margin: '0'
            }}>
              Patients
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
        
        {/* Title and Search */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#2d3436',
            margin: '0 0 16px 0'
          }}>
            Patient Directory
          </h2>
          <div style={{
            display: 'flex',
            gap: '12px'
          }}>
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 14px',
                border: '1px solid #E8E3DE',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#2d3436',
                backgroundColor: 'white',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#FF7B6B';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,123,107,0.08)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E8E3DE';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Patient List */}
        {filteredPatients.length === 0 ? (
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
              {patients.length === 0 ? 'No patients found. Upload a scan to start tracking patient data.' : 'No patients match your search.'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '12px'
          }}>
            {filteredPatients.map((patient: any, index: number) => (
              <div
                key={index}
                onClick={() => navigate("/patient-details", { state: { patient } })}
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
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flex: 1
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    backgroundColor: '#FFE8E1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#FF7B6B',
                    flexShrink: 0
                  }}>
                    {getInitials(patient.patientName || 'P')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#2d3436',
                      margin: '0 0 4px 0'
                    }}>
                      {patient.patientName}
                    </p>
                    <p style={{
                      fontSize: '13px',
                      color: '#666666',
                      margin: '0 0 4px 0'
                    }}>
                      ID: {patient.patientId}
                    </p>
                    <p style={{
                      fontSize: '12px',
                      color: '#999999',
                      margin: '0'
                    }}>
                      Last scan: {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div style={{
                  textAlign: 'right',
                  flexShrink: 0
                }}>
                  <div style={{
                    display: 'inline-block',
                    paddingRight: '0px'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#FF7B6B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      View
                    </span>
                  </div>
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
            isActive={true}
            onClick={() => {}}
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

export default Patients;