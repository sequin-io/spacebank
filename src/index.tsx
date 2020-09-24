import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";

import { DecodeProvider } from "@decode/client";

ReactDOM.render(
  <React.StrictMode>
    <DecodeProvider>
      <App />
    </DecodeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
