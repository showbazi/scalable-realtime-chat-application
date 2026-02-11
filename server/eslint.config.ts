import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  // 1. GLOBAL IGNORES (Replaces .eslintignore)
  {
    ignores: ["dist", "node_modules", "coverage", "eslint.config.ts"],
  },

  // 2. Base Configuration
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node, // Tells ESLint we are in Node.js (enables 'process', 'require', etc.)
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      // Merges Prettier's rules. If formatting is wrong, ESLint will show an error.
      ...prettierConfig.rules, // Disables ESLint rules that conflict with Prettier

      "no-console": "off", // Allow console.log for this backend assignment
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",

      // Enforce Prettier formatting as an ESLint rule
      "prettier/prettier": [
        "error",
        {
          singleQuote: true,
          semi: true,
          tabWidth: 2,
          trailingComma: "all",
          printWidth: 100,
          endOfLine: "auto",
        },
      ],
    },
  },

  // 3. Recommended Configs (Spread them in)
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
