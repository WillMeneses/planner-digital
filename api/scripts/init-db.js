const { CosmosClient } = require("@azure/cosmos");

async function main() {
    const connectionString = process.argv[2] || process.env.PRIMARY_COSMOSDB_CONNECTION_STRING;

    if (!connectionString) {
        console.error("❌ Erro: Connection String não fornecida.");
        console.error("Uso: node api/scripts/init-db.js 'SUA_CONNECTION_STRING_AQUI'");
        process.exit(1);
    }

    console.log("🚀 Iniciando configuração do Banco de Dados...");

    try {
        const client = new CosmosClient(connectionString);

        // 1. Criar Banco de Dados
        const dbName = "planner-app";
        const { database } = await client.databases.createIfNotExists({ id: dbName });
        console.log(`✅ Database '${dbName}' verificado/criado.`);

        // 2. Definir Containers (Tabelas)
        const containers = [
            { id: "tasks", pk: "/userId" },      // Tarefas por Usuário
            { id: "categories", pk: "/userId" }, // Categorias por Usuário
            { id: "users", pk: "/email" },       // Usuários por Email (Login)
            { id: "subtasks", pk: "/taskId" }    // Subtarefas por ID da Tarefa pai
        ];

        // 3. Criar cada Container
        for (const conf of containers) {
            console.log(`Creating container '${conf.id}' with PK '${conf.pk}'...`);
            await database.containers.createIfNotExists({
                id: conf.id,
                partitionKey: conf.pk
            });
            console.log(`✅ Container '${conf.id}' pronto.`);
        }

        console.log("\n🎉 Sucesso! Banco de dados configurado corretamante.");
        console.log("Agora o erro 500 deve desaparecer.");

    } catch (error) {
        console.error("\n❌ Falha ao configurar banco:", error.message);
    }
}

main();
