
import type { Config } from "tailwindcss"

const config = {
    darkMode: "class",
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                    way: {
                        100: "var(--primary-way-100)",
                        90: "var(--primary-way-90)",
                        80: "var(--primary-way-80)",
                        70: "var(--primary-way-70)",
                        60: "var(--primary-way-60)",
                        50: "var(--primary-way-50)",
                        40: "var(--primary-way-40)",
                        30: "var(--primary-way-30)",
                        20: "var(--primary-way-20)",
                        10: "var(--primary-way-10)",
                        5: "var(--primary-way-5)",
                    }
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                    db: {
                        100: "var(--secondary-db-100)",
                        90: "var(--secondary-db-90)",
                        80: "var(--secondary-db-80)",
                        70: "var(--secondary-db-70)",
                        60: "var(--secondary-db-60)",
                        50: "var(--secondary-db-50)",
                        40: "var(--secondary-db-40)",
                        30: "var(--secondary-db-30)",
                        20: "var(--secondary-db-20)",
                        5: "var(--secondary-db-5)",
                    }
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "enter": {
                    from: { opacity: "0", transform: "var(--tw-enter-translate, none) var(--tw-enter-scale, none) var(--tw-enter-rotate, none)" },
                    to: { opacity: "1", transform: "none" },
                },
                "exit": {
                    from: { opacity: "1", transform: "none" },
                    to: { opacity: "0", transform: "var(--tw-exit-translate, none) var(--tw-exit-scale, none) var(--tw-exit-rotate, none)" },
                },
                "slide-in-from-right": {
                    from: { transform: "translateX(100%)" },
                    to: { transform: "translateX(0)" },
                },
                "slide-out-to-right": {
                    from: { transform: "translateX(0)" },
                    to: { transform: "translateX(100%)" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "slide-in-from-right": "slide-in-from-right 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
                "slide-out-to-right": "slide-out-to-right 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
