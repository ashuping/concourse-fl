/* City of Concourse Website - Session Schema
	Copyright 2020 Alex Isabelle Shuping

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

		http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
 */

import mongoose from 'mongoose'

const Schema = mongoose.Schema
const ObjectId = mongoose.ObjectId

/* Session <====== SessionLogEntry
 *   /\
 *   ||
 *   ||
 * Campaign*
 */

/* Stores a single log entry for an event during the session.
 * 
 * `involved_users` should contain any users which are involved in the log
 * entry.
 */
const SessionLogEntrySchema = new Schema({
    session: {
        type: ObjectId,
        ref: 'Session',
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    event_id: {
        type: Number,
        required: true
    },
    entry: {
        type: String,
        required: true
    },
    involved_users: {
        type: [{
            type: ObjectId,
            ref: 'UserProfile'
        }]
    }
})

/* Stores a session object.
 * 
 * `log` is a virtual attribute compiling the log entries associated with this
 * session.
 */
const SessionSchema = new Schema({
    campaign: {
        type: ObjectId,
        ref: 'Campaign',
        required: true
    },

    active: {
        type: Boolean,
        required: true
    },

    /* URL that can be used to access the active session.
     * 
     * Should be in the form `wss://somewhere.biz/rest/of/the/url`
     * 
     * This parameter should only be present if the session is active.
     */
    url: {
        type: String,
        required: false
    },

    /* Node UUID of the node on which the session is running.
     * 
     * This parameter should only be present if the session is active.
     */
    active_node_id: {
        type: String,
        required: false
    }
})

SessionSchema.virtual('log', {
    ref: 'SessionLogEntry',
    localField: '_id',
    foreignField: 'session'
})

export const SessionLogEntryModel = mongoose.model('SessionLogEntry', SessionLogEntrySchema)
export const SessionModel = mongoose.model('Session', SessionSchema)