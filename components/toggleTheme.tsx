"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, []);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    if (!mounted) {
        return (
            <div className="flex items-center space-x-2">
                <Switch
                    id="theme-switch"
                    disabled
                    checked={false}
                />
                <Label htmlFor="theme-switch">
                    <Sun className="w-5 h-5 text-blue-500" />
                </Label>
            </div>
        )
    }

    return (
        <div className="flex items-center space-x-2">
            <Label htmlFor="theme-switch">
                {theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-blue-500" />
                ) : (
                    <Sun className="w-5 h-5 text-blue-500" />
                )}
            </Label>
            <Switch 
                id="theme-switch"
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
            />
        </div>
    )
}