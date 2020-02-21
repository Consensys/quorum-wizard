module.exports = {
  "presets": [["@babel/preset-env", {targets: {node: 'current'}}],["airbnb", {targets: {node: 'current'}}]],
  "plugins": [
    [
      "@babel/plugin-transform-runtime",
      {
        "absoluteRuntime": false,
        "corejs": false,
        "helpers": true,
        "regenerator": true,
        "useESModules": true
      }
    ]
  ]
}
