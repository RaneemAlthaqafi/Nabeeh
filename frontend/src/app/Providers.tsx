"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { LangProvider } from "@/lib/i18n/context";
import { DirWrapper } from "@/app/DirWrapper";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <DirWrapper>{children}</DirWrapper>
      </LangProvider>
    </QueryClientProvider>
  );
}
