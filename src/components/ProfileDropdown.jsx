import React, { useState, useEffect } from "react";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      setIsDark(stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches));
    } catch {
      // ignore
    }

    const handleStorageChange = (e) => {
      if (e.key === "theme") {
        setIsDark(e.newValue === "dark");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // const user = auth.currentUser; // Removed direct access
  const userName = user?.displayName || user?.email?.split("@")[0] || "User";
  const userInitial = userName.charAt(0).toUpperCase();
  const photoURL = user?.photoURL;

  const navigate = useNavigate();

  const handleLogout = async () => {
    // Show custom toast confirmation before logging out
    toast.custom((t) => (
      <div className="w-full max-w-sm bg-black/60 backdrop-blur-md border border-red-500/30 rounded-lg p-4 shadow-lg">
        <div className="text-sm font-semibold text-white mb-2">Logout?</div>
        <p className="text-xs text-gray-300 mb-4">Are you sure you want to logout?</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t)}
            className="px-3 py-1.5 rounded text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t);
              try {
                await signOut(auth);
                toast.success("Logged out successfully");
                navigate('/');
              } catch (error) {
                console.error("Logout failed:", error);
                toast.error("Failed to logout");
              }
            }}
            className="px-3 py-1.5 rounded text-xs bg-red-600 hover:bg-red-700 text-white transition-colors font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`
            relative h-9 w-9 rounded-full
            bg-gradient-to-br from-gray-200/30 to-gray-400/20 dark:from-gray-800/30 dark:to-gray-900/20
            text-gray-900 dark:text-gray-100 font-semibold flex items-center justify-center
            border border-sky-400/70
            backdrop-blur-xl
            shadow-[0_0_15px_rgba(56,189,248,0.3)]
            hover:shadow-[0_0_25px_rgba(56,189,248,0.6)]
            transition-all duration-500
            animate-[pulse-blue_2.5s_ease-in-out_infinite]
          `}
          title={`${userName}`}
        >
          {/* Subtle Sparkles */}
          <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
            <div className="absolute top-[15%] left-[15%] w-0.5 h-0.5 bg-white rounded-full shadow-[0_0_2px_white] animate-[sparkle_2s_ease-in-out_infinite]" />
            <div className="absolute bottom-[20%] right-[20%] w-0.5 h-0.5 bg-sky-200 rounded-full shadow-[0_0_2px_currentColor] animate-[sparkle_3s_ease-in-out_infinite_1s]" />
            <div className="absolute top-[20%] right-[15%] w-[1px] h-[1px] bg-white rounded-full animate-[sparkle_2.5s_ease-in-out_infinite_0.5s]" />
          </div>
          {photoURL ? (
            <img
              src={photoURL}
              alt={userName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            userInitial
          )}
          <style>{`
            @keyframes pulse-blue {
              0% {
                box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.5);
              }
              50% {
                box-shadow: 0 0 12px 4px rgba(56, 189, 248, 0.8);
              }
              100% {
                box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.5);
              }
            }
            @keyframes sparkle {
              0%, 100% { opacity: 0; transform: scale(0); }
              50% { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className={`
          w-56 p-0 border rounded-2xl overflow-hidden
          backdrop-blur-2xl backdrop-saturate-150
          ${isDark
            ? "bg-[rgba(25,25,25,0.35)] border-[rgba(255,255,255,0.08)] shadow-[0_8px_30px_rgba(0,0,0,0.8)]"
            : "bg-[rgba(255,255,255,0.25)] border-[rgba(255,255,255,0.25)] shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
          }
          transition-all duration-300
          backdrop-filter
          before:absolute before:inset-0
          before:bg-gradient-to-br before:from-white/30 before:to-transparent before:opacity-10
          before:rounded-2xl
          relative overflow-hidden
        `}
      >
        {/* Header */}
        <div
          className={`
            px-4 py-3 border-b
            ${isDark
              ? "bg-[rgba(40,40,40,0.3)] border-[rgba(255,255,255,0.08)]"
              : "bg-[rgba(255,255,255,0.25)] border-[rgba(255,255,255,0.25)]"
            }
            backdrop-blur-md
          `}
        >
          <div className="flex items-center gap-3">
            <div
              className="
                w-10 h-10 rounded-full bg-[rgba(255,255,255,0.25)] dark:bg-[rgba(60,60,60,0.5)]
                flex items-center justify-center text-gray-900 dark:text-gray-100 font-semibold
                border border-[rgba(255,255,255,0.3)] dark:border-[rgba(255,255,255,0.15)]
                shadow-inner backdrop-blur-md overflow-hidden
              "
            >
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                userInitial
              )}
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-semibold truncate ${isDark ? "text-gray-100" : "text-gray-800"}`}>
                {userName}
              </p>
              <p className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-700/80"}`}>{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-1">
          <DropdownMenuItem
            onClick={handleProfile}
            className={`
              px-4 py-2.5 text-sm cursor-pointer rounded-none
              flex items-center gap-3
              ${isDark
                ? "hover:bg-[rgba(80,80,80,0.4)] text-gray-100"
                : "hover:bg-[rgba(255,255,255,0.4)] text-gray-900"
              }
              transition-colors duration-200
            `}
          >
            <User className="h-4 w-4" />
            <span>Your Profile</span>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator
          className={`my-1 h-px ${isDark ? "bg-[rgba(255,255,255,0.1)]" : "bg-[rgba(0,0,0,0.1)]"
            }`}
        />

        {/* Logout */}
        <div className="py-1">
          <DropdownMenuItem
            onClick={handleLogout}
            className={`
              px-4 py-2.5 text-sm cursor-pointer rounded-none
              flex items-center gap-3
              ${isDark
                ? "hover:bg-[rgba(120,0,0,0.3)] text-red-300 hover:text-red-200"
                : "hover:bg-[rgba(255,0,0,0.15)] text-red-600 hover:text-red-700"
              }
              transition-colors duration-200
            `}
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
