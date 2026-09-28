import { Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Exercises from "./pages/Exercises";
import ExerciseReview from "./pages/ExerciseReview";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<Home />} />
      <Route path="/chat/:id" element={<Chat />} />
      <Route path="/chat/:id/view" element={<Chat readOnly />} />
      <Route path="/exercises/:id" element={<Exercises />} />
      <Route path="/exercises/:id/review" element={<ExerciseReview />} />
    </Routes>
  );
}
