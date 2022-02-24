module.exports = {
  collectCoverage: true,
  coveragePathIgnorePatterns: ['/node_modules/'],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 90,
      lines: 90,
      functions: 90,
    },
  },
  globals: {
    Template: true,
    Optimizely: true,
    initTabs: true,
  },
  setupFilesAfterEnv: [],
  snapshotSerializers: ['enzyme-to-json/serializer'],
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>**/*.test.[jt]s'],
  moduleDirectories: ['node_modules', 'components', 'services', 'shared'],
  transform: {
    '^.+\\.js?$': 'babel-jest',
  },
}
