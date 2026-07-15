import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import LoggedIn from './pages/LoggedIn'
import Signup from './pages/signup'
import Dashboard from './pages/Dashboard'
import UploadDetails from './pages/UploadDetails'
import AIPipelinePage from './pages/AIPipelinePage'
import Patients from './pages/Patients'
import PatientDetail from './pages/PatientDetail'
import DeviceConnect from './pages/DeviceConnect'
import Viewer3D from './pages/Viewer3D'
import Viewer4D from './pages/Viewer4D'
import History from './pages/History'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import FinalReportPage from './pages/FinalReport'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/loggedin" element={<LoggedIn />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload-details" element={<UploadDetails />} />
        <Route path="/ai-pipeline" element={<AIPipelinePage />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patient-details" element={<PatientDetail />} />
        <Route path="/device-connect" element={<DeviceConnect />} />
        <Route path="/view-3d" element={<Viewer3D />} />
        <Route path="/view-4d" element={<Viewer4D />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/final-report" element={<FinalReportPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
