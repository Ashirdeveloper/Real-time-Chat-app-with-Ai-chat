module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          reanimatedAsPlugin: true,
        },
      ],
    ],
    plugins: ["react-native-reanimated/plugin"],
  };
};