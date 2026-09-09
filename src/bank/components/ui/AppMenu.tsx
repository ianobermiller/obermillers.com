import { signOut } from "@bank/core/authClient";
import { Router } from "@bank/core/router";
import { useUser } from "@bank/hooks/auth";
import { Button } from "@bank/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@bank/ui/DropdownMenu";
import { Menu } from "lucide-react";

export function AppMenu() {
  const user = useUser();

  // Everything in here needs an account; the colour scheme toggle sits outside
  // the menu so it is still one press away on the login screen.
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <Menu className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => Router.push("BankSettings")}>Settings</DropdownMenuItem>
        <DropdownMenuItem onClick={() => void signOut()}>Logout {user.email}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
