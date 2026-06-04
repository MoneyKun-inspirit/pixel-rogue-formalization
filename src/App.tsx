import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "@/pages/Home";
import RunPage from "@/pages/RunPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/run" element={<RunPage />} />
      </Routes>
    </Router>
  );
}
