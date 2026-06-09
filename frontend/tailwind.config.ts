import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        button: {
          DEFAULT: "hsl(var(--button))",
          hover: "hsl(var(--button-hover-hsl))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        panel: "hsl(var(--panel))",
        success: "hsl(var(--success))",
        successBg: "hsl(var(--success-bg))",
        warning: "hsl(var(--warning))",
        warningBg: "hsl(var(--warning-bg))",
        danger: "hsl(var(--danger))",
        dangerBg: "hsl(var(--danger-bg))",
        purple: "hsl(var(--purple))",
        purpleBg: "hsl(var(--purple-bg))"
      },
      boxShadow: {
        soft: "0 1px 4px rgba(15, 23, 42, 0.06)",
        search: "0 8px 18px rgba(15, 23, 42, 0.06)"
      }
    }
  },
  plugins: []
} satisfies Config;
