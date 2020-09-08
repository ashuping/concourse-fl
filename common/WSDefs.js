
/* Standard message IDs used for communication over the websocket.
 * 
 * The MSBit of the message ID is used to differentiate client-to-server and
 * server-to-client messages - if it is zero, the message is meant to be sent
 * from server to client; if it is one, it is meant to be sent from client to
 * server.
 */
export const MSG = {
    /* ========================================================================
     * == 0x0100 - Authentication Messages
     * ========================================================================
     */
    /* Server indicates that the client must provide authentication information
     * to access the session.
     * 
     * Client should respond with an AUTH_RESPONSE packet.
     */
    AUTHENTICATE: 0x0100,

    /* Client provides the server with a temporary authentication token (which
     * can be obtained by GET'ing the API endpoint for this session's ID,
     * assuming the GET'ing user is logged in and has the relevant
     * permissions).
     * 
     * Data: {
     *     aid: (String) - The string returned from the session API endpoint.
     * }
     */
    AUTH_RESPONSE: 0x8100,

    /* Server indicates that the client has provided acceptable authentication
     * information, and can now receive server pushes and send messages.
     */
    AUTH_OK: 0x0110,
    
    /* Server indicates that the client has not provided acceptable
     * authentication information. Before the client can send and receive
     * messages, they will need to AUTHENTICATE again with a valid `aid`.
     */
    AUTH_BAD: 0x01F0,

    /* Server indicates that the client has requested to do something they are
     * not authorized to do.
     * 
     * Data: {
     *     pkt: (JSON) - The packet which triggered this response.
     *     reason: (String) - A human-readable string explaining the problem.
     * } 
     */
    UNAUTHORIZED: 0x01FA,


    /* ========================================================================
     * == 0x0200 - Connection Information
     * ========================================================================
     */
    /* Server indicates that a new peer has connected and authenticated.
     * 
     * Data: {
     *     peer: (JSON) - 
     * }
     */
    PEER_CONNECTED: 0x0200,
    PEER_DISCONNECTED: 0x0201,


    /* ========================================================================
     * == 0x0300 - Game and Timer Information
     * ========================================================================
     */
    /* Server is synchronizing its time value with the client.
     * 
     * Data: {
     *     time: (Number) - The current game time, in ms. The client should use
     *           this to synchronize its own timers.
     * }
     */
    TIMER_SYNC: 0x0300,

    /* Client is requesting a TIMER_SYNC packet.
     * 
     * The server is expected to respond with TIMER_SYNC.
     */
    TIMER_SYNC_REQ: 0x8300,


    /* Client is requesting all relevant information on the session.
     * 
     * This is usually only sent once - on startup.
     * Server is expected to respond with the following, in no particular
     * order:
     *   * One PLAYER_INFO_PUSH Containing data on all connected players
     *   * One CHARACTER_INFO_PUSH containing data on all present characters
     *   * One GAME_SPEED_PUSH
     *   * One GRACE_TIME_PUSH
     *   * One TIMER_SYNC
     */
    ALL_INFO_REQ: 0x83FF,

    PLAYER_INFO_PUSH: 0x0301,
    PLAYER_INFO_REQ: 0x8301,
    CHARACTER_INFO_PUSH: 0x0302,
    CHARACTER_INFO_REQ: 0x8302,
    GAME_SPEED_PUSH: 0x0303,
    GAME_SPEED_REQ: 0x8303,
    GRACE_TIME_PUSH: 0x0304,
    GRACE_TIME_REQ: 0x8304,

    ACTION_NOTICE: 0x0350,
    FIRE_ACTION: 0x8350,
    ACTED_TOO_EARLY: 0x03F0,
    ACTED_WHILE_PAUSED: 0x03F1,

    // FIRE_PAUSE


    /* ========================================================================
     * == 0x7F00 - Critical Errors
     * ========================================================================
     */
    CLIENT_PROTOCOL_FAULT: 0x7FFF,
    SERVER_PROTOCOL_FAULT: 0xFFFF
}

export function pkt(msg, data){
    const pkt = {
        msg: msg
    }
    if(data){
        for(const key in data){
            pkt[key] = data[key]
        }
    }
    return JSON.stringify(pkt)
}

export function depkt(pkt){
    return JSON.parse(pkt)
}