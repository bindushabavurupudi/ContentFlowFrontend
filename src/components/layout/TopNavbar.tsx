import { Bell, Plus, LogOut, User, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState } from "react";

export function TopNavbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const displayName = user?.name?.trim() || "";
  const profileInitial = displayName ? displayName.charAt(0).toUpperCase() : "U";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast.success("Logged out successfully");
    } catch {
      toast.error("Logout completed locally");
    } finally {
      setIsLoggingOut(false);
      navigate("/signin", { replace: true });
    }
  };

  return (
    <header className="h-14 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-muted-foreground" />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="gradient"
          size="sm"
          className="gap-1.5"
          onClick={() => navigate("/schedule")}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create Post</span>
        </Button>

        <Button variant="ghost" size="icon" className="relative text-muted-foreground" onClick={() => toast.info("No new notifications")}>
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <div className="h-7 w-7 rounded-full btn-gradient flex items-center justify-center">
                <span className="text-xs font-semibold text-primary-foreground">
                  {profileInitial}
                </span>
              </div>
              <span className="hidden md:inline text-sm font-medium">{user?.name}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <span className="inline-block mt-1 text-[10px] font-medium uppercase tracking-wider text-primary bg-accent px-1.5 py-0.5 rounded">
                {user?.role}
              </span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <User className="h-4 w-4 mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your session will be cleared and you'll need to sign in again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout} disabled={isLoggingOut} className="btn-gradient text-primary-foreground">
                    {isLoggingOut ? "Logging out..." : "Confirm Logout"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
