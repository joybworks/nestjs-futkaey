import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.history/**',
      '**/samples/**',
      '**/*.config.js',
      '**/*.config.cjs',
      '**/.husky/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-duplicate-enum-values': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
  }
);
