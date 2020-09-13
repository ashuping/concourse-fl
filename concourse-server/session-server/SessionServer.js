import { SessionModel, SessionLogEntryModel } from '../models/SessionSchema.js'
import { get_permissions } from '../controllers/CampaignController.js'
import { process_user_for_user } from '../controllers/UserController.js'
import { process_instance_for_user } from '../controllers/CharacterController.js'
import ws from 'ws'

import { MSG, pkt, depkt, msgStr, msgColor, stdCodeNumberPrint } from './WSDefs.mjs'
import config from '../config/config.js'

export const SLEVT = {
    INSTANTIATED: 0,
    STARTED: 1,
    CONNECTION: 2,
    DISCONNECT: 3,
    ENDED: 4,
}


/* The potential results of trying to retrieve a session.
 */
export const SESSION_RETRIEVE_RESULT = {
    /* Indicates that the session was found on this server.
     */
    FOUND: 0,

    /* Indicates that the session exists and is active, but it is handled by a
     * different server. The client should be redirected to the appropriate
     * URL (provided as `redirect_url` in the getSession() return object).
     */
    REDIRECT: 1,

    /* Indicates that the session was found, but it is not currently active on
     * any nodes.
     */
    INACTIVE: 2,

    /* Indicates that the session ID was not found in the database - it may be
     * invalid.
     */
    NOT_FOUND: 3,
}


/* The potential results trying to create a session
 */
export const SESSION_CREATE_RESULT = {
    /* The session was successfully created.
     * 
     * The returned object will also contain the created session object in the
     * `session` field.
     */
    SUCCESS: 0,

    /* The provided user is not authorized to create a session in the provided
     * campaign.
     */
    UNAUTHORIZED: 1
}


const activeSessions = {}


function consoleLogPacket(packet, toClient = false, client = 'unknown', server = 'unknown'){
    const decodedData = depkt(packet)
    console.log(`[SES] ${msgColor(decodedData.msg)} ${stdCodeNumberPrint(decodedData.msg)} ${msgStr(decodedData.msg)} \x1b[0m <client ${client}> ${toClient ? "<-" : "->"} <session ${server}>`)
}


/* Represents an instance of a character present in a session.
 *
 * The most basic type of SessionInstance is one which is directly tied in a
 * one-to-one relationship with a single CharacterInstance. In this case, it
 * represents a slightly-simplified form of that character instance, with the
 * information necessary to use the character in a session.
 *
 * However, this is not the only type of instance. In some cases, a
 * CharacterInstance represents an entire class of characters - for example, an
 * instance may represent a standard class of enemy, which can be re-used
 * wherever that enemy is encountered. In this case, there is no need to
 * permanently store the instance's attributes - indeed, there may even be more
 * than one of these instances in play at once, each with their own attributes.
 *
 * In this case, the SessionInstance is said to be `untethered` - i.e. not tied
 * in a persistent one-to-one relationship with its associated
 * CharacterInstance.
 */
export class SessionInstance {
    #_untethered
    #_base_instance
    attributes

    static async buildTransient(attributes){
        return new SessionInstance(none, true, attributes)
    }

    static async build(instance, untethered, additional_attributes = null){
        await instance.populate('character').populate('campaign').execPopulate({
            path: 'attributes',
            populate: {
                path: 'campaign_character_attribute'
            }
        })

        const attribs = {}
        /* Flatten and simplify the attribute structure. Instead of
         * 
         * [{
         *     campaign_character_attribute: {
         *         name,
         *         description,
         *         type,
         *     },
         *     type,
         *     val
         * }]
         * 
         * the attribute set becomes
         * 
         * {
         *     name: val
         * }
         * 
         * Types will be inferred by the frontend (the frontend knows the 
         * meanings of attributes which are relevant to its particular system),
         * and they will only be enforced by the server when values are written
         * back to the database (in many cases, this will never happen, e.g. for
         * untethered instances, which do not persist between sessions).
         * 
         * Attributes that are present multiple times, or which otherwise share
         * the same name, will be collapsed into an array. They will be expanded
         * back into individual attributes if the instance is written back to
         * the database.
         */
        for(const attribute of instance.attributes){
            attName = attribute.campaign_character_attribute.name

            /* Since the database stores attributes by a unique ID, but the
             * session server only stores them by name, it is possible that the
             * same attribute name will be used by multiple attributes. This
             * is handled by turning the attribute into an array containing all
             * values with conflicting names.
             */
            if(attName in attribs){
                if(Array.isArray(attribs[attName])){
                    attribs[attName].push(attribute.val)
                }else{
                    attArr = [attribs[attName], attribute.val]
                    attribs[attName] = attArr
                }
            }else{
                attribs[attName] = attribute.val
            }
        }

        if(additional_attributes){
            for(attName in additional_attributes){
                if(attName in attribs){
                    if(Array.isArray(attribs[attName])){
                        attribs[attName].push(additional_attributes[attName])
                    }else{
                        attArr = [attribs[attName], additional_attributes[attName]]
                        attribs[attName] = attArr
                    }
                }else{
                    attribs[attName] = additional_attributes[attName]
                }
            }
        }

        return SessionInstance(instance, untethered, attribs)
    }

    /* DO NOT CALL THIS CONSTRUCTOR DIRECTLY.
     * 
     * Instead, await the static `SessionInstance.build()` function.
     */
    constructor(instance, untethered, attributes){
        this.#_untethered = untethered
        this.#_base_instance = instance
        this.attributes = attributes
    }
}


/* Represents a client connected to a game session.
 * 
 * This class contains a websocket connection to a single client. It is always
 * associated with a Session object (representing the session server to which 
 * the client is connected).
 */
export class SessionClient {
    #_session
    #_user
    #_socket
    #_scid

    constructor(session, user, socket){
        this.#_session = session
        this.#_user = user
        this.#_socket = socket
        this.#_scid = `${user._id}+${Date.now()}`

        this.#_socket.on('message', this.handleMessage.bind(this))
        this.#_socket.on('close', this.handleClose.bind(this))
    }

    get user(){
        return this.#_user
    }

    get scid(){
        return this.#_scid
    }

    send(packet){
        consoleLogPacket(packet, true, this.scid, this.#_session._id)
        this.#_socket.send(packet)
    }

    handleClose(code, reason){
        this.#_session.onClientClose(this, code, reason)
    }

    handleMessage(packet){
        const decodedData = depkt(packet)

        if(decodedData.msg){
            switch(decodedData.msg){
                default:
                    this.#_session.onClientMessage(this, packet)
            }
        }else{
            this.#_session.onClientBadMessage(this, packet)
        }
    }
}


/* Represents a game session.
 * 
 * This class contains a websocket server, associated with a single game
 * session. It is linked to a number of SessionClient objects, representing all
 * of the clients connected to the server.
 */
export class Session {
    #_session
    #_socket
    #_clients
    #_instances
    #_game_properties
    #_startTime

    /* Construct a new Session class.
     * 
     * `cid` is the ID of the campaign to construct the Session for
     * `startingUser` is the ID of the user who started the session.
     */
    static async build(cid, startingUser){

        const newSession = new SessionModel({
            campaign: cid,
            active: false
        })

        await newSession.save()

        const sesObj = new Session(newSession)

        await sesObj.log(
            SLEVT.INSTANTIATED,
            `Session ${newSession._id} instantiated for campaign ${cid} by user ${startingUser}.`,
            [startingUser]
        )

        return sesObj
    }

    /* DO NOT CALL THIS CONSTRUCTOR DIRECTLY.
     * 
     * Instead, await the static `Session.build()` function.
     */
    constructor(sessionModelObj){

        if(sessionModelObj.active){
            console.warn('Attempted to construct a Session object from a SessionModel, but the model was already active! Multiple servers may have been started to serve the same session ID! This is a bug!')
        }

        this.#_clients = []
        this.#_instances = []
        this.#_session = sessionModelObj
        this.#_game_properties = {
            graceTime: 30*1000,
            gameSpeed: 1
        }

    }

    get _id(){
        return this.#_session._id
    }

    get active(){
        return this.#_session.active
    }

    get url(){
        return this.#_session.url
    }

    /* Start a session
     * 
     * This method will perform the following steps:
     *  1. Log the startup event
     *  2. Start the internal websocket server
     *  3. Begin the internal session timer
     *  4. Update the session in the database to indicate that it is active,
     *     and set the `url` and `active_node_id` parameters to point to this
     *     node.
     * 
     * New users can then be connected to this server with the `handleJoin`
     * method.
     * 
     * `url` is the URL where this session will be accessible from. The server
     *       routes should be set up such that accessing this URL will result in
     *       a call to `handleJoin()` for the requesting user.
     * 
     * `startingUser` The UID of the user who triggered the startup event.
     */
    async start(url, startingUser){

        await this.log(
            SLEVT.STARTED,
            `Session ${this.#_session._id} started by user ${startingUser._id}.`,
            [startingUser._id]
        )

        this.#_socket = new ws.Server({noServer: true, clientTracking: false})

        this.#_startTime = Date.now()

        this.#_session.url = url
        this.#_session.active_node_id = (process.env.NODE_ID || config.node_id)
        this.#_session.active = true
        await this.#_session.save()

    }

    /* Join a new user to the session.
     * 
     * IMPORTANT NOTE: This function does NOT check the request in any way -
     *                 the calling code MUST authenticate the request and
     *                 ensure that `req.user.user` is authorized to join the
     *                 session.
     * 
     * This function will hijack an upgrade request and start a websocket
     * connection. A SessionClient will be created, joined to the server, and
     * returned. All other connected clients will be alerted to the new client
     * connection.
     * 
     * The connection event will be logged.
     */
    async handleJoin(joinRequest){

        await this.log(
            SLEVT.CONNECTION,
            `User ${joinRequest.user.user._id} has joined session ${this._id}`,
            [joinRequest.user.user._id]
        )

        const newClient = await new Promise((resolve, reject) => {
            this.#_socket.handleUpgrade(
                joinRequest,
                joinRequest.socket,
                [],
                async (clientSocket) => {
                    const clientObj = new SessionClient(
                        this,
                        joinRequest.user.user,
                        clientSocket
                    )
                    this.#_clients.push(clientObj)
                    resolve(clientObj)
                }
            )
        })

        const peer_proc = await process_user_for_user(joinRequest.user.user, null)
        peer_proc['scid'] = newClient.scid
        
        await this.broadcast(pkt(MSG.PEER_CONNECTED, {
            peer: peer_proc
        }))

        return true
    }

    /* Send a message to one or more clients
     * 
     * If `targets` is non-empty, then `message` will be sent to all
     * SessionClients in the list. If `targets` is empty, then `message` will
     * be sent to all clients with `broadcast()`
     */
    async sendToMany(targets, message){
        if(!targets){
            this.broadcast(message)
        }else{
            for(const target of targets){
                target.send(message)
            }
        }
    }

    /* Send a message to all connected clients
     */
    async broadcast(message){
        for(const client of this.#_clients){
            client.send(message)
        }
    }

    /* Log a message for this session
     * 
     * `event` - a SLEVT entry indicating the type of log event.
     * `entry` - the plantext description of the log event.
     * `users` - a list of users involved with this log event
     */
    async log(event, entry, users){
        const logEntry = new SessionLogEntryModel({
            session: this.#_session._id,
            event_id: event,
            entry: entry,
            involved_users: users
        })

        await logEntry.save()
    }

    /* ==== Timer functions ====
     * 
     * These functions handle managing and synchronizing the game timer.
     */

    /* Send a timer synchronization message to one or more clients.
     * 
     * `targets` is an array of SessionClient objects - if present, a
     * synchronization message will be sent to each client in that list.
     * Otherwise, a synchronization message will be sent to all connected
     * clients. Note that the time is calculated individually for each request,
     * so each client will get the most up-to-date time possible, even if a
     * large list of clients is passed.
     */
    async timerSync(targets){
        if(!targets){
            targets = this.#_clients
        }

        for(const target of targets){
            target.send(pkt(
                MSG.TIMER_SYNC,
                {
                    time: Date.now() - this.#_startTime
                }
            ))
        }
    }

    /* ==== Client push functions ====
     * 
     * These functions push various pieces of data to one or all clients. If
     * `targets` is specified, then the data will be sent to all clients in that
     * list - otherwise, it is sent to all clients.
     */

    /* Send a PLAYER_INFO_PUSH message to one or more clients.
     * 
     * See above for information on `targets`
     */
    async pushPlayerInfo(targets){

        const playerInfo = []
        for(const client of this.#_clients){
            playerInfo.push(await process_user_for_user(client.user, null))
        }

        await this.sendToMany(targets, pkt(MSG.PLAYER_INFO_PUSH, {
            players: playerInfo
        }))

    }

    /* Send a CHARACTER_INFO_PUSH message to one or more clients.
     * 
     * See above for information on `targets`
     */
    async pushCharacterInfo(targets){
        await this.sendToMany(targets, pkt(MSG.CHARACTER_INFO_PUSH, {
            characters: this.#_instances
        }))
    }

    /* Send a GAME_SPEED_PUSH message to one or more clients.
     * 
     * See above for information on `targets`
     */
    async pushGameSpeed(targets){
        await this.sendToMany(targets, pkt(MSG.GAME_SPEED_PUSH, {
            speed: this.#_game_properties.gameSpeed
        }))
    }

    /* Send a GRACE_TIME_PUSH message to one or more clients.
     * 
     * See above for information on `targets`
     */
    async pushGraceTime(targets){
        await this.sendToMany(targets, pkt(MSG.GRACE_TIME_PUSH, {
            grace: this.#_game_properties.graceTime
        }))
    }

    /* Send a PLAYER_INFO_PUSH message to one or more clients.
     * 
     * See above for information on `targets`
     */
    async pushAll(targets){
        await this.pushPlayerInfo(targets)
        await this.pushCharacterInfo(targets)
        await this.pushGameSpeed(targets)
        await this.pushGraceTime(targets)
        await this.timerSync(targets)
    }

    async onClientClose(client, code, reason){
        for(let index = 0; index < this.#_clients.length; index++){
            if(this.#_clients[index] === client){
                this.#_clients.splice(index, 1)
            }
        }

        this.broadcast(pkt(MSG.PEER_DISCONNECTED, {
            peer: await process_user_for_user(client, null)
        }))
    }

    async onClientMessage(client, packet){
        const decodedData = depkt(packet)
        consoleLogPacket(packet, false, client.scid, this._id)

        switch(decodedData.msg){
            case MSG.ALL_INFO_REQ:
                this.pushAll([client])
                break
            case MSG.PLAYER_INFO_REQ:
                this.pushPlayerInfo([client])
                break
            case MSG.CHARACTER_INFO_REQ:
                this.pushCharacterInfo([client])
                break
            case MSG.GAME_SPEED_REQ:
                this.pushGameSpeed([client])
                break
            case MSG.GRACE_TIME_REQ:
                this.pushGraceTime([client])
                break
            case MSG.FIRE_ACTION:
                break
            default:
                break
        }
    }

    async onClientBadMessage(client, packet){
        client.send(pkt(MSG.CLIENT_PROTOCOL_FAULT, null))
    }
}


/* Attempt to generate a new session.
 * 
 * `campaign` is the Campaign object associated with the campaign in which the
 * session is to be created.
 * 
 * `startingUser` is the user who is requesting to generate the session. The
 * request will be denied if this user is not authorized to start the session.
 * 
 * Returns an object containing at least the `result` key, which is an instance
 * of `SESSION_CREATE_RESULT` - it may contain additional keys, depending on the
 * value of `result`.
 * 
 * If `result` is `SESSION_CREATE_RESULT.UNAUTHORIZED`, then the provided user
 * is not authorized to start a session in the provided campaign, and no action
 * has been taken.
 * 
 * If `result` is `SESSION_CREATE_RESULT.SUCCESS`, then the session has been
 * successfully started. The result object will also contain the resultant
 * session object in a key called `session`.
 */
export async function genSession(campaign, startingUser){
    const userPerms = await get_permissions(startingUser, campaign)

    if(!userPerms.start){
        return {
            result: SESSION_CREATE_RESULT.UNAUTHORIZED
        }
    }

    const newSession = await Session.build(campaign._id, startingUser._id)

    let sesUrl = (process.env.BIND_URL || config.bind_url)
    sesUrl = `ws://${sesUrl}/api/v1/sessions/${newSession._id}/join`

    await newSession.start(sesUrl, startingUser)

    activeSessions[newSession._id] = newSession

    return {
        result: SESSION_CREATE_RESULT.SUCCESS,
        session: newSession
    }

}


/* Attempt to retrieve a session object.
 * 
 * `sid` is the ID of the session to retrieve.
 * 
 * Returns an object which always has the `result` key. This is a
 * `SESSION_RETRIEVE_RESULT` object - depending on its value, more keys may also
 * be present.
 * 
 * If it is `SESSION_RETRIEVE_RESULT.FOUND`, then the session is present on this
 * node. In this case, the object will also contain a `session` key containing
 * the `Session` object associated with this session.
 * 
 * If it is `SESSION_RETRIEVE_RESULT.REDIRECT`, then the session is present and
 * active, but it is on another node. In this case, the object will also contain
 * the field `redirect_url`, containing a URL to which clients should be
 * redirected. Additionally, it will contain the `node_uuid` field, which holds
 * the ID of the node where the session is hosted.
 * 
 * If it is `SESSION_RETRIEVE_RESULT.INACTIVE`, then the session is not active,
 * and as such, the client will not be able to connect to it.
 * 
 * If it is `SESSION_RETRIEVE_RESULT.NOT_FOUND`, then the requested session ID
 * does not correspond to any session which has ever happened in this
 * installation. The user may have provided an invalid session ID.
 */
export async function getActiveSession(sid){
    for(const activeSid in activeSessions){
        if(activeSid === sid){
            return {
                result: SESSION_RETRIEVE_RESULT.FOUND,
                session: activeSessions[activeSid]
            }
        }
    }

    const inactiveOrRemoteSession = SessionModel.findById(sid)

    if(!inactiveOrRemoteSession){
        return {
            result: SESSION_RETRIEVE_RESULT.NOT_FOUND
        }
    }else if(inactiveOrRemoteSession.active){
        return {
            result: SESSION_RETRIEVE_RESULT.REDIRECT,
            redirect_url: inactiveOrRemoteSession.url,
            node_uuid: inactiveOrRemoteSession.active_node_id
        }
    }else{
        return {
            result: SESSION_RETRIEVE_RESULT.INACTIVE
        }
    }
}