import nextJest from 'next/jest';
import type { Config } from 'jest';

// Configuração do next/jest
const createJestConfig = nextJest({
  dir: './',
});

// Configuração personalizada tipada
const customJestConfig: Config = {
  testEnvironment: 'node', 
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], 
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  preset: 'ts-jest', 
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1', 
    '^date-fns$': '<rootDir>/node_modules/date-fns/index.js',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
};

// Exportar a configuração
export default createJestConfig(customJestConfig);