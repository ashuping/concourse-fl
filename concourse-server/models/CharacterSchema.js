/* City of Concourse Website - Character Schema
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
import autopopulate from 'mongoose-autopopulate'

import { determine_type } from '../controllers/CharacterController.js'

const Model = mongoose.Model
const Schema = mongoose.Schema
const ObjectId = Schema.ObjectId

/* A summary of relationships between Models defined in this document:
 * 
 * Key:
 * A ===> B  -- each B has many A, but each A has only one B
 * A*        -- A is not defined in this file
 * 
 * Character <==== CharacterInstance
 *                     ||     /\
 *                     ||     ||
 *                     ||     ||
 * Campaign* <=========++     ++===== CharacterInstanceAttributeValue
 *   /\                                        ||
 *   ||                                        ||
 *   ++========= CampaignCharacterAttribute <==++
 * 
 * This layout was chosen to allow a character to be decoupled from a campaign.
 * As a consequence, we can allow a player to own a character, but also allow
 * them to use it in a campaign that they do not necessarily own. The campaign's
 * GM has ownership over the character's campaign-specific attributes (e.g.
 * stats, conditions, etc.), but the player has ownership over the character's
 * description, name, etc. The player can use the character in multiple
 * campaigns, and even in campaigns that use entirely different systems. A
 * GM does not have the authority to delete the character, but they can remove
 * the character from the campaign that they own (which would delete the
 * CharacterInstance linking that character to the campaign, as well as any
 * CharacterInstanceAttributeValue's associated with that CharacterInstance).
 */

/* Stores the representation of a character
 * 
 * `instances` is a virtual property which retrieves all CharacterInstance
 * objects associated with this character.
 */
const CharacterSchema = new Schema({
    owner: {
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
    }
    /* Virtual:
     *   - instances
     */
}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
})

CharacterSchema.virtual('instances', {
    ref: 'CharacterInstance',
    localField: '_id',
    foreignField: 'character'
})

/* Stores the link between a character and a campaign
 *
 * `attributes` is a virtual property which retrieves all
 * CharacterInstanceAttributeValue objects assocaited with this
 * CharacterInstance.
 */
const CharacterInstanceSchema = new Schema({
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
    /* Virtual:
     *   - attributes
     */
}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
})

CharacterInstanceSchema.virtual('attributes', {
    ref: 'CharacterInstanceAttributeValue',
    localField: '_id',
    foreignField: 'character_instance'
})

/* Stores the value of an attribute for a specific character in a specific
 * campaign.
 *
 * i.e. Links a CharacterInstance with a CampaignCharacterAttribute.
 *
 * 'val' is a virtual property calculated based on the _attType property -
 * internally, each data type is stored in its own property, so that this schema
 * can appear to store many different types of data. The following types are
 * currently supported:
 *    - Number (stored as-is in _val_num)
 *    - String (stored as-is in _val_str)
 *    - Boolean (stored as-is in _val_boo)
 *    - Mongoose Model (stored by ObjectId reference in _val_obj, with model 
 *                     name in _val_obj_name - autopopulated whenever val is
 *                     retrieved)
 * 
 * 'val' also partially supports arbitrary JS objects by converting them to JSON
 * strings; however, this usage is heavily discouraged - it is better to create
 * a separate schema for these objects, and store them by reference.
 *
 * WARNING: This schema uses a virtual 'val' property, so queries cannot be
 *          directly performed on 'val'. To perform queries based on the
 *          attribute's value, you must instead query the underlying _val_X
 *          properties, where X the type of data stored within the attribute.
 *          Note that any given Attribute will only have one of these _val_X
 *          properties defined at a time, based on the value of the _attType
 *          property.
 * 
 * This can also be used to define an arbitrary "attribute value" without any
 * association with a character (in the case of default values, values which
 * must be picked from a list, etc.). This is done by defining
 * `campaign_character_attribute` but not defining `character_instance`.
 * 
 * Additionally, it can be used to define an "orphan attribute", i.e. an
 * attribute associated with a character but not associated with any campaign.
 * This is done by defining `character_instance` but not defining
 * `campaign_character_attribute`.
 * 
 * At least one of the attributes `character_instance` or
 * `campaign_character_attribute` must be defined in order for this object to be
 * defined.
 */
const CharacterInstanceAttributeValueSchema = new Schema({
    character_instance: {
        type: ObjectId,
        ref: 'CharacterInstance'
    },
    campaign_character_attribute: {
        type: ObjectId,
        ref: 'CampaignCharacterAttribute'
    },
    _attType: {
        type: String,
        enum: ['number', 'string', 'boolean', 'object', 'jsonified_object', 'null'],
        default: 'string'
    },
    /* Virtual:
     *   - val
     */
    _val_num: Number,
    _val_str: String,
    _val_boo: Boolean,
    _val_obj: {
        type: ObjectId,
        refPath: '_val_obj_name',
        autopopulate: true
    },
    _val_obj_name: String
}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
})

CharacterInstanceAttributeValueSchema.plugin(autopopulate)

CharacterInstanceAttributeValueSchema.virtual('val').get(function(){
    switch(this._attType){
        case 'number':
            return this._val_num
        case 'string':
            return this._val_str
        case 'boolean':
            return this._val_boo
        case 'object':
            return this._val_obj
        case 'jsonified_object':
            return JSON.parse(this._val_str)
        case 'null':
        default:
            return null
    }
}).set(function(val) {
    if(this._val_num){
        this._val_num = null
    }

    if(this._val_str){
        this._val_str = null
    }

    if(this._val_boo){
        this._val_boo = null
    }

    if(this._val_obj){
        this._val_obj = null
    }

    if(this._val_obj_name){
        this._val_obj_name = null
    }

    const attType = determine_type(val)

    this._attType = attType

    switch(attType){
        case 'object':
            this._val_obj = val._id
            this._val_obj_name = val.modelName
            break
        case 'number':
            this._val_num = val
            break
        case 'boolean':
            this._val_boo = val
            break
        case 'string':
            this._val_str = val
            break
        case 'jsonified_object':
            this._val_str = JSON.stringify(val)
            break
        case 'null':
        default:
    }
})

/* Stores an attribute, as defined for a specific campaign.
 * 
 * `values` is a virtual property which retrieves all
 * CharacterInstanceAttributeValue objects associated with this
 * CampaignCharacterAttributeSchema object.
 */
const CampaignCharacterAttributeSchema = new Schema({
    campaign: {
        type: ObjectId,
        ref: 'Campaign',
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
    attType: {
        type: String,
        enum: ['number', 'string', 'boolean', 'object', 'jsonified_object', 'null'],
        default: 'string'
    }
    /* Virtual:
     *   - values
     */
}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
})

CampaignCharacterAttributeSchema.virtual('values', {
    ref: 'CharacterInstanceAttributeValue',
    localField: '_id',
    foreignField: 'campaign_character_attribute'
})

export const CharacterModel = mongoose.model('Character', CharacterSchema)
export const CharacterInstanceModel = mongoose.model('CharacterInstance', CharacterInstanceSchema)
export const CharacterInstanceAttributeValueModel = mongoose.model('CharacterInstanceAttributeValue', CharacterInstanceAttributeValueSchema)
export const CampaignCharacterAttributeModel = mongoose.model('CampaignCharacterAttribute', CampaignCharacterAttributeSchema)