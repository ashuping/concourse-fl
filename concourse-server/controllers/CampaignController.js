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

/* Create a new campaign
 */
export const CreateCampaign = async (req, res, next) => {
	if(!req.user){
		return res.sendStatus(500)
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
        members: []
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

    const player = new CampaignMemberModel({
        user: user_profile._id,
        roles: [admin_role._id]
    })

    new_campaign.members = [player._id]

    await new_campaign.save()
    await player.save()
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

	if(memberObjects){
        // await memberObjects.execPopulate('roles')
        let campaigns = []
        for(const member of memberObjects){
            await member.execPopulate('roles')
            const campaign = await CampaignModel.findOne({members: member._id})
            await campaign.populate('creator').populate({
                path: 'members',
                populate: {
                    path: 'roles user'
                }
            }).execPopulate()
            const perms = {
                view: {val: false, pri: -1},
                play: {val: false, pri: -1},
                start: {val: false, pri: -1},
                make_character: {val: false, pri: -1},
                administrate: {val: false, pri: -1}
            }
            for(const role of member.roles){
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
            const redone_perms = {
                view: perms.view.val,
                play: perms.play.val,
                make_character: perms.make_character.val,
                start: perms.start.val,
                administrate: perms.administrate.val
            }
            const camp_filtered = {
                members: campaign.members,
                _id: campaign._id,
                name: campaign.name,
                description: campaign.description,
                creator: campaign.creator,
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
		res.status(404)
	}
}

/* Updates a CitizenVoice entry
 * 
 * Expects the unique identifier for the requested object to be passed in as
 * part of the URL. The values to update should be provided as a JSON object in
 * the body of the request.
 * 
 * Only fields which are modified need to be included in the request -
 * fields which are not present in the request are assumed by the server to be
 * unmodified.
 * 
 * The _id field CANNOT BE MODIFIED, and should not be included in the request.
 * Requests containing an _id entry will be rejected with a 400 status code.
 * 
 * If the entry is found and successfully updated, a JSON object (in the same
 * format returned by CreateCitizenVoice) representing the object's state after
 * modification is returned, with status code 200.
 * 
 * If no entry is found, status code 404 is returned. If the unique identifier
 * is malformed, if the body of the request contains unknown keys, or if the
 * body contains the _id field, 400 is returned.
 */
export const EditCitizenVoice = async (req, res, next) => {
	const obj_id = req.params.id

	if(!mongodb.ObjectID.isValid(obj_id)){
		return res.status(400).json({
			reason: "Malformed Object ID"
		})
	}else{
		const to_edit = await CitizenVoiceModel.findById(obj_id)

		if(!to_edit){
			return res.sendStatus(404)
		}

		const valid_keys = [
			"name", "occupation", "quote"
		]
		let unknown_keys = []
		Object.keys(req.body).forEach(function(key){
			if(!valid_keys.includes(key)){
				unknown_keys.push(key)
			}
		})

		if(unknown_keys.length > 0){
			if(unknown_keys.includes("_id")){
				return res.status(400).json({
					reason: "Object ID cannot be modified"
				})
			}else{
				return res.status(400).json({
					reason: `Unknown input field(s) ${unknown_keys}`
				})
			}
		}

		if(req.body.name){
			if(!typeof(req.body.name) === "string"){
				return res.status(400).json({
					reason: "Malformed input data"
				})
			}
			to_edit.name = req.body.name
		}

		if(req.body.occupation){
			if(!typeof(req.body.occupation) === "string"){
				return res.status(400).json({
					reason: "Malformed input data"
				})
			}
			to_edit.occupation = req.body.occupation
		}

		if(req.body.quote){
			if(!typeof(req.body.occupation) === "string"){
				return res.status(400).json({
					reason: "Malformed input data"
				})
			}
			to_edit.quote = req.body.quote
		}

		to_edit.save((err) => {
			if(err){
				return next(err)
			}

			return res.status(200).json(to_edit)
		})
	}
}

/* Deletes a Citizen Voice entry from the database
 *
 * Expects the unique identifier for the requested object to be passed in as
 * part of the URL.
 * 
 * If the object exists, it will be deleted, and a JSON object representing the
 * object (before deletion) will be returned (in the same format as that
 * returned by CreateCitizenVoice) with status code 200.
 * 
 * Returns 404 if the identifier was not found, or 400 if the identifier is
 * malformed in some way.
 */
export const DeleteCitizenVoice = async (req, res, next) => {
	const obj_id = req.params.id

	if(!mongodb.ObjectID.isValid(obj_id)){
		return res.status(400).json({
			reason: "Malformed Object ID"
		})
	}else{
		const deleted = await CitizenVoiceModel.findByIdAndDelete(req.params.id)

		if(deleted){
			res.status(200).json(deleted)
		}else{
			res.sendStatus(404)
		}
	}
}