import baseConfig from '../../eslint.config.js'

export default [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...baseConfig[1].languageOptions.globals,
        // Cloudflare Workers globals
        Request: 'readonly',
        Response: 'readonly',
        fetch: 'readonly',
        addEventListener: 'readonly',
      },
    },
  },
]
