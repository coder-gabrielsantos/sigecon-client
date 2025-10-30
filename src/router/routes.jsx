import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../pages/Login/LoginPage.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import DashboardPage from "../pages/Dashboard/DashboardPage.jsx";
import ContractsListPage from "../pages/Contracts/ContractsListPage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage/> },

  {
    path: "/",
    element: <ProtectedRoute/>,          // <— guarda
    children: [
      {
        element: <DashboardLayout/>,     // layout interno
        children: [
          { path: "dashboard", element: <DashboardPage/> },
          { path: "contracts", element: <ContractsListPage/> },
        ],
      },
    ],
  },

  { path: "/", element: <Navigate to="/dashboard" replace/> },
  { path: "*", element: <Navigate to="/dashboard" replace/> },
]);

export default router;
