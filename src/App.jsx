import GATEDashboard from "./GATEDashboard";
import VideoPlayer from "./VideoPlayer";
import Login from "../src/components/auth/Login";
import Register from "../src/components/auth/Register";
import ProfilePage from "./ProfilePage";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  if (path.startsWith('/player')) {
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get('taskId');
    return <VideoPlayer taskId={taskId} />;
  }
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/dashboard" element={<GATEDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
