import { createRoot } from "react-dom/client";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
setBaseUrl(import.meta.env.VITE_API_URL ?? "");
import App from "./App";
import "./index.css";

setAuthTokenGetter(() => {
  try {
    const raw = localStorage.getItem("salon_user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u?.id ? `token-${u.id}` : null;
  } catch { return null; }
});

createRoot(document.getElementById("root")!).render(<App />);
