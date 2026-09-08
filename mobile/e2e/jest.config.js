/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  testEnvironment: 'node',
  testRunner: 'jest-circus/runner',
  testTimeout: 120000,
  testMatch: ['**/*.e2e.js'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './e2e/results',
        outputName: 'e2e-results.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
      },
    ],
  ],
};
