// src/layouts/AuthLayout.jsx
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <main>
      <Outlet />
    </main>
  );
}
