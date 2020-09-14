/* City of Concourse Website - Campaign Controller
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

import { CampaignModel, CampaignMemberModel, CampaignRoleModel } from '../models/CampaignSchema.js'
import { CampaignCharacterAttributeModel, CharacterInstanceAttributeValueModel, CharacterInstanceModel } from '../models/CharacterSchema.js'
import { UserProfileModel } from '../models/UserProfileSchema.js'
import { process_instance_for_user } from './CharacterController.js'

export const roles_to_perms = (roles) => {
    if(!roles){
        return {
            view: false,
            play: false,
            start: false,
            make_character: false,
            administrate: false
        }
    }

    const perms = {
        view: {val: false, pri: -1},
        play: {val: false, pri: -1},
        start: {val: false, pri: -1},
        make_character: {val: false, pri: -1},
        administrate: {val: false, pri: -1}
    }

    for(const role of roles){
        if(role.grants){
            if(role.grants.view && perms.view.pri < role.priority){
                perms.view.val = true
                perms.view.priority = role.priority
            }
            if(role.grants.play && perms.play.pri < role.priority){
                perms.play.val = true
                perms.play.priority = role.priority
            }
            if(role.grants.make_character && perms.make_character.pri < role.priority){
                perms.make_character.val = true
                perms.make_character.priority = role.priority
            }
            if(role.grants.start && perms.start.pri < role.priority){
                perms.start.val = true
                perms.start.priority = role.priority
            }
            if(role.grants.administrate && perms.administrate.pri < role.priority){
                perms.administrate.val = true
                perms.administrate.priority = role.priority
            }
        }
        if(role.denies){
            if(role.denies.view && perms.view.pri < role.priority){
                perms.view.val = false
                perms.view.priority = role.priority
            }
            if(role.denies.play && perms.play.pri < role.priority){
                perms.play.val = false
                perms.play.priority = role.priority
            }
            if(role.denies.make_character && perms.make_character.pri < role.priority){
                perms.make_character.val = false
                perms.make_character.priority = role.priority
            }
            if(role.denies.start && perms.start.pri < role.priority){
                perms.start.val = false
                perms.start.priority = role.priority
            }
            if(role.denies.administrate && perms.administrate.pri < role.priority){
                perms.administrate.val = false
                perms.administrate.priority = role.priority
            }
        }
    }


    return {
        view: perms.view.val,
        play: perms.play.val,
        make_character: perms.make_character.val,
        start: perms.start.val,
        administrate: perms.administrate.val
    }
}

export const get_permissions = async (user, campaign) => {
    const no_perms = {
        view: false,
        play: false,
        start: false,
        make_character: false,
        administrate: false
    }

    if(!(user instanceof UserProfileModel)){
        user = await UserProfileModel.findById(user)
    }

    if(!(campaign instanceof CampaignModel)){
        campaign = await CampaignModel.findById(campaign)
    }

    let roles = []

    if(!(campaign && user)){
        return no_perms
    }

    await campaign.execPopulate('members')
    for(const member of campaign.members){
        if(String(member.user) === String(user._id)){
            await member.execPopulate('roles')
            roles = member.roles
            break
        }
    }

    if(!roles){
        return no_perms
    }

    return roles_to_perms(roles)
}

export const add_user_to_campaign = async (user, campaign, init_roles) => {
    const user_member = new CampaignMemberModel({
        user: user._id,
        roles: init_roles,
        campaign: campaign._id
    })

    await user_member.save()

    return user_member
}

export const process_campaign_for_user = async (user, campaign, member, include_instances = false) => {

    if(!(user instanceof UserProfileModel)){
        user = await UserProfileModel.findById(user)
    }

    if(!campaign instanceof CampaignModel){
        campaign = await CampaignModel.findById(campaign)
    }

    if(!member){
        member = await CampaignMemberModel.findOne({
            user: user,
            campaign: campaign._id
        })
    }

    if(!(
        user && campaign && member
    )){
        console.warn(`Invalid data passed to process_campaign_for_user (U: ${user}; C: ${campaign}; M: ${member})`)
        return null
    }

    await campaign.populate('creator').populate('characters').populate('roles')
        .populate('attributes').populate('activeSessions').populate({
            path: 'members',
            populate: {
                path: 'roles user'
            }
        }).execPopulate()
    await member.execPopulate('roles')

    const redone_perms = roles_to_perms(member.roles)

    const insts = []

    for(const inst of campaign.characters){
        if(include_instances){
            insts.push(await process_instance_for_user(inst, user, true, false))
        }else{
            insts.push(inst._id)
        }
    }

    const procStruct = {
        members: campaign.members,
        _id: campaign._id,
        name: campaign.name,
        description: campaign.description,
        creator: campaign.creator,
        roles: campaign.roles,
        instances: insts,
        attributes: campaign.attributes,
        permissions: redone_perms
    }

    if(redone_perms.play){
        if(campaign.activeSessions && campaign.activeSessions.length !== 0){
            procStruct['active'] = true
            procStruct['sessions'] = campaign.activeSessions.map((session) => session._id)
        }else{
            procStruct['active'] = false
        }
    }
    
    return procStruct
}

export const safe_delete_instance = async (instance) => {
    if(!instance){
        console.warn(`[CampaignController.js > safe_delete_instance()] Provided instance does not exist.`)
        return
    }

    await instance.execPopulate('attributes')
    for(const attribute of instance.attributes){
        await CharacterInstanceAttributeValueModel.findByIdAndDelete(attribute._id)
    }
    await CharacterInstanceModel.findByIdAndDelete(instance._id)
}

export const safe_delete_member = async (member) => {
    if(!member){
        console.warn(`[CampaignController.js > safe_delete_member()] Provided member does not exist.`)
        return
    }

    await member.populate({
        path: 'campaign',
        populate: 'characters'
    }).execPopulate()

    for(const instance of member.campaign.characters){
        await instance.execPopulate('character')
        if(instance.character.owner.toString() === member.user.toString()){
            await safe_delete_instance(instance)
        }
    }

    await CampaignMemberModel.findByIdAndDelete(member._id)
}

/* Create a new campaign
 */
export const CreateCampaign = async (req, res, next) => {
	if(!req.user){
		return res.sendStatus(500)
    }

    if(!req.user.user.can_create_campaigns){
        return res.status(401).json({
            reason: "Not authorized to create campaigns."
        })
    }

    const user_profile = req.user.user

	if(!(
		req.body.name
		&& req.body.description
	)){
		return res.status(400).json({
			reason: "Missing required fields"
		})
    }

    const new_campaign = new CampaignModel({
        name: req.body.name,
        description: req.body.description,
        creator: user_profile._id,
        members: [],
        roles: []
    })

    const admin_role = new CampaignRoleModel({
        name: "Administrator",
        campaign: new_campaign._id,
        priority: 1,
        grants: {
            view: true,
            play: true,
            make_character: true,
            start: true,
            administrate: true
        },
        denies: {
            view: false,
            play: false,
            make_character: false,
            start: false,
            administrate: false
        }
    })

    const player_role = new CampaignRoleModel({
        name: "Player",
        campaign: new_campaign._id,
        priority: 0,
        grants: {
            view: true,
            play: true,
            make_character: true,
            start: false,
            administrate: false
        },
        denies: {
            view: false,
            play: false,
            make_character: false,
            start: false,
            administrate: false
        }
    })

    await add_user_to_campaign(user_profile, new_campaign, [admin_role._id])

    new_campaign.roles.push(player_role._id)
    new_campaign.roles.push(admin_role._id)

    await new_campaign.save()
    await admin_role.save()
    await player_role.save()

    return res.status(200).json(new_campaign)
}

/* Retrieve all of a user's campaigns
 */
export const RetrieveAllCampaigns = async (req, res, next) => {
	if(!req.user){
		return res.sendStatus(500)
    }

    const user_profile = req.user.user

    const memberObjects = await CampaignMemberModel.find({user: user_profile._id})

	if(memberObjects && memberObjects.length > 0){
        let campaigns = []
        for(const member of memberObjects){
            await member.populate('campaign').execPopulate('roles')
            if((await get_permissions(req.user.user, member.campaign)).view){
                campaigns.push(await process_campaign_for_user(user_profile, member.campaign, member, true))
            }
        }
		res.status(200).json(campaigns)
	}else{
		res.sendStatus(404)
	}
}

/* Retrieve a single campaign by ID
 */
export const RetrieveCampaign = async (req, res, next) => {
    if(!req.user){
        return res.sendStatus(500)
    }

    if(!(
        req.params.id
    )){
        return res.status(400).json({
            reason: 'Missing required fields'
        })
    }

    const campaign = await CampaignModel.findById(req.params.id)
    const perms = await get_permissions(req.user.user, campaign)

    if(!(
        perms && 
        perms.view
    )){
        return res.status(400).json({
            reason: 'Campaign does not exist (or is private).'
        })
    }
    
    const campaign_processed = await process_campaign_for_user(req.user.user, campaign, null, true)
    return res.status(200).json(campaign_processed)
}

export const CreateInstanceAttribute = async (req, res, next) => {
    if(!req.user){
        return res.sendStatus(500)
    }

    if(!(
        req.params.id &&
        req.body.name &&
        req.body.type &&
        req.body.description
    )){
        return res.status(400).json({
            reason: 'Missing required fields'
        })
    }

    const acceptable_types = ['number', 'string', 'boolean', 'object', 'jsonified_object', 'null']

    if(!acceptable_types.includes(req.body.type)){
        return res.status(400).json({
            reason: 'Unknown type',
            acceptable_types: acceptable_types
        })
    }

    const campaign = await CampaignModel.findById(req.params.id)
    const perms = await get_permissions(req.user.user, campaign)

    if(!(
        perms &&
        perms.view
    )){
        return res.status(400).json({
            reason: 'Campaign does not exist (or is private).'
        })
    }

    if(!perms.administrate){
        return res.status(403).json({
            reason: 'You do not have permission to edit attributes for this campaign'
        })
    }

    const attr = new CampaignCharacterAttributeModel({
        campaign: campaign._id,
        name: req.body.name,
        type: req.body.type,
        description: req.body.description
    })

    await attr.save()

    return res.status(200).json(attr)
}