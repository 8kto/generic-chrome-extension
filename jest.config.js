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
  setupFilesAfterEnv: [],
  snapshotSerializers: ['enzyme-to-json/serializer'],
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>src/**/*.test.[jt]s'],
  moduleDirectories: ['node_modules', 'components', 'services', 'shared'],
  modulePaths: ['<rootDir>/src/'],
  moduleNameMapper: {
    '^.+\\.scss$': 'babel-jest',
  },
  preset: 'ts-jest',
  transform: {
    '^.+[tj]s$': 'ts-jest',
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
}
