const scopes = ['apps', 'packages', 'configs', 'gh-actions', 'deps', 'deps-dev']

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0, 'always', 'sentence-case'],
    'scope-enum': [2, 'always', scopes],
  },
}
