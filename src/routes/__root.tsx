import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { Toaster } from "@/components/ui/sonner";
import { SiteFooter } from "@/components/site-footer";

export const Route = createRootRoute({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "Psiennik — dziennik behawioralny",
      },
      {
        name: "description",
        content:
          "Wspólny dziennik behawioralny psa dla właścicieli i behawiorystów: wydarzenia, oceny i zalecenia.",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "google-site-verification",
        content: "NZIoqrU_btcbC0UqH5splKxTI7iJW5n2jZoDizw8-iE",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "stylesheet",
        href: "/fonts/local-fonts.css",
      },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
    ],
  }),
  shellComponent: RootShell,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext() as { queryClient: QueryClient };
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex min-h-screen flex-col">
          <AppHeader />
          <main className="flex-1">
            <Outlet />
          </main>
          <SiteFooter />
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
