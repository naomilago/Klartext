import { Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Exercises from "./pages/Exercises";
import ExerciseReview from "./pages/ExerciseReview";
import Report from "./pages/Report";
import Vocabulary from "./pages/Vocabulary";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<Home />} />
      <Route path="/chat/:id" element={<Chat />} />
      <Route path="/chat/:id/view" element={<Chat readOnly />} />
      <Route path="/exercises/:id" element={<Exercises />} />
      <Route path="/exercises/:id/review" element={<ExerciseReview />} />
      <Route path="/report" element={<Report />} />
      <Route path="/vocabulario" element={<Vocabulary />} />
    </Routes>
  );
}
