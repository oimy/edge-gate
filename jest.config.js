module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: [
        "<rootDir>/src/test/**/*.test.ts"
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/main/$1',
    },
    clearMocks: true,
    transform: {
        "^.+\\.tsx?$": ["ts-jest", {
            tsconfig: "tsconfig.json",
        }],
    },
    modulePaths: ["<rootDir>"],
};
