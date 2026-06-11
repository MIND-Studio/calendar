import type { Metadata } from "next";
import { ThemeProvider } from "@mind-studio/ui";
import { mind } from "@mind-studio/ui/themes";
import "./globals.css";
import Header from "@/components/Header";
import { StandaloneOnly } from "@/components/StandaloneOnly";
import { BrokerThemeSync } from "@/components/BrokerThemeSync";

export const metadata: Metadata = {
  title: "Mind Calendar — your time, in your pod",
  description:
    "A privacy-first calendar built on Solid Pods. Every event lives in your pod as plain Turtle — no central server ever sees your schedule.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-mind-theme="mind" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <ThemeProvider
          theme={mind}
          defaultTheme="dark"
          enableSystem={false}
          storageKey="mind-calendar-theme"
        >
          <BrokerThemeSync />
          <StandaloneOnly>
            <Header />
          </StandaloneOnly>
          <main className="flex-1">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
