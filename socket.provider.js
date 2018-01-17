const _       = require('lodash');
const io      = require('socket.io');
const adapter = require('socket.io-redis');

exports.register = async (container) => {
    container.singleton('socket.kernel', async () => {
        const config = await container.make('config');
        return io(config.socket.options);
    });
};

exports.boot = async (container) => {
    const config       = (await container.make('config')).socket;
    const socketKernel = await container.make('socket.kernel');

    if (config.adapter.redis) {
        const redis = await container.make('redis');
        socketKernel.adapter(adapter(
            _.pickBy({
                key: config.adapter.redis.key || null,
                pubClient: config.adapter.redis.pubClient || redis,
                subClient: config.adapter.redis.subClient || redis,
                host: config.adapter.redis.host || null,
                port: config.adapter.redis.port || null,
                requestsTimeout: config.adapter.redis.requestsTimeout || null
            }, _.identity)
        ));
    }

    // attach container
    socketKernel.use((socket, next) => {
        socket.container = container;
        next();
    });

    // register middlewares
    config.middlewares.forEach((middleware) => socketKernel.use(middleware));

    socketKernel.on('connect', (socket) => {
        console.log(`client ${socket.id} is connected`)

        // register events for connected socket
        _.forEach(config.handlers, (handlers, eventName) => {
            handlers.forEach((handler) => {
                socket.on(eventName, (...arg) => handler(socket, ...arg));
            })
        })
    });
};
