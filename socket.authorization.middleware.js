const cookie  = require('cookie');

module.exports = async (context, next) => {
    const container      = context.container;
    const config         = await container.make('config');
    const socket         = context.socket.socket;
    const sessionStorage = await container.make('session.storage');
    let sessionID        = cookie.parse(socket.handshake.headers.cookie)['sphinx-session-id'];

    let session = await sessionStorage.get(sessionID);
    if (!session) {
        context.credential = session.get(config.auth.session.credentialKey)
        await next();
    }
    socket.disconnect(true)
}    