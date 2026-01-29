const { getContainer } = require("../shared/cosmos");

module.exports = async function (context, req) {
    context.log("Azure Function: Categories API triggered.");

    const errorResponse = (status, message, details = "") => ({
        status: status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: message, details: details })
    });

    try {
        if (!process.env.PRIMARY_COSMOSDB_CONNECTION_STRING) {
            return context.res = errorResponse(500, "Missing Connection String");
        }

        let cosmos;
        try { cosmos = require("../shared/cosmos"); }
        catch (e) { return context.res = errorResponse(500, "Failed to load cosmos", e.message); }

        const { getContainer } = cosmos;
        const container = await getContainer("categories");

        // Auth Logic
        const header = req.headers['x-ms-client-principal'];
        const customUserId = req.headers['x-user-id'];
        let userId = 'dev-user';

        if (customUserId) {
            userId = customUserId;
        } else if (header) {
            try {
                const encoded = Buffer.from(header, 'base64');
                const decoded = encoded.toString('ascii');
                const clientPrincipal = JSON.parse(decoded);
                userId = clientPrincipal.userId;
            } catch (ignore) { }
        }

        const { method } = req;

        switch (method) {
            case "GET":
                const { resources: items } = await container.items
                    .query({
                        query: "SELECT * from c WHERE c.userId = @userId",
                        parameters: [{ name: "@userId", value: userId }]
                    })
                    .fetchAll();
                context.res = { status: 200, body: items };
                break;

            case "POST":
                const newItem = {
                    ...req.body,
                    userId: userId,
                    createdAt: new Date().toISOString()
                };
                const { resource: created } = await container.items.create(newItem);
                context.res = { status: 201, body: created };
                break;

            case "PUT":
                const itemToUpdate = { ...req.body, userId: userId };
                const { resource: updated } = await container.item(itemToUpdate.id, userId).replace(itemToUpdate);
                context.res = { status: 200, body: updated };
                break;

            case "DELETE":
                const id = req.query.id || req.body.id;
                if (!id) return context.res = errorResponse(400, "ID required");
                await container.item(id, userId).delete();
                context.res = { status: 204 };
                break;

            default:
                context.res = errorResponse(405, "Method Not Allowed");
        }

    } catch (error) {
        context.log.error("Category API Error:", error);
        context.res = errorResponse(500, "Internal Server Exception", error.message);
    }
};
