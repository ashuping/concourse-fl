/* City of Concourse Website - Campaign utilities
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

import { Backend } from './Connect'

export async function GetCampaigns(){
    const campagins = await fetch(`${Backend()}/api/v1/campaigns`, {
        credentials: 'same-origin'
    })

    if(campagins.status === 200){
        return campagins.json()
    }else{
        return null
    }
    
}

export async function GetOneCampaign(
	cid
){
	const campaign = await fetch(`${Backend()}/api/v1/campaigns/${cid}`, {
		credentials: 'same-origin'
	})

	if(campaign.status === 200){
		return campaign.json()
	}else{
		return null
	}
}

export async function CreateCampaign(
	name,
	description
){
	const res = await fetch(`${Backend()}/api/v1/campaigns/new`, {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		credentials: 'same-origin',
		body: JSON.stringify({
			name: name,
			description: description
		})
	})

	return res
}

export async function GenCampaignInvite(
	text,
	campaign_id,
	campaign_roles,
	uses,
	grants_administrator,
	grants_create_campaigns,
	grants_create_registration_keys
){
	const res = await fetch(`${Backend()}/api/v1/invites`, {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		credentials: 'same-origin',
		body: JSON.stringify({
			campaign: {
				cid: campaign_id,
				roles: campaign_roles
			},
			text: text,
			uses: uses,
			grants_administrator: grants_administrator,
			grants_create_campaigns: grants_create_campaigns,
			grants_create_registration_keys: grants_create_registration_keys
		})
	})

	return res
}

export async function CreateCampaignAttribute(
	name,
	description,
	campaign_id
){
	const res = await fetch(`${Backend()}/api/v1/campaigns/${campaign_id}/attributes/new`, {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		credentials: 'same-origin',
		body: JSON.stringify({
			name: name,
			description: description
		})
	})

	return res
}