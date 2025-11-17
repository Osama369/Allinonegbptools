import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ModalProvider } from "./Contexts/ModalContext.jsx";
import GoogleProviderLoader from "./Components/GoogleProviderLoader.jsx";

const root = document.getElementById("root");
if (!root) throw new Error("#root element not found in index.html");

createRoot(root).render(
  <ModalProvider>
    <GoogleProviderLoader clientId={import.meta.env.VITE_CLIENT_ID}>
      <App />
    </GoogleProviderLoader>
  </ModalProvider>
);
