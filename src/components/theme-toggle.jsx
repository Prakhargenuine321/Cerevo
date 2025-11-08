import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

// Simple ThemeToggle component.
// - Toggles the `dark` class on <html>
// - Persists choice in localStorage under 'theme'
// - Uses system preference as default
export function ThemeToggle() {
	const [isDark, setIsDark] = useState(false);

	useEffect(() => {
		try {
			const stored = localStorage.getItem("theme");
			if (stored === "dark") {
				document.documentElement.classList.add("dark");
				setIsDark(true);
				return;
			}
			if (stored === "light") {
				document.documentElement.classList.remove("dark");
				setIsDark(false);
				return;
			}
			// fallback to system preference
			const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
			if (prefersDark) {
				document.documentElement.classList.add("dark");
				setIsDark(true);
			} else {
				document.documentElement.classList.remove("dark");
				setIsDark(false);
			}
		} catch (e) {
			// ignore (privacy mode)
		}
	}, []);

	function toggle() {
		try {
			const next = !isDark;
			setIsDark(next);
			if (next) {
				document.documentElement.classList.add("dark");
				localStorage.setItem("theme", "dark");
			} else {
				document.documentElement.classList.remove("dark");
				localStorage.setItem("theme", "light");
			}
		} catch (e) {
			// ignore
		}
	}

	return (
		<button
			aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
			title={isDark ? "Light mode" : "Dark mode"}
			onClick={toggle}
			className="inline-flex items-center justify-center rounded-md border border-border bg-popover/5 dark:bg-popover/10 px-2 py-1 text-sm hover:bg-popover/10 dark:hover:bg-popover/20 transition-colors text-popover-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
		>
			{isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
		</button>
	);
}

export default ThemeToggle;
