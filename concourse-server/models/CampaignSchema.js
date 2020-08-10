/* City of Concourse Website - Campaign Schema
	Copyright 2019 Alex Isabelle Shuping

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
const ObjectId = Schema.ObjectId

const campaignRoleSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    campaign: {
        type: ObjectId,
        ref: 'Campaign',
        required: true
    },
    priority: {
        type: Number,
        required: true
    },
    grants: {
        view: Boolean,
        play: Boolean,
        make_character: Boolean,
        start: Boolean,
        administrate: Boolean
    },
    denies: {
        view: Boolean,
        play: Boolean,
        make_character: Boolean,
        start: Boolean,
        administrate: Boolean
    }
})

const campaignMemberSchema = new Schema({
    user: {
        type: ObjectId,
        ref: 'UserProfile',
        required: true
    },
    roles: {
        type: [{type: ObjectId, ref: 'CampaignRole'}],
        required: true
    }
})

const campaignSchema = new Schema({
    creator: {
        type: ObjectId,
        ref: 'UserProfile',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    members: {
        type: [{type: ObjectId, ref: 'CampaignMember'}],
        required: true
    }
})

export const CampaignModel = mongoose.model('Campaign', campaignSchema)
export const CampaignMemberModel = mongoose.model('CampaignMember', campaignMemberSchema)
export const CampaignRoleModel = mongoose.model('CampaignRole', campaignRoleSchema)