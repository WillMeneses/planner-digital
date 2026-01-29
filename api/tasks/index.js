const { getContainer } = require("../shared/cosmos");

module.exports = async function (context, req) {
    // Pega o ID do usuário autenticado (injetado pelo SWA)
    // Se estiver rodando local sem emulador SWA, usamos 'dev-user'
    const header = req.headers['x-ms-client-principal'];
    let userId = 'dev-user';
    if (header) {
        const encoded = Buffer.from(header, 'base64');
        const decoded = encoded.toString('ascii');
        const clientPrincipal = JSON.parse(decoded);
        userId = clientPrincipal.userId;
    }

    const container = await getContainer();

    try {
        switch (req.method) {
            case "GET":
                // Ler TODAS as tarefas desse usuário
                const { resources: tasks } = await container.items
                    .query({
                        query: "SELECT * from c WHERE c.userId = @userId",
                        parameters: [{ name: "@userId", value: userId }]
                    })
                    .fetchAll();

                context.res = { status: 200, body: tasks };
                break;

            case "POST":
                // Criar Nova Tarefa
                const newTask = {
                    ...req.body,
                    userId: userId, // Garante que a tarefa é dona desse user
                    createdAt: new Date().toISOString()
                };
                // Se não vier ID, o Cosmos gera um, mas se o app mandar (UUID), usamos ele
                const { resource: created } = await container.items.create(newTask);
                context.res = { status: 201, body: created };
                break;

            case "PUT":
                // Atualizar Tarefa
                const taskToUpdate = {
                    ...req.body,
                    userId: userId
                };
                // Atualiza (Replace)
                const { resource: updated } = await container
                    .item(taskToUpdate.id, userId)
                    .replace(taskToUpdate);
                context.res = { status: 200, body: updated };
                break;

            case "DELETE":
                // Deletar Tarefa
                const taskId = req.query.id || req.body.id;
                if (!taskId) {
                    context.res = { status: 400, body: "Task ID required" };
                    return;
                }
                await container.item(taskId, userId).delete();
                context.res = { status: 204 }; // No Content
                break;

            default:
                context.res = { status: 405, body: "Method Not Allowed" };
        }

    } catch (error) {
        context.log.error("Cosmos DB Error:", error);
        context.res = {
            status: 500,
            body: { error: error.message }
        };
    }
}
