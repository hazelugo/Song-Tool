"use client";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Music,
  Search,
  ListMusic,
  Moon,
  Sun,
  Timer,
  Piano,
  LogOut,
} from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { title: "Songs", url: "/songs", icon: Music },
  { title: "Discovery", url: "/discovery", icon: Search },
  { title: "Playlists", url: "/playlists", icon: ListMusic },
  { title: "Metronome", url: "/metronome", icon: Timer },
  { title: "Chord Pads", url: "/chords", icon: Piano },
];

export function AppSidebar() {
  const { theme, setTheme } = useTheme();
  const { setOpenMobile } = useSidebar();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <Sidebar>
      {/* DAW-style header: monospaced, uppercase, tight */}
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <a
          href="https://repertoire.hazelugo.com/"
          rel="noopener noreferrer"
          className="font-mono text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-100"
        >
          REPERTOIRE
        </a>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {/* DAW tabs: no rounding, strong left-border accent on active */}
                  <SidebarMenuButton
                    render={
                      <Link
                        href={item.url}
                        onClick={() => setOpenMobile(false)}
                      />
                    }
                    className="rounded-none h-9 px-3 text-xs font-medium tracking-wide uppercase gap-2.5
                      border-l-2 border-transparent
                      hover:bg-sidebar-accent hover:border-l-sidebar-primary hover:text-sidebar-foreground
                      data-[active=true]:border-l-[color:var(--color-chart-4)] data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground
                      transition-colors duration-100"
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-0 border-t border-sidebar-border pt-1 pb-2">
        {userEmail && (
          <p className="px-3 py-1.5 text-[10px] font-mono text-muted-foreground truncate tracking-wide">
            {userEmail}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 rounded-none h-8 px-3 text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 shrink-0" />
          <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 shrink-0" />
          <span>Toggle theme</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 rounded-none h-8 px-3 text-xs uppercase tracking-wide text-muted-foreground hover:text-destructive hover:bg-sidebar-accent"
          onClick={handleSignOut}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          <span>Sign out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
