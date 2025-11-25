import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2.5 rounded-xl bg-gradient-to-br from-cyan-400/20 to-brand-500/20 dark:from-orange-400/20 dark:to-yellow-400/20 border border-cyan-400/30 dark:border-orange-400/30 shadow-lg hover:shadow-glow-cyan dark:hover:shadow-glow-orange transition-all duration-300 hover:scale-110 active:scale-95 group overflow-hidden"
            aria-label="Toggle theme"
        >
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-cyan dark:bg-gradient-sunset opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl"></div>

            {/* Icon container */}
            <div className="relative w-5 h-5">
                <Sun
                    className={`absolute inset-0 w-5 h-5 text-yellow-500 transition-all duration-300 ${theme === 'light'
                            ? 'rotate-0 opacity-100 scale-100'
                            : 'rotate-90 opacity-0 scale-0'
                        }`}
                />
                <Moon
                    className={`absolute inset-0 w-5 h-5 text-cyan-400 transition-all duration-300 ${theme === 'dark'
                            ? 'rotate-0 opacity-100 scale-100'
                            : '-rotate-90 opacity-0 scale-0'
                        }`}
                />
            </div>

            {/* Pulse effect on hover */}
            <div className="absolute inset-0 rounded-xl bg-gradient-brand dark:bg-gradient-sunset opacity-0 group-hover:opacity-30 animate-pulse-glow"></div>
        </button>
    );
}

