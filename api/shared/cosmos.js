const { CosmosClient } = require("@azure/cosmos");

let client = null; // Keep client as it's not part of the requested change to be cached per container
const containerCache = {};

const DB_NAME = "planner-app";
// CONTAINER_NAME is no longer a fixed global constant as it's passed dynamically

async function getContainer(containerName = "tasks") {
    if (containerCache[containerName]) return containerCache[containerName];

    // Tenta conectar com a Primary
    try {
        console.log(`Connecting to container '${containerName}' with PRIMARY...`);
        const c = await initConnection(process.env.PRIMARY_COSMOSDB_CONNECTION_STRING, containerName);
        containerCache[containerName] = c;
        return c;
    } catch (error) {
        console.error("Primary connection failed:", error.message);

        // Se falhar e tiver Secondary, tenta a Secondary
        if (process.env.SECONDARY_COSMOSDB_CONNECTION_STRING) {
            console.log("Falling back to SECONDARY string...");
            try {
                const c = await initConnection(process.env.SECONDARY_COSMOSDB_CONNECTION_STRING, containerName);
                containerCache[containerName] = c;
                return c;
            } catch (secError) {
                console.error("Secondary connection also failed:", secError.message);
                throw secError;
            }
        }
        throw error;
    }
}

async function initConnection(connectionString, containerName) {
    if (!connectionString) throw new Error("Connection string is empty");

    const tempClient = new CosmosClient(connectionString);
    const { database } = await tempClient.databases.createIfNotExists({ id: DB_NAME });

    // Define PK based on container name (Fallback mapping)
    // Keep in sync with init-db.js
    let pk = "/userId";
    if (containerName === "users") pk = "/email";
    if (containerName === "subtasks") pk = "/taskId";

    const { container } = await database.containers.createIfNotExists({
        id: containerName,
        partitionKey: pk
    });

    client = tempClient;
    return container;
}

module.exports = { getContainer };
