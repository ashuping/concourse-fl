/* City of Concourse Website - User Profile Schema
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

const userProfileSchema = new Schema({
	username: {
		type: String,
		required: true,
		unique: true
	},
	display_name: {
		type: String,
		required: true
	},
	pronouns: {
		subject: { // they
			type: String,
			requried: true
		},
		object: { // them
			type: String,
			required: true
		},
		dependent_possessive: { // their
			type: String,
			required: true
		},
		independent_possessive: { // theirs
			type: String,
			required: true
		},
		reflexive: { // themself
			type: String,
			required: true
		}
	},
	emails: [{
		address: {
			type: String,
			required: true
		},
		verified: {
			type: Boolean,
			required: true
		},
		primary: {
			type: Boolean,
			required: true
		}
	}],
	administrator: {
		type: Boolean,
		required: true
	},
	can_create_campaigns: {
		type: Boolean,
		required: true
	},
	can_create_registration_keys: {
		type: Boolean,
		required: true
	},
	campaigns: [{
		id: {
			type: ObjectId,
			required: true
		},
		admin: {
			type: Boolean,
			required: true
		}
	}]
})

export const UserProfileModel = mongoose.model('UserProfile', userProfileSchema)