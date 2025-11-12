import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../pages/Login/LoginPage.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import DashboardPage from "../pages/Dashboard/DashboardPage.jsx";
import ContractsListPage from "../pages/Contracts/ContractsListPage.jsx";
import ContractDetailPage from "../pages/Contracts/ContractDetailPage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

const router = createBrowserRouter([
  // Login público
  {
    path: "/login",
    element: <LoginPage/>,
  },

  // Área protegida
  {
    path: "/",
    element: <ProtectedRoute/>,
    children: [
      {
        element: <DashboardLayout/>,
        children: [
          // / -> /dashboard
          {
            index: true,
            element: <Navigate to="dashboard" replace/>,
          },
          {
            path: "dashboard",
            element: <DashboardPage/>,
          },
          {
            path: "contracts",
            element: <ContractsListPage/>,
          },
          {
            path: "contracts/:id",
            element: <ContractDetailPage/>,
          },
        ],
      },
    ],
  },

  // Qualquer rota desconhecida joga para /dashboard (protegido)
  {
    path: "*",
    element: <Navigate to="/dashboard" replace/>,
  },
]);

export default router;
