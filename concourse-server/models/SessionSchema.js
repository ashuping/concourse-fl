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
 * Campaign
 */

const SessionLogEntrySchema = new Schema({
    session: {
        type: ObjectId,
        ref: 'Session',
        required: true
    },
    involved_users: {
        type: [{type: ObjectId, ref: 'UserProfile'}],
        required: true
    },
    text: {
        type: String,
        required: true
    }
}, {
    timestamps: {
        createdAt: 'log_time'
    }
})

const SessionSchema = new Schema({
    campaign: {
        type: ObjectId,
        ref: 'Campaign',
        required: true
    },
    url: {
        type: String,
        required: true
    },
    active: {
        type: Boolean,
        required: true
    }
})

SessionSchema.virtual('log', {
    ref: 'SessionLogEntry',
    localField: '_id',
    foreignField: 'session'
})

export const SessionLogEntryModel = mongoose.model('SessionLogEntry', SessionLogEntrySchema)
export const SessionModel = mongoose.model('Session', SessionSchema)