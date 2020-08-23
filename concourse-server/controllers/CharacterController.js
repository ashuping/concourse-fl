/* City of Concourse Website - Character Controller
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
const Model = mongoose.Model

import { CampaignModel } from '../models/CampaignSchema.js'
import { UserProfileModel } from '../models/UserProfileSchema.js'
import { get_permissions, process_campaign_for_user, safe_delete_instance } from './CampaignController.js'
import { CharacterModel, CharacterInstanceModel, CharacterInstanceAttributeValueModel, CampaignCharacterAttributeModel } from '../models/CharacterSchema.js'
import { process_user_for_user } from './UserController.js'

export const determine_type = (val) => {
	if(val instanceof Model){
        return 'object'
    }else if(typeof(val) === typeof(Number())){
        return 'number'
    }else if(typeof(val) === typeof(Boolean())){
        return 'boolean'
    }else if(typeof(val) === typeof(String())){
        return 'string'
    }else if(val instanceof Object){
        return 'jsonified_object'
    }else if(val === null){
        return 'null'
    }else{
        console.error(`[CharacterController.js > determine_type()] Attempted to set unsupported value type "${typeof(val)}" - this will be stored as null.`)
        return 'null'
    }
}

export const process_char_for_user = async (char, user, include_instances = true, populate_instance_campaign = false) => {
	await char.execPopulate('owner')
	const char_proc = {
		_id: char._id,
		name: char.name,
		description: char.description,
		owner: await process_user_for_user(char.owner, user)
	}

	if(include_instances){
		char_proc.instances = []
	}

	// Construct a list of campaigns that the user has at least 'view' access to
	await user.execPopulate({
		path: 'members',
		populate: 'campaign'
	})
	const valid_campaigns_for_user = (await Promise.all(user.members.filter(async (mem) => {
		return ((await get_permissions(user, mem.campaign)).view)
	}))).map((mem) => mem.campaign._id.toString())

	if(include_instances){
		await char.execPopulate('instances')
		const instances_filtered = await Promise.all(char.instances.filter((inst) => {
			// Only include instances for campaigns that the user can view
			return (valid_campaigns_for_user.includes(inst.campaign.toString()))
		}).map(async (inst) => {
			// Process all instances to be included
			return (await process_instance_for_user(inst, user, false, populate_instance_campaign))
		}))

		char_proc.instances.push(...instances_filtered)
	}

	return char_proc
}

export const process_instance_for_user = async (instance, user, include_character = true, populate_campaign = false) => {
	await instance.populate('character').populate('campaign').execPopulate({
		path: 'attributes',
		populate: {
			path: 'campaign_character_attribute'
		}
	})

	const inst_proc = {
		_id: instance._id,
		campaign: (populate_campaign ? await process_campaign_for_user(instance.character.owner, instance.campaign) : instance.campaign._id),
		attributes: []
	}

	if(include_character){
		inst_proc.character = await process_char_for_user(instance.character, user, false, false)
	}

	for(const attr of instance.attributes){
		inst_proc.attributes.push({
			_id: attr._id,
			campaign_character_attribute: {
				_id: attr.campaign_character_attribute._id,
				name: attr.campaign_character_attribute.name,
				description: attr.campaign_character_attribute.description,
				type: attr.campaign_character_attribute.attType
			},
			type: attr._attType,
			val: attr.val
		})
	}

	return inst_proc
}

export const user_can_see_char = async (user, char) => {
	if(!(user instanceof UserProfileModel)){
		user = await UserProfileModel.findById(user)
	}

	if(!(char instanceof CharacterModel)){
		char = await CharacterModel.findById(char)
	}

	if(!(user && char)){
		return false
	}

	if(char.owner.toString() === user.toString()){
		return true
	}


	await user.execPopulate('members')
	await char.execPopulate('instances')

	for(const member of user.members){
		const matched_instances = char.instances.filter((inst) => {
			return (inst.campaign.toString() === member.campaign.toString())
		})

		if(matched_instances.length === 0){
			continue
		}

		const perms = await get_permissions(user, member.campaign)
		if(perms.view){
			return true
		}
	}

	return false
}

export const safe_delete_character = async (char) => {
	await char.execPopulate('instances')

	for(const inst of char.instances){
		await safe_delete_instance(inst)
	}

	await CharacterModel.findByIdAndDelete(char._id)
}

export const CreateCharacter = async (req, res, next) => {
    if(!req.user){
        console.error('[CreateCharacter] Protected control was successfully accessed without authentication (or authentication did not return a user object)!')
        return res.sendStatus(500)
	}

    if(!(
		req.body.name &&
		req.body.description
	)){
		return res.status(400).send({
			reason: 'Missing required fields'
		})
	}

	const new_char = new CharacterModel({
		owner: req.user.user._id,
		name: req.body.name,
		description: req.body.description
	})

	const warnings = []
	
	const cid_bad_msg = "Requested campaign does not exist (or is private)"

	if(req.body.campaigns){
		for(const campaign_block of req.body.campaigns){
			if(!campaign_block.cid){
				warnings.push({
					warning: 'Cannot request addition to a campaign without providing a campaign'
				})
				continue
			}

			const campaign = await CampaignModel.findById(campaign_block.cid)

			if(!(campaign)){
				warnings.push({
					warning: cid_bad_msg,
					cid: campaign_block.cid
				})
				continue
			}
			
			const perms = await get_permissions(req.user.user, campaign)

			if(!(perms.view)){
				warnings.push({
					warning: cid_bad_msg,
					cid: campaign_block.cid
				})
				continue
			}

			if(!perms.make_character){
				warnings.push({
					warning: 'You do not have permission to make a character for this campaign',
					cid: campaign_block.cid
				})
				continue
			}

			const new_instance = new CharacterInstanceModel({
				character: new_char._id,
				campaign: campaign._id
			})

			await new_instance.save()
		}
	}

	await new_char.save()

	await new_char.execPopulate('instances')

	return res.status(200).json({
		warnings: warnings,
		character: await process_char_for_user(new_char, req.user.user, true, true)
	})
}

export const GetCharacter = async (req, res, next) => {
	if(!req.user){
		console.error('[GetCharacter] Protected control was successfully accessed without authentication (or authentication did not return a user object)!')
		return res.sendStatus(500)
	}

	if(!(
		req.params.charid
	)){
		return res.status(400).json({
			reason: 'Missing required field(s).'
		})
	}

	const char = await CharacterModel.findById(req.params.charid)

	if(!(
		char && 
		(await user_can_see_char(req.user.user, char))
	)){
		return res.status(404).json({
			reason: 'Requested character does not exist (or is private).'
		})
	}

	const char_proc = await process_char_for_user(char, req.user.user, ((req.body.short) ? false : true), true)

	return res.status(200).json(char_proc)
}

export const EditCharacter = async (req, res, next) => {
	if(!req.user){
		console.error('[EditCharacter] Protected control was successfully accessed without authentication (or authentication did not return a user object)!')
		return res.sendStatus(500)
	}

	if(!(
		req.params.charid
	)){
		return res.status(400).json({
			reason: 'Missing required field(s).'
		})
	}

	const to_edit = await CharacterModel.findById(req.params.charid)

	if(!(
		to_edit && 
		(to_edit.owner.toString() === req.user.user._id.toString())
	)){
		return res.status(404).json({
			reason: `Character with ID ${req.params.charid} does not exist (or cannot be edited by you).`
		})
	}

	if(req.body.name){
		to_edit.name = req.body.name
	}

	if(req.body.description){
		to_edit.description = req.body.description
	}

	await to_edit.save()

	return res.status(200).json(await process_char_for_user(to_edit, req.user.user, true, true))
}

export const SetCharacterAttribute = async (req, res, next) => {
	if(!req.user.user){
		console.error('[SetCharacterAttribute] Protected control was successfully accessed without authentication (or authentication did not return a user object)!')
		return res.sendStatus(500)
	}

	if(!(
		req.params.charid &&
		req.params.attrid
	)){
		return res.status(400).json({
			reason: 'Missing required field(s).'
		})
	}

	const instance = await CharacterInstanceModel.findById(req.params.charid)

	if(!instance){
		return res.status(400).json({
			reason: `No such instance ${req.params.charid}`
		})
	}

	const attribute = await CampaignCharacterAttributeModel.findById(req.params.attrid)

	if(!attribute){
		return res.status(400).json({
			reason: `No such attribute ${req.params.attrid}`
		})
	}

	await instance.execPopulate('campaign')
	const perms = await get_permissions(req.user.user, instance.campaign)

	if(!perms.administrate){
		return res.status(403).json({
			reason: 'You do not have permission to set character attributes for this campaign.'
		})
	}

	if(determine_type(req.body.val) !== attribute.attType){
		let cast_succeeded = false

		if(attribute.attType === 'number'){
			const cast_val = parseFloat(req.body.val)
			if(!isNaN(cast_val)){
				req.body.val = cast_val
				cast_succeeded = true
			}
		}

		if(!cast_succeeded){
			return res.status(400).json({
				reason: `Could not cast provided value to match the attribute type.`,
				attribute_type: attribute.type
			})
		}
	}

	if(instance.campaign._id.toString() !== attribute.campaign.toString()){
		return res.status(400).json({
			reason: `The provided character instance is not from the same campaign as the provided attribute.`
		})
	}

	let extantValue = await CharacterInstanceAttributeValueModel.findOne({
		character_instance: instance._id,
		campaign_character_attribute: attribute._id
	})

	if(!extantValue){
		extantValue = new CharacterInstanceAttributeValueModel({
			character_instance: instance._id,
			campaign_character_attribute: attribute._id,
			val: req.body.val
		})
	}else{
		extantValue.val = req.body.val
	}

	await extantValue.save()

	return res.sendStatus(200)
}

export const GetCharacterAttribute = async (req, res, next) => {
	if(!req.user.user){
		console.error('[SetCharacterAttribute] Protected control was successfully accessed without authentication (or authentication did not return a user object)!')
		return res.sendStatus(500)
	}

	if(!(
		req.params.charid &&
		req.params.attrid
	)){
		return res.status(400).json({
			reason: 'Missing required field(s).'
		})
	}

	const instance = await CharacterInstanceModel.findById(req.params.charid)
	const bad_inst_text = 'Requested instance does not exist (or is private).'

	if(!instance){
		return res.status(404).json({
			reason: bad_inst_text
		})
	}

	const perms = await get_permissions(req.user.user, instance.campaign)
	if(!perms.view){
		return res.status(404).json({
			reason: bad_inst_text
		})
	}

	const attribute = await CampaignCharacterAttributeModel.findById(req.params.attrid)

	if(!attribute){
		return res.status(400).json({
			reason: `No such attribute ${req.params.attrid}`
		})
	}

	if(instance.campaign.toString() !== attribute.campaign.toString()){
		console.warn(`Inst: ${JSON.stringify(instance)}\nAttr: ${JSON.stringify(attribute)}`)
		return res.status(400).json({
			reason: `The provided character instance is not from the same campaign as the provided attribute.`
		})
	}

	await instance.execPopulate('campaign')

	const extantValue = await CharacterInstanceAttributeValueModel.findOne({
		character_instance: instance._id,
		campaign_character_attribute: attribute._id
	})

	if(extantValue){
		return res.status(200).json({
			val: extantValue.val
		})
	}else{
		return res.status(200).json({
			val: null
		})
	}
}

export const GetInstance = async (req, res, next) => {
	if(!req.user.user){
		console.error('[GetAllCharacterAttributes] Protected control was successfully accessed without authentication (or authentication did not return a user object)!')
		return res.sendStatus(500)
	}

	if(!(
		req.params.charid
	)){
		return res.status(400).json({
			reason: 'Missing required fields'
		})
	}

	let instance = null

	try{
		instance = await CharacterInstanceModel.findById(req.params.charid)
	}catch(err){
		return res.status(400).json({
			reason: 'Malformed request.'
		})
	}

	if(!(
		instance &&
		(await get_permissions(req.user.user, instance.campaign)).view
	)){
		return res.status(404).json({
			reason: `Instance does not exist (or is private).`
		})
	}

	const instance_proc = await process_instance_for_user(instance, req.user.user, true, true)

	return res.status(200).json(instance_proc)
}

export const DeleteInstance = async (req, res, next) => {
	if(!req.user.user){
		console.error('[DeleteInstance] Protected control was successfully accessed without authentication (or authentication did not return a user object)!')
		return res.sendStatus(500)
	}

	if(!(
		req.params.instid
	)){
		return res.status(400).json({
			reason: 'Missing required fields'
		})
	}

	let instance = null

	try{
		instance = await CharacterInstanceModel.findById(req.params.instid)
	}catch(err){
		return res.status(400).json({
			reason: 'Malformed request.'
		})
	}

	if(!(
		instance &&
		(
			(await get_permissions(req.user.user, instance.campaign)).view ||
			(instance.character.owner._id.toString() === req.user.user._id.toString())
		)
	)){
		return res.status(404).json({
			reason: `Instance does not exist (or is private).`
		})
	}

	await instance.populate({
		path: 'character',
		populate: 'owner'
	}).execPopulate()

	if(!(
		(instance.character.owner._id.toString() === req.user.user._id.toString()) ||
		(await get_permissions(req.user.user, instance.campaign)).administrate
	)){
		return res.status(403).json({
			reason: "Cannot remove an instance associated with another user's character, unless you are a campaign administrator."
		})
	}

	await safe_delete_instance(instance)
	return res.sendStatus(200)
}

export const DeleteCharacter = async (req, res, next) => {
	if(!req.user.user){
		console.error('[DeleteCharacter] Protected control was successfully accessed without authentication (or authentication did not return a user object)!')
		return res.sendStatus(500)
	}

	if(!(
		req.params.charid
	)){
		return res.status(400).json({
			reason: 'Missing required fields'
		})
	}

	let character = null

	try{
		character = await CharacterModel.findById(req.params.charid)
	}catch(err){
		return res.status(400).json({
			reason: 'Malformed request.'
		})
	}

	if(!(
		character &&
		(character.owner._id.toString() === req.user.user._id.toString())
	)){
		return res.status(404).json({
			reason: `Character does not exist (or does not belong to you).`
		})
	}

	await safe_delete_character(character)
	return res.sendStatus(200)
}
