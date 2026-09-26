import Olle from './pages/Olle';
import OlleDetail from './pages/OlleDetail';
import { Routes, Route, Navigate } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import MyTrip from './pages/MyTrip';
import Planner from './pages/Planner';
import PlaceDetail from './pages/PlaceDetail';
import SharedTrip from './pages/SharedTrip';
import Lab from './pages/Lab';
import { loadProfile } from './lib/storage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={loadProfile() ? '/home' : '/onboarding'} replace />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/olle" element={<Olle />} />
      <Route path="/olle/:slug" element={<OlleDetail />} />
      <Route path="/home" element={<Home />} />
      <Route path="/my-trip" element={<MyTrip />} />
      <Route path="/planner" element={<Planner />} />
      <Route path="/place/:id" element={<PlaceDetail />} />
      <Route path="/trip" element={<SharedTrip />} />
      <Route path="/lab" element={<Lab />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
