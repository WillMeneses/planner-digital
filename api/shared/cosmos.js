const { CosmosClient } = require("@azure/cosmos");

let client = null;
let container = null;

const DB_NAME = "planner-app";
const CONTAINER_NAME = "tasks";

async function getContainer() {
    if (container) return container;

    // Tenta conectar com a Primary
    try {
        console.log("Connecting with PRIMARY string...");
        container = await initConnection(process.env.PRIMARY_COSMOSDB_CONNECTION_STRING);
        return container;
    } catch (error) {
        console.error("Primary connection failed:", error.message);

        // Se falhar e tiver Secondary, tenta a Secondary
        if (process.env.SECONDARY_COSMOSDB_CONNECTION_STRING) {
            console.log("Falling back to SECONDARY string...");
            try {
                container = await initConnection(process.env.SECONDARY_COSMOSDB_CONNECTION_STRING);
                return container;
            } catch (secError) {
                console.error("Secondary connection also failed:", secError.message);
                throw secError; // Desiste se as duas falharem
            }
        }
        throw error;
    }
}

async function initConnection(connectionString) {
    if (!connectionString) throw new Error("Connection string is empty");

    const tempClient = new CosmosClient(connectionString);

    // Cria o Database se não existir
    const { database } = await tempClient.databases.createIfNotExists({ id: DB_NAME });

    // Cria o Container (Tabela) se não existir
    // PartitionKey /userId é crucial para separar dados de cada usuário
    const { container: c } = await database.containers.createIfNotExists({
        id: CONTAINER_NAME,
        partitionKey: "/userId"
    });

    client = tempClient; // Salva o cliente globalmente
    return c;
}

module.exports = { getContainer };
