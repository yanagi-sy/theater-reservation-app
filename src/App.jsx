import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
} from "react-router-dom";

import HomePage from "./pages/HomePage";
import CalendarPage from "./pages/CalendarPage";
import StageListPage from "./pages/StageListPage";
import StageDetailPage from "./pages/StageDetailPage";
import ReservePage from "./pages/ReservePage";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<HomePage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/stages" element={<StageListPage />} />
      <Route path="/stages/:id" element={<StageDetailPage />} />
      <Route path="/reserve/:scheduleId" element={<ReservePage />} />
    </>
  )
);

export default function App() {
  return <RouterProvider router={router} />;
}
