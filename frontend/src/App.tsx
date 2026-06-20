import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import LoggedIn from './pages/LoggedIn'
import Signup from './pages/signup'
import Dashboard from './pages/Dashboard'
import UploadDetails from './pages/UploadDetails'
import AIPipelinePage from './pages/AIPipelinePage'
import Patients from './pages/Patients'
import History from './pages/History'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
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
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
