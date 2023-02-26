module.exports = {
  webpack: (config) => {
    config.optimization.minimize = false;
    return config;
  },
}