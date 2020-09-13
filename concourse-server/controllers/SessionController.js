/* City of Concourse Website - Session Controller
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

import { CampaignModel } from '../models/CampaignSchema.js'
import { get_permissions } from './CampaignController.js'
import { 
	Session,
	genSession,
	getActiveSession,
	SESSION_CREATE_RESULT,
	SESSION_RETRIEVE_RESULT
} from '../session-server/SessionServer.js'
import { SessionModel } from '../models/SessionSchema.js'

export const CreateSession = async (req, res, next) => {
	if(!req.user){
		return res.sendStatus(500)
	}

	if(!(
		req.body.campaign
	)){
		return res.status(400).json({
			reason: "Missing required fields"
		})
	}

	let createActionIsAuthorized = true
	const campaign = await CampaignModel.findById(req.body.campaign)
	
	if(campaign){
		const perms = await get_permissions(req.user.user, campaign)
		if(!perms.start){
			createActionIsAuthorized = false
		}
	}else{
		createActionIsAuthorized = false
	}

	if(!createActionIsAuthorized){
		return res.status(404).json({
			reason: `Campaign does not exist, or you are not authorized to start a session within it.`
		})
	}

	const result = await genSession(campaign, req.user.user)

	if(result.result === SESSION_CREATE_RESULT.SUCCESS){
		return res.status(200).json({
			id: result.session._id,
			url: result.session.url
		})
	}
}

export const JoinSession = async (req, res, next) => {
	if(!req.user){
		return res.sendStatus(500)
	}

	if(!(
		req.params.id
	)){
		return res.status(400).json({
			reason: "Missing required fields"
		})
	}

	const campaignBadMessage = `Campaign does not exist, or you are not authorized to join a session within it.`

	const result = await getActiveSession(req.params.id)
	if(result.result === SESSION_RETRIEVE_RESULT.FOUND){
		const sessionMod = await SessionModel.findById(result.session._id)
		await sessionMod.populate('campaign').execPopulate()

		const perms = await get_permissions(req.user.user, sessionMod.campaign)
		if(!perms.play){
			return res.status(404).json({
				reason: campaignBadMessage
			})
		}

		if(!(
			req.get('Upgrade')
			&& req.get('Upgrade') === 'websocket'
		)){
			return res.status(400).json({
				reason: 'Requests to this endpoint must be in the form of a WebSocket upgrade request.'
			})
		}

		await result.session.handleJoin(req)
		return
	}else{
		return res.status(404).json({
			reason: campaignBadMessage
		})
	}
}

export const GetSession = async (req, res, next) => {
	if(!req.user){
		return res.sendStatus(500)
	}

	if(!(
		req.params.id
	)){
		return res.status(400).json({
			reason: "Missing required fields"
		})
	}

	const campaignBadMessage = `Campaign does not exist, or you are not authorized to join a session within it.`

	const result = await getActiveSession(req.params.id)
	if(result.result === SESSION_RETRIEVE_RESULT.FOUND){
		const sessionMod = await SessionModel.findById(result.session._id)
		await sessionMod.populate('campaign').execPopulate()

		const perms = await get_permissions(req.user.user, sessionMod.campaign)
		if(!perms.play){
			return res.status(404).json({
				reason: campaignBadMessage
			})
		}

		return res.status(200).json({
			id: result.session._id,
			url: result.session.url
		})
	}else{
		console.warn('Session result was not FOUND...')
		return res.status(404).json({
			reason: campaignBadMessage
		})
	}
}