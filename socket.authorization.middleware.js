const cookie = require('cookie');
const VError = require('verror');

module.exports = (socket, next) => {
    const container = socket.container;
    let sessionID   = cookie.parse(socket.handshake.headers.cookie)['sphinx-session-id'];

    Promise.all([
        container.make('session.storage'),
        container.make('config')
    ]).then((result) => {
        const sessionStorage = result[0];
        const config = result[1];

        return sessionStorage.get(sessionID).then((session) => {
            if (session) {
                socket.credential = session.get(config.auth.session.credentialKey)
                next();
            } else {
                next(new VError(`E_SOCKET: socket ${socket.id} is unauthorize`));
            }
        });
    })
}
