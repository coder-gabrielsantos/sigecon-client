import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../pages/Login/LoginPage.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import ContractsListPage from "../pages/Contracts/ContractsListPage.jsx";
import ContractDetailPage from "../pages/Contracts/ContractDetailPage.jsx";
import OrdersListPage from "../pages/Orders/OrdersListPage.jsx";
import OrderDetailPage from "../pages/Orders/OrderDetailPage.jsx";
import UserPage from "../pages/User/UserPage.jsx";
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
          // / -> /contracts
          {
            index: true,
            element: <Navigate to="contracts" replace/>,
          },
          {
            path: "contracts",
            element: <ContractsListPage/>,
          },
          {
            path: "contracts/:id",
            element: <ContractDetailPage/>,
          },
          {
            path: "orders",
            element: <OrdersListPage/>,
          },
          {
            path: "orders/:id",
            element: <OrderDetailPage />,
          },
          {
            path: "user",
            element: <UserPage/>,
          },
        ],
      },
    ],
  },

  // Qualquer rota desconhecida joga para /contracts
  {
    path: "*",
    element: <Navigate to="/contracts" replace/>,
  },
]);

export default router;
