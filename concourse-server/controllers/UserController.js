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

import crypto, { verify } from 'crypto'
import fetch from 'node-fetch'
import mongodb from 'mongodb'

import config from '../config/config.js'

import { UserLoginModel } from '../models/UserLoginSchema.js'
import { UserProfileModel } from '../models/UserProfileSchema.js'
import { EmailModel } from '../models/EmailSchema.js'
import { RegistrationKeyModel } from '../models/RegistrationKeySchema.js'

import { gen_IEX } from './XIDController.js'
import { add_user_to_campaign, safe_delete_member } from './CampaignController.js'
import { safe_delete_character } from './CharacterController.js'
import { send_verification_email, check_verification_email, post_verify_cleanup, safe_delete_email } from './MailController.js'
import { CampaignModel } from '../models/CampaignSchema.js'

const mail_regex = /^(?=[A-Z0-9][A-Z0-9@._%+-]{5,253}$)[A-Z0-9._%+-]{1,64}@(?:(?=[A-Z0-9-]{1,63}\.)[A-Z0-9]+(?:-[A-Z0-9]+)*\.){1,8}[A-Z]{2,63}$/i

/* Checks a password against the HaveIBeenPwned breachlist. This is used to
 * prevent users from using weak and/or breached passwords.
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

export const process_user_for_user = async (requested_user, requesting_user) => {
	if(
		requesting_user
		&& requested_user._id.toString() === requesting_user._id.toString()
	){
		return requested_user
	}else{
		return {
			_id: requested_user._id,
			username: requested_user.username,
			iex: requested_user.iex,
			pronouns: requested_user.pronouns
		}
	}
}

export const safe_delete_user = async (user) => {
	await user.populate('members').populate('emails').populate('login').execPopulate('characters')

	for(const member of user.members){
		await safe_delete_member(member)
	}

	for(const email of user.emails){
		await safe_delete_email(email)
	}

	for(const character of user.characters){
		await safe_delete_character(character)
	}

	await UserLoginModel.findByIdAndDelete(user.login._id)
	await UserProfileModel.findByIdAndDelete(user._id)
}

export const GetRegistrationOptions = async (req, res, next) => {
	return res.status(200).json({
		keys_required: process.env.REGISTRATION_KEYS_REQUIRED || (config && config.registration.keys_required)
	})
}

/* User registration function
 * 
 * Expects the following fields:
 * {
 *   [Required fields]
 *   username: (String) username for the new user
 *   password: (String) password for the new user
 *   pronouns: (ObjectId) link to PreferredPronounsSchema representing this 
 *             user's preferred pronouns
 *   email: (String) Primary e-mail to use for the new user
 *   registration_key: (String) The registration key to use for this
 *                     registration. NOTE that if the server does not require 
 *                     registration keys, this field is optional.
 * }
 * 
 * Returns 200 if the user was successfully created, 400 if some part of the
 * input data is malformed, 401 if registration keys are required and the user
 * did not provide one (or provided an invalid one), 409 if the username
 * requested is already taken, and 500 if an unexpected error occurs (this
 * should hopefully never happen).
 *
 * If the status code is 200, it will return a JSON object representing the new
 * user's profile - the object will be as UserProfileSchema, with an added "_id"
 * field representing the user's unique ID.
 *
 * In case of a user problem (code 400/409), it will return a JSON object
 * representing the problem. This object will always contain a "reason" field
 * representing the reason the user could not be created. Certain specific error
 * codes/reasons may have extra fields.
 *
 * This function will verify that the password provided is not found in the
 * Pwned Passwords database. If the password *is* found, it will return 400,
 * with reason "Password found in breach database". The object returned will
 * also contain a "breaches" key, representing the number of times the password
 * has been found in breaches.
 */
export const RegisterUser = async (req, res, next) => {
	// Verify that all required fields exist
	if(!(
		req.body.username
		&& req.body.password
		&& req.body.pronouns
		&& req.body.pronouns.subject
		&& req.body.pronouns.object
		&& req.body.pronouns.dependent_possessive
		&& req.body.pronouns.independent_possessive
		&& req.body.pronouns.reflexive
		&& req.body.email
	)){
		return res.status(400).json({
			reason: "Missing required field(s)"
		})
	}

	let found_key = null
	let set_campaign = null
	let campaign_obj = null
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
				return res.status(401).json({
					reason: "Invalid or expired registration key"
				})
			}

			if(found_key.campaign){
				set_campaign = found_key.campaign
				campaign_obj = await CampaignModel.findById(set_campaign.cid)
				if(!campaign_obj){
					return res.status(404).json({
						reason: "Key is associated with a campaign that does not exist.",
						campaign: set_campaign.cid
					})
				}
			}

			make_admin = found_key.grants_administrator
			let_create_campaigns = found_key.grants_create_campaigns
			let_create_registration_keys = found_key.grants_create_registration_keys
		}
	}

	// Disallow the use of certain usernames
	const username_blacklist = [
		"root",
		"system",
		"admin",
		"administrator",
		"webmaster",
		"syadmin"
	]

	// Ensure that usernames only contain letters, numbers, and _.-
	const acceptable_username_regex = /^[a-zA-Z0-9_.-]+$/

	// Check validity of username
	const good_uname = acceptable_username_regex.test(req.body.username)
	if(!good_uname){
		return res.status(400).json({
			reason: "Username contains unacceptable characters."
		})
	}

	let uname_blacklisted = false

	username_blacklist.forEach((item, index) => {
		if(req.body.username.toLowerCase() === item){
			uname_blacklisted = true
		}
	})

	if(uname_blacklisted){
		return res.status(400).json({
			reason: "Username has been blacklisted."
		})
	}

	// Check that the email is plausible
	if(!mail_regex.test(req.body.email)){
		return res.status(400).json({
			reason: "Email address is not syntactically valid."
		})
	}

	// Ensure that the e-mail address is not already in use
	const email_duplicate = await EmailModel.findOne({address: req.body.email, verified: true})
	if(email_duplicate){
		return res.status(400).json({
			reason: "Email address is already in use."
		})
	}

	// Generate an ID extension for this user and ensure that the extended ID
	// (i.e. username + ID extension) is unique
	let xid_entry = null
	let user_IEX = ''

	do{
		user_IEX = gen_IEX()
		console.log('Generated IEX ' + user_IEX)

		xid_entry = await UserProfileModel.findOne({"username": req.body.username, "iex": user_IEX})
		console.log(xid_entry)
	}while(xid_entry)

	// Check that the password is not in a breach database
	const passwd_pwn_count = await has_been_pwned(req.body.password)
	if(passwd_pwn_count > 0){
		return res.status(400).json({
			reason: "Password found in breach database",
			breaches: passwd_pwn_count
		})
	}

	// Create profile object first, so that it can be linked to the login object
	const user_profile = new UserProfileModel({
		username: req.body.username,
		iex: user_IEX,
		pronouns: {
			subject: req.body.pronouns.subject,
			object: req.body.pronouns.object,
			dependent_possessive: req.body.pronouns.dependent_possessive,
			independent_possessive: req.body.pronouns.independent_possessive,
			reflexive: req.body.pronouns.reflexive
		},
		administrator: make_admin,
		can_create_campaigns: let_create_campaigns,
		can_create_registration_keys: let_create_registration_keys,
	})

	// Then, create the email object for the primary email
	const user_email = new EmailModel({
		address: req.body.email,
		verified: false,
		primary: true,
		user: user_profile._id
	})

	await user_profile.save()
	await user_email.save()

	// Then, save login object with a link to the profile
	const user_login = new UserLoginModel({
		profile: user_profile._id,
		password: req.body.password,
		email: user_email._id
	})

	await user_login.save()

	// If relevant, add the user to the key's campaign
	if(set_campaign){
		await add_user_to_campaign(user_profile, campaign_obj, set_campaign.roles)
		// const user_cmember = new CampaignMemberModel({
		// 	user: user_profile._id,
		// 	roles: set_campaign.roles
		// })

		// await user_cmember.save()

		// campaign_obj.members.push(user_cmember)

		// await campaign_obj.save()
	}

	if(found_key && found_key.uses_total > 0){
		found_key.uses_remaining -= 1
		if(found_key.uses_remaining === 0){
			await found_key.remove()
		}else{
			await found_key.save()
		}
	}

	// Send verification e-mail
	send_verification_email(user_profile._id, req.body.email)

	// Return the profile object
	return res.status(200).json(user_profile)
}

export const DoVerify = async (req, res, next) => {
	try{
		const verify_result = await check_verification_email(req.params.id)
		if(!verify_result){
			return res.sendStatus(404)
		}

		const email = await EmailModel.findOne({
			address: verify_result.address,
			user: verify_result.uid
		})

		if(!email){
			return res.sendStatus(404)
		}else{
			email.verified = true
			await email.save()
			await post_verify_cleanup(email.address)
			return res.sendStatus(200)
		}
	}catch(err){
		console.error(err)
		return res.sendStatus(400)
	}
}

export const ChangeIEX = async (req, res, next) => {
	/* istanbul ignore if */
	if(!req.user){
		return res.sendStatus(500)
	}

	const found_user = await UserProfileModel.findById(req.user.user._id)

	/* istanbul ignore if */
	if(!found_user){
		return res.sendStatus(500)
	}

	// Generate an ID extension for this user and ensure that the extended ID
	// (i.e. username + ID extension) is unique
	let xid_entry = null
	let user_IEX = ''

	do{
		user_IEX = gen_IEX()

		xid_entry = await UserProfileModel.findOne({"username": found_user.username, "iex": user_IEX})
	}while(xid_entry)

	found_user.iex = user_IEX
	await found_user.save()

	return res.status(200).json(found_user)
}

export const GetCurrentUser = async (req, res, next) => {
	// We should never reach this section, so exclude from coverage report
	/* istanbul ignore if */
	if(!req.user){
		return res.sendStatus(500)
	}

	const found_user = await UserProfileModel.findById(req.user.user._id)
	/* istanbul ignore if */
	if(!found_user){
		return res.sendStatus(500)
	}

	return res.status(200).json(found_user)
}

export const CreateRegistrationKey = async (req, res, next) => {
	/* istanbul ignore if */
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