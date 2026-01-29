module.exports = async function (context, req) {
    context.log("Azure Function: Tasks API triggered.");

    // Default Error Response
    const errorResponse = (status, message, details = "") => ({
        status: status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: message, details: details })
    });

    try {
        // Lazy Load to catch initialization errors
        let cosmos;
        try {
            cosmos = require("../shared/cosmos");
        } catch (modError) {
            return context.res = errorResponse(500, "Failed to load cosmos module", modError.message);
        }

        const { getContainer } = cosmos;

        // Validation Env Var
        if (!process.env.PRIMARY_COSMOSDB_CONNECTION_STRING) {
            return context.res = errorResponse(500, "Missing Connection String in App Settings");
        }

        const header = req.headers['x-ms-client-principal'];
        let userId = 'dev-user';
        if (header) {
            try {
                const encoded = Buffer.from(header, 'base64');
                const decoded = encoded.toString('ascii');
                const clientPrincipal = JSON.parse(decoded);
                userId = clientPrincipal.userId;
            } catch (authError) {
                console.warn("Auth parse failed, defaulting to dev-user", authError);
            }
        }

        context.log("Connecting to Database...");
        const container = await getContainer("tasks");
        context.log("Database connected.");

        const { method } = req;

        switch (method) {
            case "GET":
                const { resources: tasks } = await container.items
                    .query({
                        query: "SELECT * from c WHERE c.userId = @userId",
                        parameters: [{ name: "@userId", value: userId }]
                    })
                    .fetchAll();
                context.res = { status: 200, body: tasks }; // SWA handles JSON array automatically
                break;

            case "POST":
                const newTask = {
                    ...req.body,
                    userId: userId,
                    createdAt: new Date().toISOString()
                };
                const { resource: created } = await container.items.create(newTask);
                context.res = errorResponse(201, "Created", created); // Reuse helper but pass object as 'details' for body
                // Actually, clean response for success:
                context.res = { status: 201, body: created };
                break;

            case "PUT":
                const taskToUpdate = { ...req.body, userId: userId };
                const { resource: updated } = await container.item(taskToUpdate.id, userId).replace(taskToUpdate);
                context.res = { status: 200, body: updated };
                break;

            case "DELETE":
                const taskId = req.query.id || req.body.id;
                if (!taskId) return context.res = errorResponse(400, "Task ID required");
                await container.item(taskId, userId).delete();
                context.res = { status: 204 };
                break;

            default:
                context.res = errorResponse(405, "Method Not Allowed");
        }

    } catch (error) {
        context.log.error("Fatal Function Error:", error);
        context.res = errorResponse(500, "Internal Server Exception", error.message);
    }
};
