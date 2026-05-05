import "dotenv/config"; // Load .env FIRST — must be before any other import that reads process.env
import "./env"; // Validate env vars — exits with clear error if misconfigured
import app from "./app";

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Bank webhook server is running on port ${PORT}`);
});

