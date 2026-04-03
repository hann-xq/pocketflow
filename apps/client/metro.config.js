const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'sql');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'sql'];

module.exports = withNativeWind(config, { input: './app/global.css' });