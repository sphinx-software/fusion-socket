const io = require('socket.io');
const lodash = require('lodash');

exports.register = async (container) => {
    container.singleton('socket.kernel', async () => {
        const config     = await container.make('config');
        return io(config.socket.options);
    });
};

exports.boot = async (container) => {
    const config = await container.make('config');
    const socketKernel = await container.make('socket.kernel');
    config.socket.middlewares.forEach((middleware) => socketKernel.use(middleware));

    socketKernel.on('connection', (socket) => {
        socket.container = container;
        lodash.forEach(config.socket.handlers, (handlers, eventName) => {
            handlers.forEach((handler) => {
                socket.on(eventName, (data) => {handler(socket, data)});
            })
        })
    })
};
