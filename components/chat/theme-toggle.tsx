"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Theme = "light" | "dark" | "system";

export function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window === "undefined") {
            return "light";
        }
        const savedTheme = localStorage.getItem("theme") as Theme | null;
        return savedTheme ?? "light";
    });

    const applyTheme = (newTheme: Theme) => {
        const root = document.documentElement;

        if (newTheme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
            root.classList.remove("light", "dark");
            root.classList.add(systemTheme);
        } else {
            root.classList.remove("light", "dark");
            root.classList.add(newTheme);
        }
    };

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        applyTheme(theme);
    }, [theme]);

    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
        if (typeof window !== "undefined") {
            localStorage.setItem("theme", newTheme);
        }
    };

    const getIcon = () => {
        if (theme === "light") return <Sun className="h-5 w-5" />;
        if (theme === "dark") return <Moon className="h-5 w-5" />;
        return <Monitor className="h-5 w-5" />;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    {getIcon()}
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleThemeChange("light")}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                    {theme === "light" && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                    {theme === "dark" && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange("system")}>
                    <Monitor className="mr-2 h-4 w-4" />
                    <span>System</span>
                    {theme === "system" && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
