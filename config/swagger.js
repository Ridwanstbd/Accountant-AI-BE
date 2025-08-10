const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");

// Load swagger document
const swaggerDocument = YAML.load(path.join(__dirname, "../swagger.yaml"));

const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 50px 0 }
    .swagger-ui .info .title { color: #3b4151; font-size: 36px }
  `,
  customSiteTitle: "Accounting API Documentation",
  customfavIcon: "/assets/favicon.ico",
};

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(swaggerDocument, swaggerOptions),
  swaggerDocument,
};
