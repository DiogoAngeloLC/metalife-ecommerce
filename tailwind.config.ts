import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        // Industrial design tokens
        bg: "var(--bg)",
        "bg-elevated": "var(--bg-elevated)",
        "bg-section": "var(--bg-section)",
        "bg-dark": "var(--bg-dark)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        "text-muted": "var(--text-muted)",
        "on-dark": "var(--on-dark)",
        "on-dark-soft": "var(--on-dark-soft)",
        action: "var(--action)",
        "action-dark": "var(--action-dark)",
        "action-light": "var(--action-light)",
        "action-bg": "var(--action-bg)",
        trust: "var(--trust)",
        "trust-dark": "var(--trust-dark)",
        "trust-light": "var(--trust-light)",
        "trust-bg": "var(--trust-bg)",
        success: "var(--success)",
        "success-bg": "var(--success-bg)",
        danger: "var(--danger)",
        "danger-bg": "var(--danger-bg)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        "line-soft": "var(--line-soft)",
      },
      fontFamily: {
        display: ["var(--font-montserrat)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        none: "0",
        sm: "2px",
        DEFAULT: "4px",
        md: "4px",
        lg: "6px",
        xl: "8px",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
export default config;
