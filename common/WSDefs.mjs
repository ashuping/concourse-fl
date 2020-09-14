
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

    /* Server indicates that the client has requested to do something they are
     * not authorized to do.
     * 
     * Data: {
     *     pkt: (JSON) - The packet which triggered this response.
     *     reason: (String) - A human-readable string explaining the problem.
     * } 
     */
    UNAUTHORIZED: 0x0103,


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
    ALL_INFO_REQ: 0x830F,

    PLAYER_INFO_PUSH: 0x0301,
    PLAYER_INFO_REQ: 0x8301,
    CHARACTER_INFO_PUSH: 0x0302,
    CHARACTER_INFO_REQ: 0x8302,
    GAME_SPEED_PUSH: 0x0303,
    GAME_SPEED_REQ: 0x8303,
    GRACE_TIME_PUSH: 0x0304,
    GRACE_TIME_REQ: 0x8304,

    PLAYER_INFO_SET: 0x0311,
    CHARACTER_INFO_SET: 0x0312,
    GAME_SPEED_SET: 0x0313,
    GRACE_TIME_SET: 0x0314,

    NEW_CHARACTER_REQ: 0x0315,
    NEW_CHARACTER_CONFIRM: 0x8315,
    NEW_CHARACTER_INVALID_ATTRIBUTES: 0x03F1,

    ACTION_NOTICE: 0x0380,
    FIRE_ACTION: 0x8380,
    ACTED_TOO_EARLY: 0x03F0,
    ACTED_WHILE_PAUSED: 0x03F2,

    PAUSE_NOTICE: 0x0381,
    FIRE_PAUSE: 0x8381,
    RESUME_NOTICE: 0x0382,
    FIRE_RESUME: 0x8382,


    /* ========================================================================
     * == 0x0400 - Chat
     * ========================================================================
     */
    FIRE_CHAT_MESSAGE: 0x8400,
    CHAT_MESSAGE: 0x0400,


    /* ========================================================================
     * == 0x7F00 - Critical Errors
     * ========================================================================
     */
    /* The client has sent a packet that the server does not follow a known
     * protocol.
     * Data: none
     */
    CLIENT_PROTOCOL_FAULT: 0x7FFF,
    SERVER_PROTOCOL_FAULT: 0xFFFF
}

export function pkt(msg, data = null){
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

export function msgColor(msg){
    switch(msg){
        case MSG.ALL_INFO_REQ:
        case MSG.PLAYER_INFO_REQ:
        case MSG.CHARACTER_INFO_REQ:
        case MSG.GAME_SPEED_REQ:
        case MSG.TIMER_SYNC_REQ:
        case MSG.GRACE_TIME_REQ:
            return '\x1b[36m'

        case MSG.PLAYER_INFO_SET:
        case MSG.CHARACTER_INFO_SET:
        case MSG.GAME_SPEED_SET:
        case MSG.GRACE_TIME_SET:
        case MSG.NEW_CHARACTER_REQ:
            return '\x1b[32m'

        case MSG.FIRE_ACTION:
        case MSG.FIRE_PAUSE:
        case MSG.FIRE_RESUME:
            return '\x1b[1m\x1b[32m'

        case MSG.PEER_CONNECTED:
        case MSG.PEER_DISCONNECTED:
        case MSG.TIMER_SYNC:
        case MSG.PLAYER_INFO_PUSH:
        case MSG.CHARACTER_INFO_PUSH:
        case MSG.GAME_SPEED_PUSH:
        case MSG.GRACE_TIME_PUSH:
        case MSG.ACTION_NOTICE:
        case MSG.PAUSE_NOTICE:
        case MSG.RESUME_NOTICE:
        case MSG.NEW_CHARACTER_CONFIRM:
            return '\x1b[35m'

        case MSG.ACTED_TOO_EARLY:
        case MSG.ACTED_WHILE_PAUSED:
        case MSG.NEW_CHARACTER_INVALID_ATTRIBUTES:
            return '\x1b[43m'

        case MSG.FIRE_CHAT_MESSAGE:
        case MSG.CHAT_MESSAGE:
            return '\x1b[1;38;5;75m'

        case MSG.UNAUTHORIZED:
            return '\x1b[31m'

        case MSG.CLIENT_PROTOCOL_FAULT:
        case MSG.SERVER_PROTOCOL_FAULT:
            return '\x1b[1m\x1b[4m\x1b[41m'
    }
}

export function stdCodeNumberPrint(num){
    let hexStr = num.toString(16)
    while(hexStr.length < 4){
        hexStr = `0${hexStr}`
    }

    return hexStr
}

export function msgStr(msg){
    switch(msg){
        case MSG.UNAUTHORIZED:
            return `UNAUTHORIZED`

        case MSG.PEER_CONNECTED:
            return `PEER_CONNECTED`
        case MSG.PEER_DISCONNECTED:
            return `PEER_DISCONNECTED`

        case MSG.TIMER_SYNC:
            return `TIMER_SYNC`
        case MSG.TIMER_SYNC_REQ:
            return `TIMER_SYNC_REQ`

        case MSG.ALL_INFO_REQ:
            return `ALL_INFO_REQ`
        case MSG.PLAYER_INFO_PUSH:
            return `PLAYER_INFO_PUSH`
        case MSG.PLAYER_INFO_REQ:
            return `PLAYER_INFO_REQ`
        case MSG.CHARACTER_INFO_PUSH:
            return `CHARACTER_INFO_PUSH`
        case MSG.CHARACTER_INFO_REQ:
            return `CHARACTER_INFO_REQ`
        case MSG.GAME_SPEED_PUSH:
            return `GAME_SPEED_PUSH`
        case MSG.GAME_SPEED_REQ:
            return `GAME_SPEED_REQ`
        case MSG.GRACE_TIME_PUSH:
            return `GRACE_TIME_PUSH`
        case MSG.GRACE_TIME_REQ:
            return `GRACE_TIME_REQ`

        case MSG.PLAYER_INFO_SET:
            return `PLAYER_INFO_SET`
        case MSG.CHARACTER_INFO_SET:
            return `CHARACTER_INFO_SET`
        case MSG.GAME_SPEED_SET:
            return `GAME_SPEED_SET`
        case MSG.GRACE_TIME_SET:
            return `GRACE_TIME_SET`
        
        case MSG.NEW_CHARACTER_REQ:
            return `NEW_CHARACTER_REQ`
        case MSG.NEW_CHARACTER_CONFIRM:
            return `NEW_CHARACTER_CONFIRM`
        case MSG.NEW_CHARACTER_INVALID_ATTRIBUTES:
            return `NEW_CHARACTER_INVALID_ATTRIBUTES`
            
        case MSG.ACTION_NOTICE:
            return `ACTION_NOTICE`
        case MSG.FIRE_ACTION:
            return `FIRE_ACTION`
        case MSG.ACTED_TOO_EARLY:
            return `ACTED_TOO_EARLY`
        case MSG.ACTED_WHILE_PAUSED:
            return `ACTED_WHILE_PAUSED`

        case MSG.PAUSE_NOTICE:
            return `PAUSE_NOTICE`
        case MSG.FIRE_PAUSE:
            return `FIRE_PAUSE`
        case MSG.RESUME_NOTICE:
            return `RESUME_NOTICE`
        case MSG.FIRE_RESUME:
            return `FIRE_RESUME`

        case MSG.FIRE_CHAT_MESSAGE:
            return `FIRE_CHAT_MESSAGE`
        case MSG.CHAT_MESSAGE:
            return `CHAT_MESSAGE`

        case MSG.CLIENT_PROTOCOL_FAULT:
            return `CLIENT_PROTOCOL_FAULT`
        case MSG.SERVER_PROTOCOL_FAULT:
            return `SERVER_PROTOCOL_FAULT`

        default:
            return `UNKNOWN_MESSAGE_TYPE`
    }
}