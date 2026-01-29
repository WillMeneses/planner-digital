module.exports = async function (context, req) {
    context.log('Health check triggered.');

    context.res = {
        status: 200,
        body: {
            status: "Online",
            timestamp: new Date().toISOString(),
            message: "Planner API is running!"
        }
    };
}
