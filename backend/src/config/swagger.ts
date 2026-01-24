import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Caro Game API",
      version: "1.0.0",
      description: "API documentation for Caro Game backend",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:5000",
        description: "Development server",
      },
      {
        url: "http://localhost:5000",
        description: "Local server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token",
        },
      },
      schemas: {
        // Base Response Schema
        BaseResponse: {
          type: "object",
          properties: {
            code: {
              type: "integer",
              description: "HTTP status code",
            },
            message: {
              type: "string",
              description: "Response message",
            },
            result: {
              type: "object",
              nullable: true,
              description: "Response data",
            },
            error: {
              type: "object",
              nullable: true,
              description: "Error details",
            },
          },
        },
        // Auth Schemas
        RegisterUser: {
          type: "object",
          required: ["username", "email", "password"],
          properties: {
            username: {
              type: "string",
              example: "johndoe",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: {
              type: "string",
              format: "password",
              minLength: 6,
              example: "password123",
            },
          },
        },
        LoginUser: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "password123",
            },
          },
        },
        // User Schemas
        User: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            username: {
              type: "string",
              example: "johndoe",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            isGuest: {
              type: "boolean",
              example: false,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        // Room Schemas
        CreateRoom: {
          type: "object",
          required: ["hostId"],
          properties: {
            hostId: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            boardSize: {
              type: "integer",
              minimum: 10,
              maximum: 20,
              default: 15,
              example: 15,
            },
            maxPlayers: {
              type: "integer",
              minimum: 2,
              maximum: 4,
              default: 2,
              example: 2,
            },
            isPrivate: {
              type: "boolean",
              default: false,
              example: false,
            },
            allowSpectators: {
              type: "boolean",
              default: true,
              example: true,
            },
          },
        },
        JoinRoom: {
          type: "object",
          required: ["userId", "roomCode"],
          properties: {
            userId: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            roomCode: {
              type: "string",
              example: "ABC123",
            },
          },
        },
        Room: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            roomCode: {
              type: "string",
              example: "ABC123",
            },
            hostId: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            players: {
              type: "array",
              items: {
                type: "string",
              },
            },
            maxPlayers: {
              type: "integer",
              example: 2,
            },
            boardSize: {
              type: "integer",
              example: 15,
            },
            status: {
              type: "string",
              enum: ["waiting", "playing", "finished"],
              example: "waiting",
            },
            isPrivate: {
              type: "boolean",
              example: false,
            },
            allowSpectators: {
              type: "boolean",
              example: true,
            },
            matchId: {
              type: "string",
              nullable: true,
              example: "507f1f77bcf86cd799439012",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        // Match Schemas
        MakeMove: {
          type: "object",
          required: ["x", "y", "playerId"],
          properties: {
            x: {
              type: "integer",
              minimum: 0,
              example: 5,
            },
            y: {
              type: "integer",
              minimum: 0,
              example: 5,
            },
            playerId: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
          },
        },
        Match: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            roomId: {
              type: "string",
              example: "507f1f77bcf86cd799439012",
            },
            players: {
              type: "array",
              items: {
                type: "string",
              },
            },
            board: {
              type: "array",
              items: {
                type: "array",
                items: {
                  type: "integer",
                  nullable: true,
                },
              },
            },
            currentTurn: {
              type: "integer",
              example: 0,
            },
            boardSize: {
              type: "integer",
              example: 15,
            },
            history: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  x: { type: "integer" },
                  y: { type: "integer" },
                  playerId: { type: "string" },
                  timestamp: { type: "string", format: "date-time" },
                },
              },
            },
            result: {
              type: "string",
              enum: ["pending", "win", "draw"],
              nullable: true,
              example: "pending",
            },
            winner: {
              type: "string",
              nullable: true,
              example: "507f1f77bcf86cd799439011",
            },
            startTime: {
              type: "string",
              format: "date-time",
            },
            endTime: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
          },
        },
        // Error Schemas
        ValidationError: {
          type: "object",
          properties: {
            field: {
              type: "string",
              example: "email",
            },
            message: {
              type: "string",
              example: "Please provide a valid email address",
            },
            value: {
              type: "string",
              example: "invalid-email",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

