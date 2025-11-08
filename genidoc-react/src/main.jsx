import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import IndeReact from "./IndeReact.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <IndeReact />
  </StrictMode>
);
