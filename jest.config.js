const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './'
})

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$'
}

module.exports = createJestConfig(customJestConfig)