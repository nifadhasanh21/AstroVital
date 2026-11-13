"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const api_1 = __importDefault(require("./routes/api"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({ origin: '*' })); // Allow React Dashboard & App
app.use(express_1.default.json());
// Root Health Check Route
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'ONLINE',
        system: 'AstroVital Telemetry API Server',
        timestamp: new Date().toISOString()
    });
});
// API Routes
app.use('/api', api_1.default);
app.listen(PORT, () => {
    console.log(`🚀 AstroVital Server running on http://localhost:${PORT}`);
});
