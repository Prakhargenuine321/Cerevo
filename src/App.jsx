import GATEDashboard from "./GATEDashboard";
import VideoPlayer from "./VideoPlayer";

function App() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  if (path.startsWith('/player')) {
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get('taskId');
    return <VideoPlayer taskId={taskId} />;
  }
  return <GATEDashboard />;
}

export default App;
