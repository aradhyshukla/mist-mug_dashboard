/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mist & Mug brand semantic palette (from mist-and-mug.onrender.com)
        forest: "#142E25",
        wood: "#6E422B",
        coffee: "#2A1812",
        gold: "#F0B35A",
        paper: "#F3E8D3",
        rain: "#78928D",
        brick: "#A6533F",
        "paper-2": "#EADDC2",
        cream: "#FBF4E6",
        ink: "#241a12",
        // shadcn color slots backed by CSS variables
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
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
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Fraunces", "Georgia", "serif"],
        hand: ["Caveat", "cursive"],
      },
      borderRadius: {
        xs: "3px",
        sm: "6px",
        md: "10px",
        lg: "14px",
        full: "9999px",
      },
    },
  },
  plugins: [],
}
