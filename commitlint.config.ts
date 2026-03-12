const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'chore', 'docs', 'ci', 'test', 'refactor']],
    'type-case': [2, 'always', 'lower-case'],
    'subject-case': [0],
  },
};

export default config;
