const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Reduce workers para evitar OOM
config.maxWorkers = 2;

// Necesario para socket.io-client (usa módulos .cjs)
config.resolver.sourceExts.push('cjs');

module.exports = config;
