import { authClient } from "@bank/core/authClient";
import { Router } from "@bank/core/router";
import { useUser } from "@bank/hooks/auth";
import { Button } from "@bank/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bank/ui/DropdownMenu";
import { THEMES, useTheme } from "@bank/ui/ThemeProvider";
import { Menu } from "lucide-react";

export function AppMenu() {
  const { setTheme, theme } = useTheme();
  const user = useUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <Menu className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={theme}>
          {THEMES.map((option) => (
            <DropdownMenuRadioItem key={option} onClick={() => setTheme(option)} value={option}>
              {capitalizeFirst(option)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {user && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => Router.push("BankSettings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void authClient.signOut()}>
              Logout {user.email}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function capitalizeFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
