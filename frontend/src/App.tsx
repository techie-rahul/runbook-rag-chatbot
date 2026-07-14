import { Routes, Route } from "react-router-dom";

import Chat from "./pages/Chat";
import KnowledgeGraph from "./pages/KnowledgeGraph";
import Runbooks from "./pages/Runbooks";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Chat />} />
      <Route path="/graph" element={<KnowledgeGraph />} />
      <Route path="/runbooks" element={<Runbooks />} />
    </Routes>
  );
}

export default App;