/* City of Concourse Website - Campaign Controller
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

import { CampaignModel, CampaignMemberModel, CampaignRoleModel } from '../models/CampaignSchema.js'
import mongodb from 'mongodb'
import { UserProfileModel } from '../models/UserProfileSchema.js'

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

    console.log(`Roles: ${JSON.stringify(roles)}\nPerms: ${JSON.stringify(perms)}`)


    return {
        view: perms.view.val,
        play: perms.play.val,
        make_character: perms.make_character.val,
        start: perms.start.val,
        administrate: perms.administrate.val
    }
}

export const get_permissions = async (user, campaign) => {
    console.log(`USER: ${JSON.stringify(user)}`)
    let roles = []

    await campaign.execPopulate('members')
    for(const member of campaign.members){
        console.log(`MEMBER: ${JSON.stringify(member)}`)
        console.log(`MID is ${member.user}; UID is ${user._id}`)
        if(String(member.user) === String(user._id)){
            console.log(`ID match.`)
            await member.execPopulate('roles')
            roles = member.roles
        }
        break
    }

    if(!roles){
        return {
            view: false,
            play: false,
            start: false,
            make_character: false,
            administrate: false
        }
    }

    return roles_to_perms(roles)
}

export const add_user_to_campaign = async (user, campaign, init_roles) => {
    const user_member = new CampaignMemberModel({
        user: user._id,
        roles: init_roles,
        campaign: campaign._id
    })

    campaign.members.push(user_member)

    await user_member.save()
    await campaign.save()

    return user_member
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

/* Retrieves all of a user's campaigns
 */
export const RetrieveAllCampaigns = async (req, res, next) => {
	if(!req.user){
		return res.sendStatus(500)
    }

    const user_profile = req.user.user

    const memberObjects = await CampaignMemberModel.find({user: user_profile._id})

	if(memberObjects && memberObjects.length > 0){
        console.log(memberObjects)
        // await memberObjects.execPopulate('roles')
        let campaigns = []
        for(const member of memberObjects){
            console.log(member)
            await member.execPopulate('roles')
            const campaign = await CampaignModel.findOne({members: member._id})
            await campaign.populate('creator').populate('roles').populate({
                path: 'members',
                populate: {
                    path: 'roles user'
                }
            }).execPopulate()
            const redone_perms = roles_to_perms(member.roles)
            const camp_filtered = {
                members: campaign.members,
                _id: campaign._id,
                name: campaign.name,
                description: campaign.description,
                creator: campaign.creator,
                roles: campaign.roles,
                permissions: redone_perms
            }
            console.log(`camp_filtered = ${camp_filtered}`)
            campaigns.push(camp_filtered)
        }
        for(const camp of campaigns){
            console.log(`campaign = ${camp}`)
        }
		res.status(200).json(campaigns)
	}else{
		res.sendStatus(404)
	}
}