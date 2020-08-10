/* City of Concourse Website - Email Schema
	Copyright 2019, 2020 Alex Isabelle Shuping

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

const emailSchema = new Schema({
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
        require: true
    },
    user: {
        type: ObjectId,
        ref: 'UserProfile',
        required: true
    }
})

export const EmailModel = mongoose.model('Email', emailSchema)