import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';

import CandidateProfile from './pages/candidate/Profile';
import BrowseJobs from './pages/candidate/BrowseJobs';
import JobDetails from './pages/candidate/JobDetails';
import MyApplications from './pages/candidate/MyApplications';
import ExploreProducts from './pages/candidate/ExploreProducts';

import CompanySetup from './pages/employer/CompanySetup';
import EmployerDashboard from './pages/employer/Dashboard';
import PostJob from './pages/employer/PostJob';
import ApplicationsDashboard from './pages/employer/ApplicationsDashboard';
import Analytics from './pages/employer/Analytics';

function CandidateNav() {
  return (
    <div className="max-w-6xl mx-auto px-6 pt-6 flex gap-4 text-sm">
      <Link to="/candidate/jobs" className="text-ink-600 hover:text-ink font-medium">Browse jobs</Link>
      <Link to="/candidate/applications" className="text-ink-600 hover:text-ink font-medium">My applications</Link>
      <Link to="/candidate/profile" className="text-ink-600 hover:text-ink font-medium">Profile</Link>
      <Link to="/candidate/explore" className="text-ink-600 hover:text-ink font-medium">Grow your career</Link>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Candidate flow */}
        <Route path="/candidate/jobs" element={
          <ProtectedRoute role="candidate"><CandidateNav /><BrowseJobs /></ProtectedRoute>
        } />
        <Route path="/candidate/jobs/:id" element={<><CandidateNav /><JobDetails /></>} />
        <Route path="/candidate/applications" element={
          <ProtectedRoute role="candidate"><CandidateNav /><MyApplications /></ProtectedRoute>
        } />
        <Route path="/candidate/profile" element={
          <ProtectedRoute role="candidate"><CandidateNav /><CandidateProfile /></ProtectedRoute>
        } />
        <Route path="/candidate/explore" element={
          <ProtectedRoute role="candidate"><CandidateNav /><ExploreProducts /></ProtectedRoute>
        } />

        {/* Employer flow */}
        <Route path="/employer/company-setup" element={
          <ProtectedRoute role="employer"><CompanySetup /></ProtectedRoute>
        } />
        <Route path="/employer/dashboard" element={
          <ProtectedRoute role="employer"><EmployerDashboard /></ProtectedRoute>
        } />
        <Route path="/employer/post-job" element={
          <ProtectedRoute role="employer"><PostJob /></ProtectedRoute>
        } />
        <Route path="/employer/jobs/:jobId/applications" element={
          <ProtectedRoute role="employer"><ApplicationsDashboard /></ProtectedRoute>
        } />
        <Route path="/employer/jobs/:jobId/analytics" element={
          <ProtectedRoute role="employer"><Analytics /></ProtectedRoute>
        } />
      </Routes>
    </>
  );
}
