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

import { UserLoginModel } from '../models/UserLoginSchema.js'
import { UserProfileModel } from '../models/UserProfileSchema.js'

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
 * 
 *   [Optional fields]
 *   campaigns: [{
 *     id: (ObjectId) link to CampaignSchema representing a campaign to add this user to
 *     admin: (Boolean) whether this user should be an administrator for this campaign
 *   }]
 *   administrator: (Boolean) whether the new user should be a global administrator
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
			success: false,
			reason: "Missing required field(s)"
		})
	}

	// Check that no existing users have this password
	const existing = await UserLoginModel.findOne({username: req.body.username})
	if(existing){
		return res.status(409).json({
			success: false,
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

	// Add the user to the listed campaigns
	let campaigns = []
	if(req.body.campaigns){
		try{
			campaigns = validate_campaigns(req.body.campaigns)
		}catch(e){
			if(Object.keys(e).contains("code") && Object.keys(e).contains("message")){
				// If validate_campaigns raises an exception, it should only be
				// because of malformed input - return the appropriate data.
				return res.status(e.code).json({
					reason: e.message
				})
			}else{
				// In case something else throws an error in that message, send
				// a 500 error code. Hopefully, we never reach this line.
				return res.sendStatus(500)
			}
		}
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
		administrator: false,
		can_create: false,
		campaigns: campaigns
	})

	user_profile.save()

	// Then, save login object with a link to the profile
	const user_login = new UserLoginModel({
		username: req.body.username,
		password: req.body.password,
		profile: user_profile._id
	})

	user_login.save()

	// Return the profile object
	return res.status(200).json(user_profile)
}