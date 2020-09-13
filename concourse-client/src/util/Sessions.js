/* City of Concourse Website - Session utilities
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

import { Backend, Delay } from './Connect'

/* NOTE: In order to ensure that the client and server are in sync regarding
 * message definitions, etc, the file `WSDefs` is shared between them. This is
 * done by symlinking the file from `common` into appropriate locations in both
 * the `concourse-client` and `concourse-server` directories.
 */
import { MSG, pkt, dpkt } from './WSDefs.mjs'

export async function GetSession(
    sid
){
    const gotSession = await fetch(`${Backend()}/api/v1/sessions/${sid}`, {
        credentials: 'same-origin'
    })

    if(gotSession.status !== 200){
        console.error(`Tried to get a session, but the result was ${gotSession.status}!`)
    }

    return gotSession
}

export async function StartSession(
	cid
){
    const newSesData = await fetch(`${Backend()}/api/v1/sessions/new`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            campaign: cid
        })
    })

    if(newSesData.status !== 200){
        console.error(`Tried to create a session, but the result was ${newSesData.status} (${await newSesData.json()})!`)
    }

    return newSesData
}

export async function ConnectSession(
    sock
){
    console.log(`Connect to socket ${sock}`)
    await Delay(3000)
}

export async function DisconnectSession(){
    console.log('Disconnect')
}

export async function EndSession(){
    console.log('Kill Session')
}