import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
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
