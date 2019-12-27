/* City of Concourse Website - User Controller
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

import crypto from 'crypto'
import fetch from 'node-fetch'
import mongodb from 'mongodb'

import config from '../config/config.js'

import { UserLoginModel } from '../models/UserLoginSchema.js'
import { UserProfileModel } from '../models/UserProfileSchema.js'
import { RegistrationKeyModel } from '../models/RegistrationKeySchema.js'

/* Checks a password against the HaveIBeenPwned breachlist. This is used to
 * to prevent users from using weak and/or breached passwords.
 * 
 * Returns the number of breaches the hash has been found in (0 if none)
 */
export const has_been_pwned = async (passwd) => {
	const pwd_hibp_hash = crypto.createHash('sha1')
	pwd_hibp_hash.update(passwd)
	const hash_result = pwd_hibp_hash.digest('hex')

	// Only the first 5 characters of the hash are sent to the server
	const to_send = hash_result.substring(0, 5)

	// Fetch the list of hashes beginning with those 5 characters
	const found_hashes = await fetch(`https://api.pwnedpasswords.com/range/${to_send}`).then((res) => res.text())
	var match_count = 0
	found_hashes.split('\n').forEach((candidate_hash) => {
		const parsed_candidate_hash = to_send + candidate_hash.substring(0,35).toLowerCase()
		if(parsed_candidate_hash == hash_result.toLowerCase()){
			// Password hash found
			match_count = parseInt(candidate_hash.substring(36))
		}else{
		}
	})

	return match_count
}

/* Validates a list of campaigns, making sure that all entries are formatted
 * properly.
 * 
 * Returns the list of parsed campaigns. Raises an object in the form
 * 
 * {
 *   code: http_response_code_to_use,
 *   message: message_to_return
 * }
 * 
 * if something is wrong with the passed object.
 */
export const validate_campaigns = async (campaigns) => {
	if(!campaigns){
		return []
	}

	if(!Array.isArray(campaigns)){
		throw {
			code: 400,
			message: `"campaigns" field is present but is not an array`
		}
	}

	const parsed_campaigns = []
	campaigns.forEach((campaign) => {
		const valid_campaign_keys = [
			"id", "admin"
		]

		if(!campaign){
			throw {
				code: 400,
				message: `Campaign array element is null or empty`
			}
		}

		Object.keys(campaign).forEach((key) => {
			if(!valid_campaign_keys.includes(key)){
				throw {
					code: 400,
					message: `Campaign object contains unknown field ${key}`
				}
			}
		})

		if(!Object.keys(campaign).includes("id")){
			throw {
				code: 400,
				message: `Campaign object missing required field id`
			}
		}

		if(!mongodb.ObjectID.isValid(campaign.id)){
			throw {
				code: 400,
				message: `Campaign id field "${campaign.id}" is malformed.`
			}
		}

		const parsed_campaign = {
			id: campaign.id,
			admin: false
		}

		if(Object.keys(campaign).includes("admin") && campaign.admin){
			parsed_campaign.admin = true
		}

		parsed_campaigns.push(parsed_campaign)
	})

	return parsed_campaigns
}

/* User registration function
 * 
 * Expects the following fields:
 * {
 *   [Required fields]
 *   username: (String) username for the new user
 *   password: (String) password for the new user
 *   display_name: (String) display name to use for this user
 *   pronouns: (ObjectId) link to PreferredPronounsSchema representing this user's preferred pronouns
 *   email: (String) Primary e-mail to use for the new user
 *   registration_key: (String) The registration key to use for this registration.
 *                     NOTE that if the server does not require registration keys,
 *                     this field is optional.
 * }
 * 
 * Returns 200 if the user was successfully created, 400 if some part of the input data is malformed,
 * 409 if the username requested is already taken, and 500 if an unexpected error occurs (this should
 * hopefully never happen).
 * 
 * If the status code is 200, it will return a JSON object representing the new user's profile - the
 * object will be as UserProfileSchema, with an added "_id" field representing the user's unique ID.
 * 
 * In case of a user problem (code 400/409), it will return a JSON object representing the problem.
 * This object will always contain a "reason" field representing the reason the user could not be
 * created. Certain specific error codes/reasons may have extra fields.
 * 
 * This function will verify that the password provided is not found in the Pwned Passwords database.
 * If the password *is* found, it will return 400, with reason "Password found in breach database".
 * The object returned will also contain a "breaches" key, representing the number of times the
 * password has been found in breaches.
 */
export const RegisterUser = async (req, res, next) => {
	// Verify that all required fields exist
	if(!(
		req.body.username
		&& req.body.password
		&& req.body.display_name
		&& req.body.pronouns
		&& req.body.email
	)){
		return res.status(400).json({
			reason: "Missing required field(s)"
		})
	}

	let found_key = null
	let set_campaigns = []
	let make_admin = false
	let let_create_campaigns = false
	let let_create_registration_keys = false

	if(process.env.REGISTRATION_KEYS_REQUIRED || (config && config.registration.keys_required)){
		if(!req.body.registration_key){
			return res.status(401).json({
				reason: "A registration key is required"
			})
		}else{
			found_key = await RegistrationKeyModel.findOne({text: req.body.registration_key})

			if(!(found_key && (found_key.uses_total < 0 || found_key.uses_remaining > 0))){
				return res.status(400).json({
					reason: "Invalid or expired registration key"
				})
			}

			set_campaigns = found_key.add_to_campaign ? [found_key.add_to_campaign] : []
			make_admin = found_key.grants_administrator
			let_create_campaigns = found_key.grants_create_campaigns
			let_create_registration_keys = found_key.grants_create_registration_keys
		}
	}

	// Check that no existing users have this password
	const existing = await UserLoginModel.findOne({username: req.body.username})
	if(existing){
		return res.status(409).json({
			reason: "Username already taken"
		})
	}

	// Check that the password is not in a breach database
	const passwd_pwn_count = await has_been_pwned(req.body.password)
	if(passwd_pwn_count > 0){
		return res.status(400).json({
			reason: "Password found in breach database",
			breaches: passwd_pwn_count
		})
	}

	// Save profile object first, so that it can be linked to the login object
	const user_profile = new UserProfileModel({
		username: req.body.username,
		display_name: req.body.display_name,
		pronouns: req.body.pronouns,
		emails: [{
			address: req.body.email,
			verified: false,
			primary: true
		}],
		administrator: make_admin,
		can_create_campaigns: let_create_campaigns,
		can_create_registration_keys: let_create_registration_keys,
		campaigns: set_campaigns
	})

	await user_profile.save()

	// Then, save login object with a link to the profile
	const user_login = new UserLoginModel({
		username: req.body.username,
		password: req.body.password,
		profile: user_profile._id
	})

	await user_login.save()

	if(found_key && found_key.uses_total > 0){
		found_key.uses_remaining -= 1
		if(found_key.uses_remaining === 0){
			await found_key.remove()
		}else{
			await found_key.save()
		}
	}

	// Return the profile object
	return res.status(200).json(user_profile)
}

export const GetCurrentUser = async (req, res, next) => {
	if(!req.user){
		return res.sendStatus(500)
	}

	const found_user = await UserProfileModel.findById(req.user.user._id)
	if(!found_user){
		return res.sendStatus(500)
	}

	return res.status(200).json(found_user)
}

export const CreateRegistrationKey = async (req, res, next) => {
	if(!req.user){
		return res.sendStatus(500)
	}

	if(!req.user.user.can_create_registration_keys){
		return req.status(403).json({
			reason: "Not authorized to create new registration keys"
		})
	}

	if(!req.body.text){
		return req.status(400).json({
			reason: "Missing key text"
		})
	}

	if(req.body.grants_administrator && !req.user.user.administrator){
		return res.status(403).json({
			reason: "Not authorized to grant administrator permissions"
		})
	}

	if(req.body.grants_create_campaigns && !(req.user.user.can_create_campaigns || req.user.user.administrator)){
		return res.status(403).json({
			reason: "Not authorized to grant create_campaigns permissions"
		})
	}

	if(req.body.grants_create_registration_keys && !(req.user.user.can_create_registration_keys || req.user.user.administrator)){
		return res.status(403).json({
			reason: "Not authorized to grant create_registration_keys permissions"
		})
	}

	const existing_key = await RegistrationKeyModel.findOne({text: req.body.text})
	if(existing_key){
		return res.status(409).json({
			reason: "Another key with this text already exists"
		})
	}

	const new_key = new RegistrationKeyModel({
		creator: req.user.user._id,
		text: req.body.text,
		grants_administrator: req.body.grants_administrator,
		grants_create_campaigns: req.body.grants_create_campaigns,
		grants_create_registration_keys: req.body.grants_create_registration_keys
	})

	if(req.body.uses_total){
		new_key.uses_total = req.body.uses_total
		new_key.uses_remaining = req.body.uses_total
	}

	if(req.body.add_to_campaign){
		if(req.user.user.campaigns.filter((camp) => 
			camp.id === req.body.add_to_campaign
			&& camp.admin
		).length > 0){
			new_key.add_to_campaign = req.body.add_to_campaign
		}else{
			return res.status(403).json({
				reason: "You must be an administrator in a campaign to create a registration key for it."
			})
		}
	}

	if(req.body.expire_date){
		const parsed_expire_date = new Date(req.body.expire_date)
		if(!parsed_expire_date){
			return res.status(400).json({
				reason: "Expiration date cannot be parsed."
			})
		}
		if(parsed_expire_date < Date.now){
			return res.status(400).json({
				reason: "Expiration date is in the past."
			})
		}
		new_key.expire_date = parsed_expire_date
	}

	await new_key.save()

	return res.status(200).json(new_key)
}