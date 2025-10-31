import type { GlobalProvider } from "@ladle/react";
import "../layouts/fonts.css";
import "../layouts/style.css";
import "../layouts/tailwind.css";

export const Provider: GlobalProvider = ({ children }) => <>{children}</>;
