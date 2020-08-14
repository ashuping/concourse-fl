/* City of Concourse Website - Registration Key Schema
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

/* Registration keys are used to create a register-by-invitation system. In
 * order to create an account (when registration keys are enforced), a new user
 * must provide a valid token. The account creating a token can choose how many
 * times the token can be used, whether accounts created with the token can
 * themselves create new tokens, etc.
 * 
 * Registration keys can also be used to invite a user to a specific campaign.
 * Existing users can enter the key to be added to the campaign (this also
 * grants said users any permissions granted by the key).
 */

import mongoose from 'mongoose'
const Schema = mongoose.Schema
const ObjectId = Schema.ObjectId

const registrationKeySchema = new Schema({
    creator: {
        type: ObjectId,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    uses_total: {
        type: Number,
        default: -1 // (infinite)
    },
    uses_remaining: {
        type: Number,
        default: -1
    },
    campaign: {
        type: {
            cid: {
                type: ObjectId,
                ref: 'Campaign',
                required: true
            },
            roles: {
                type: [ObjectId],
                ref: 'CampaignRole',
                required: true
            }
        },
        required: false

    },
    add_to_campaign: {
        type: ObjectId,
        ref: 'Campaign',
        required: false
    },
    campaign_role: {
        type: ObjectId,

    },
    grants_administrator: {
        type: Boolean,
        required: true
    },
    grants_create_campaigns: {
        type: Boolean,
        required: true
    },
    grants_create_registration_keys: {
        type: Boolean,
        required: true
    },
    created_date: {
        type: Date,
        default: Date.now
    },
    expire_date: {
        type: Date,
        expires: 0,
        required: false
    }
})

export const RegistrationKeyModel = mongoose.model('RegistrationKey', registrationKeySchema)