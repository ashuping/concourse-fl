/* City of Concourse Website - Registration key controller
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

import { RegistrationKeyModel } from '../models/RegistrationKeySchema.js'
import { CampaignModel, CampaignMemberModel, CampaignRoleModel } from '../models/CampaignSchema.js'

import { get_permissions } from './CampaignController.js'

import config from '../config/config.js'

export const GenRegKey = async (req, res, next) => {
    if(!req.body.text){
        return res.status(400).json({
            reason: "Missing key req.body.text."
        })
    }

    if(!req.user){
        console.error('GenRegKey called without authentication!')
        return res.sendStatus(500)
    }

    if(!(req.user.user.administrator || req.user.user.can_create_registration_keys)){
        return res.status(401).json({
            reason: "Not authorized to create registration keys."
        })
    }

    if(req.body.grants_administrator && !(req.user.user.administrator)){
        return res.status(401).json({
            reason: "Cannot escalate privileges in created keys.",
            unauthorized_privilege: "grants_administrator"
        })
    }

    if(req.body.grants_create_campaigns && !(req.user.user.administrator || req.user.user.can_create_campaigns)){
        return res.status(401).json({
            reason: "Cannot escalate privileges in created keys.",
            unauthorized_privilege: "grants_create_campaigns"
        })
    }

    if(req.body.grants_create_registraion_keys && !(req.user.user.administrator || req.user.user.can_create_registration_keys)){
        return res.status(401).json({
            reason: "Cannot escalate privileges in created keys.",
            unauthorized_privilege: "grants_create_registration_keys"
        })
    }

    if(req.body.text.length < (process.env.REGISTRATION_INVITE_MIN_LENGTH || config.registration.invite_min_length)){
        return res.status(400).json({
            reason: "Key is too short.",
            provided_length: req.body.text.length,
            min_length: (process.env.REGISTRATION_INVITE_MIN_LENGTH || config.registration.invite_min_length)
        })
    }

    const duplicate_key = await RegistrationKeyModel.findOne({text: req.body.text})
    if(duplicate_key){
        return res.status(400).json({
            reason: "Registration key is already in use."
        })
    }

    const campaign = {
        cid: null,
        roles: []
    }
    if(req.body.campaign && req.body.campaign.cid && req.body.campaign.roles){
        console.log(JSON.stringify(req.body.campaign))
        const cmodel = await CampaignModel.findOne({_id: req.body.campaign.cid})
        if(!cmodel){
            return res.status(404).json({
                reason: "Campaign does not exist.",
                campaign: req.body.campaign.cid
            })
        }
        campaign.cid = cmodel._id

        const perms = await get_permissions(req.user.user, cmodel)
        for(const role of req.body.campaign.roles){
            const role_obj = await CampaignRoleModel.findById(role)
            if((!role_obj) || String(role_obj.campaign) !== String(cmodel._id)){
                return res.status(404).json({
                    reason: "Role does not exist.",
                    role: role
                })
            }
            campaign.roles.push(role)
        }

        if(!perms.administrate){
            return res.status(401).json({
                reason: "Not authorized to invite new players to this campaign."
            })
        }
    }

    const new_key = new RegistrationKeyModel({
        creator: req.user.user._id,
        text: req.body.text,
        uses_total: req.body.uses,
        uses_remaining: req.body.uses,
        grants_administrator: req.body.grants_administrator,
        grants_create_campaigns: req.body.grants_create_campaigns,
        grants_create_registration_keys: req.body.grants_create_registration_keys
    })

    if(campaign){
        new_key.campaign = campaign
    }

    console.log(JSON.stringify(req.body))

    await new_key.save()
    return res.sendStatus(200)
}
