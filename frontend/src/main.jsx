import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Load Google Fonts
const link = document.createElement("link");
link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Inter:wght@400;500;600;700&display=swap";
link.rel = "stylesheet";
document.head.appendChild(link);

// Global styles
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.fontFamily = "'Inter', sans-serif";
document.body.style.backgroundColor = "#0a0e1a";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
