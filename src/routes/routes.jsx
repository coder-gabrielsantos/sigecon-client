import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../pages/Login/LoginPage.jsx";

import DashboardLayout from "../layouts/DashboardLayout.jsx";
import DashboardPage from "../pages/Dashboard/DashboardPage.jsx";
import ContractsListPage from "../pages/Contracts/ContractsListPage.jsx";

const router = createBrowserRouter([
  // pública
  {
    path: "/login",
    element: <LoginPage/>,
  },

  // internas (sidebar + header)
  {
    path: "/",
    element: <DashboardLayout/>,
    children: [
      {
        path: "dashboard",
        element: <DashboardPage/>,
      },
      {
        path: "contracts",
        element: <ContractsListPage/>,
      },
    ],
  },

  // fallback
  {
    path: "*",
    element: <Navigate to="/dashboard" replace/>,
  },
]);

export default router;
