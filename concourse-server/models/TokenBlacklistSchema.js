/* City of Concourse Website - JWT blacklist schema
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

/* This schema is used to store blacklisted JWT unique-ids - this can be used
 * in a limited manner to revoke tokens, preventing them from being renewed.
 * 
 * This is necessary in order to make it more difficult for an attacker who
 * intercepts a valid JWT in transit to continue using it to impersonate a
 * valid user.
 *
 * This ONLY helps to prevent token renewal (see the 'token' method in 
 * AuthenticationController.js) - this is the ONLY place that tokens are 
 * checked against this table. This means that, if a malicious actor intercepts
 * a token just before a user logs out (thus blacklisting the token), the
 * attacker will not be able to renew their token, and would thus lose access
 * as soon as it expires (no more than 5 minutes). However, in this time
 * period, the attacker can access any functionality that the user can access.
 * 
 * Certain administrative functions may also check tokens against the
 * blacklist - this negates the primary benefit of JWTs, but it provides
 * additional protection.
 * 
 * Entries in this table are automatically deleted by the database backend at
 * least AUTH_TKN_LIFETIME after they are inserted - this does not necessarily
 * guarantee that every entry is removed the moment the token expires, but it
 * does guarantee that the entry lasts at least as long as the token.
 */

import mongoose from 'mongoose'

import config from '../config/config.js'

const Schema = mongoose.Schema
const ObjectId = Schema.ObjectId

const tokenBlacklistSchema = new Schema({
    owning_user: {
        type: ObjectId,
        required: true
    },
    blacklisted: {
        type: Boolean,
        default: false
    },
    issue_date: {
        type: Date,
        expires: process.env.AUTH_TKN_LIFETIME || config.auth.token_lifetime,
        default: Date.now
    }
})

export const TokenBlacklistModel = mongoose.model('TokenBlacklist', tokenBlacklistSchema)