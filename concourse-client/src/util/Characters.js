/* City of Concourse Website - Character utilities
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

export async function GetCharacter(
    character_id
){
    const res = await fetch(`${Backend()}/api/v1/characters/${character_id}`, {
        credentials: 'same-origin'
    })

    return res
}

export async function CreateCharacter(
    name,
    description,
    campaigns
){
    const campaign_objs = campaigns.map((camp) => {
        return {cid: camp}
    })

    const res = await fetch(`${Backend()}/api/v1/characters/new`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            name: name,
            description: description,
            campaigns: campaign_objs
        })
    })

    return res
}

export async function EditCharacter(
    charid,
    name,
    description
){
    let changes = {}
    if(name){
        changes.name = name
    }
    if(description){
        changes.description = description
    }
    const res = await fetch(`${Backend()}/api/v1/characters/${charid}`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify(changes)
    })

    return res
}

export async function GetCharacterInstance(
    instance_id
){
    const res = await fetch(`${Backend()}/api/v1/characters/instance/${instance_id}`, {
        credentials: 'same-origin'
    })

    return res
}

export async function SetAttribute(
    instance_id,
    attr_id,
    val
){
    const res = await fetch(`${Backend()}/api/v1/characters/instance/${instance_id}/${attr_id}`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            val: val
        })
    })

    return res
}

export async function DeleteCharacter(
    character_id
){
    const res = await fetch(`${Backend()}/api/v1/characters/${character_id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
    })

    return res
}

export async function DeleteInstance(
    instance_id
){
    const res = await fetch(`${Backend()}/api/v1/characters/instance/${instance_id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
    })

    return res
}