import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Disable React Compiler's set-state-in-effect rule.
      // Our patterns (mounted checks, localStorage hydration, animated counters)
      // are safe and standard in Next.js apps.
      'react-hooks/set-state-in-effect': 'off',
      // Allow require() for dynamic Amplify config loading
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Amplify build artifacts
    ".amplify/**",
  ]),
]);

export default eslintConfig;
