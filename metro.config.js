const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude problematic native modules from initial bundle
config.resolver.blacklistRE = /#^/;

module.exports = config;
