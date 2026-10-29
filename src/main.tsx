import { createRoot } from "react-dom/client";
import { App } from "./App";
import { initPerfMode } from "./lib/perf";
import "./styles.css";

initPerfMode();

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
