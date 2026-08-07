import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { oneHrTheme } from "@one-ops/design-tokens";
import App from "./App";
import "./styles.css";

const LoaderButtonGallery = lazy(async () => {
  const module = await import("./LoaderButtonGallery");
  return { default: module.LoaderButtonGallery };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1500,
      refetchOnWindowFocus: true,
    },
  },
});

const normalizedPath = window.location.pathname.replace(/\/+$/, "");
const rootContent = normalizedPath === "/ui/loader-buttons"
  ? (
      <Suspense fallback={<div lang="ja">アニメーションボタンを読み込んでいます。</div>}>
        <LoaderButtonGallery />
      </Suspense>
    )
  : <App />;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider theme={oneHrTheme}>
      <QueryClientProvider client={queryClient}>
        {rootContent}
      </QueryClientProvider>
    </ConfigProvider>
  </StrictMode>,
);
