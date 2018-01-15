const IO     = require('koa-socket');
const Koa    = require('koa');
const lodash = require('lodash');

exports.register = async (container) => {
    container.singleton('socket.kernel', async () => {
        const config       = await container.make('config');
        const socketKernel = new Koa(); 
        const io           = new IO(config.socket.options);
        
        io.attach(socketKernel);    
        return socketKernel;    
    });
};

exports.boot = async (container) => {
    const config       = await container.make('config');
    const socketKernel = await container.make('socket.kernel');

    // attach container
    socketKernel.io.use(async (context, next) => {
        context.container = container;
        await next();
    });
    
    // register middlewares
    config.socket.middlewares.forEach((middleware) => socketKernel.io.use(middleware));

    // register events    
    lodash.forEach(config.socket.handlers, (handlers, eventName) => {
        handlers.forEach((handler) => {
            socketKernel.io.on(eventName, handler);
        })
    })

    socketKernel.io.on('connection', (socket) => {
        console.log(`client ${socket.socket.client.id} is connected`)
    });
};
