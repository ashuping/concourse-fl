/* City of Concourse Website - Character Schema
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

const numberAttributeSchema = new Schema({
    character: {
        type: ObjectId,
        ref: "CharacterCampaignLink"
    },
    attribute: {
        type: ObjectId,
        ref: 'CampaignCharacterAttribute'
    },
    val: Number
})

const stringAttributeSchema = new Schema({
    character: {
        type: ObjectId,
        ref: "CharacterCampaignLink"
    },
    attribute: {
        type: ObjectId,
        ref: 'CampaignCharacterAttribute'
    },
    val: String
})

const booleanAttributeSchema = new Schema({
    character: {
        type: ObjectId,
        ref: "CharacterCampaignLink"
    },
    attribute: {
        type: ObjectId,
        ref: 'CampaignCharacterAttribute'
    },
    val: Boolean
})

const objectAttributeSchema = new Schema({
    character: {
        type: ObjectId,
        ref: "CharacterCampaignLink"
    },
    attribute: {
        type: ObjectId,
        ref: 'CampaignCharacterAttribute'
    },
    val: ObjectId
})

const campaignCharacterAttributeSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    campaign: {
        type: ObjectId,
        ref: 'Campaign',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: [ 'NumberAttribute', 'StringAttribute', 'BooleanAttribute', 'ObjectAttribute' ]
    },
    hidden: {
        type: Boolean,
        default: false
    }
})

const characterCampaignLinkSchema = new Schema({
    character: {
        type: ObjectId,
        ref: 'Character',
        required: true
    },
    campaign: {
        type: ObjectId,
        ref: 'Campaign',
        required: true
    }
}, {
    toJSON: {
        virtuals: true
    }
})

characterCampaignLinkSchema.virtual('attributes').get(function(){
    return 
})

const characterSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    owner: {
        type: ObjectId,
        ref: 'UserProfile'
    }
    /* Virtual fields:
     * 
     * campaigns: Array of `CharacterCampaignLinkModel`s, one for each campaign
     *            this character is in.
     */
}, {
    toJSON: {
        virtuals: true
    }
})

characterSchema.virtual('campaigns', {
    ref: 'CharacterCampaignLink',
    localField: '_id',
    foreignField: 'campaign'
})

export const CharacterAttributeModel         = mongoose.model('CharacterAttribute', characterAttributeSchema)
export const CampaignCharacterAttributeModel = mongoose.model('CampaignCharacterAttribute', campaignCharacterAttributeSchema)
export const CharacterCampaignLinkModel      = mongoose.model('CharacterCampaignLink', characterCampaignLinkSchema)
export const CharacterModel                  = mongoose.model('CharacterModel', characterSchema)