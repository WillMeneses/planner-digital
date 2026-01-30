const { getContainer } = require("../shared/cosmos");

module.exports = async function (context, req) {
    context.log("Azure Function: Subtasks API triggered.");

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
        const container = await getContainer("subtasks");

        const { method } = req;

        // Note: Subtasks are partitioned by /taskId

        switch (method) {
            case "GET":
                const taskId = req.query.taskId;
                if (!taskId) return context.res = errorResponse(400, "TaskId required for GET");

                const { resources: items } = await container.items
                    .query({
                        query: "SELECT * from c WHERE c.taskId = @taskId",
                        parameters: [{ name: "@taskId", value: taskId }]
                    })
                    .fetchAll();
                context.res = { status: 200, body: items };
                break;

            case "POST":
                // Expects { taskId, title, completed }
                const newItem = {
                    ...req.body,
                    completed: req.body.completed || false,
                    createdAt: new Date().toISOString()
                };

                if (!newItem.taskId) return context.res = errorResponse(400, "TaskId required");

                const { resource: created } = await container.items.create(newItem);
                context.res = { status: 201, body: created };
                break;

            case "PUT":
                // Updates (toggle completion mostly)
                // Needs id and taskId (partition key)
                const itemToUpdate = req.body;
                if (!itemToUpdate.id || !itemToUpdate.taskId) {
                    return context.res = errorResponse(400, "ID and TaskId required for Update");
                }

                const { resource: updated } = await container
                    .item(itemToUpdate.id, itemToUpdate.taskId)
                    .replace(itemToUpdate);
                context.res = { status: 200, body: updated };
                break;

            case "DELETE":
                const id = req.query.id || req.body.id;
                const pKey = req.query.taskId || req.body.taskId; // Partition Key

                if (!id || !pKey) return context.res = errorResponse(400, "ID and TaskId required for Delete");

                await container.item(id, pKey).delete();
                context.res = { status: 204 };
                break;

            default:
                context.res = errorResponse(405, "Method Not Allowed");
        }

    } catch (error) {
        context.log.error("Subtask API Error:", error);
        context.res = errorResponse(500, "Internal Server Exception", error.message);
    }
};
