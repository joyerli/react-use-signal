module.exports = {
  verbose: true,
  testMatch: ["**/*.test.(t|j)s(x)?"],
  transform: {
    "^.+\\.(t|j)sx?$": require.resolve('ts-jest'),
  },
  testTimeout: 3e4,
  transformIgnorePatterns: [`/node_modules/(?!${[].join("|")})`],
  setupFiles: ['./setup.js'],
  testEnvironment: 'jsdom',
  fakeTimers:  { enableGlobally : true },
};
