const lodash = require('lodash');
const io = require('socket.io');

exports.register = async (container) => {
    container.singleton('socket.kernel', async () => {
        const config = await container.make('config');
        return io(config.socket.options);
    });
};

exports.boot = async (container) => {
    const config       = await container.make('config');
    const socketKernel = await container.make('socket.kernel');

    // attach container
    socketKernel.use((socket, next) => {
        socket.container = container;
        next();
    });

    // register middlewares
    config.socket.middlewares.forEach((middleware) => socketKernel.use(middleware));

    socketKernel.on('connect', (socket) => {
        console.log(`client ${socket.id} is connected`)

        // register events for connected socket
        lodash.forEach(config.socket.handlers, (handlers, eventName) => {
            handlers.forEach((handler) => {
                socket.on(eventName, (...arg) => handler(socket, ...arg));
            })
        })
    });
};
