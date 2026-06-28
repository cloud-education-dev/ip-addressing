module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@ip-intel/networking$': '<rootDir>/libs/networking/src'
  }
};
