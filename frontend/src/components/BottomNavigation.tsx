import { Link, useLocation } from "react-router-dom";

export const BottomNavigation = () => {
  const location = useLocation();
  
  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Patients", path: "/patients" },
    { label: "History", path: "/history" },
    { label: "Settings", path: "/settings" },
  ];

  return (
    <nav style={{ 
      position: "fixed", 
      bottom: 0, 
      left: 0, 
      right: 0, 
      borderTop: "1px solid #e5e7eb", 
      padding: "10px", 
      display: "flex", 
      justifyContent: "space-around",
      backgroundColor: "white",
      boxShadow: "0 -1px 3px rgba(0,0,0,0.1)"
    }}>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          style={{
            textDecoration: "none",
            color: location.pathname === item.path ? "#3b82f6" : "#6b7280",
            padding: "8px 12px",
            textAlign: "center"
          }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
};