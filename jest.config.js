module.exports = {
  testEnvironment: "node",
  // Stale git worktrees live under .worktrees/ (gitignored). Without this,
  // Jest collected every copy of the suite from every worktree (39 suites
  // instead of 8), which made the salary gate meaningless. `<rootDir>` keeps
  // the pattern relative, so a suite run *inside* a worktree still runs.
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/\\.worktrees/"],
  transform: {
    // Hermetic on purpose: `babelrc: false, configFile: false` means this does
    // NOT read a project babel config — and there must not be a root
    // babel.config.js, because Metro would pick it up and break the Expo
    // bundle (babel-preset-expo is not a devDependency). This transform exists
    // so the ESM modules under lib/ can be required by the suite; the CJS
    // sources under utils/ pass through unchanged.
    "^.+\\.(js|jsx|ts|tsx)$": [
      "babel-jest",
      {
        babelrc: false,
        configFile: false,
        presets: [["@babel/preset-env", { targets: { node: "current" } }]],
      },
    ],
  },
};
