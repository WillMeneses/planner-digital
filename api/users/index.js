const { getContainer } = require("../shared/cosmos");

module.exports = async function (context, req) {
    context.log("Azure Function: Users API triggered.");

    // Helper for consistency
    const sendResponse = (status, body) => {
        context.res = {
            status,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        };
    };

    // Validation Env Var
    if (!process.env.PRIMARY_COSMOSDB_CONNECTION_STRING) {
        return sendResponse(500, { error: "Missing Connection String in App Settings" });
    }

    try {
        // Lazy Load Cosmos
        let cosmos;
        try { cosmos = require("../shared/cosmos"); }
        catch (e) { return sendResponse(500, { error: "Failed to load cosmos module", details: e.message }); }

        const { getContainer } = cosmos;
        const container = await getContainer("users");

        const { method } = req;

        // --- REGISTER (POST) ---
        if (method === "POST" && req.url.includes("/register")) {
            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                return sendResponse(400, { error: "Nome, email e senha são obrigatórios." });
            }

            // check if exists
            const { resources: existing } = await container.items
                .query({
                    query: "SELECT * from c WHERE c.email = @email",
                    parameters: [{ name: "@email", value: email }]
                })
                .fetchAll();

            if (existing.length > 0) {
                return sendResponse(409, { error: "Email já cadastrado." });
            }

            const newUser = {
                id: undefined, // Cosmos auto-id
                name,
                email,
                password, // NOTE: In prod, hash this! For MVP parity, keeping plain.
                createdAt: new Date().toISOString()
            };

            const { resource: created } = await container.items.create(newUser);

            // Return safe user object (no password)
            return sendResponse(201, {
                id: created.id,
                name: created.name,
                email: created.email
            });
        }

        // --- LOGIN (POST) ---
        if (method === "POST" && req.url.includes("/login")) {
            const { email, password } = req.body;

            if (!email || !password) {
                return sendResponse(400, { error: "Email e senha obrigatórios." });
            }

            const { resources: users } = await container.items
                .query({
                    query: "SELECT * from c WHERE c.email = @email",
                    parameters: [{ name: "@email", value: email }]
                })
                .fetchAll();

            const user = users[0];

            if (!user || user.password !== password) {
                return sendResponse(401, { error: "Email ou senha inválidos." });
            }

            return sendResponse(200, {
                id: user.id,
                name: user.name,
                email: user.email
            });
        }

        return sendResponse(404, { error: "Endpoint not found. Use /register or /login" });

    } catch (error) {
        context.log.error("Fatal User API Error:", error);
        return sendResponse(500, { error: "Internal Server Error", details: error.message });
    }
};
