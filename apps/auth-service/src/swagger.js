import swaggerAutogen from "swagger-autogen";

const doc = {
    info: {
        title: "Auth Service API",
        description: "API documentation for Auth Service",
        version: "1.0.0",
    },
    servers: ["http://localhost:6001"],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./routes/auth.router.ts"];

swaggerAutogen()(outputFile, endpointsFiles, doc);
