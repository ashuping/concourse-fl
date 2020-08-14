/* City of Concourse Website - Authorization utilities
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

import { Backend } from './Connect'

/**
 * Retrieves a new token from the backend
 * 
 * @param {string} email the email to authenticate with
 * @param {string} password the password to authenticate with
 * @param {Boolean} persist_session whether to retrieve a persistent session token as well as the temporary token
 * 
 * If this request succeeds, a token will be returned in an HTTPOnly cookie.
 * Additionally, a JSON object containing information on the newly-
 * authenticated user and the token ID (for later invalidation)
 */
async function Login(email, password, persist_session){
    if(persist_session){
        console.error("Persistent sessions are not yet implemented. This option will be ignored.")
    }
    const res =  await fetch(`${Backend()}/api/v1/login`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            method: 'local',
            email: email,
            password: password
        })
    })

    return {
        success: res.status === 200,
        res: res.json()
    }
}

async function RefreshLogin(){
    return (await fetch(`${Backend()}/api/v1/login`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            method: 'token'
        })
    }))
}

async function Logout(){
    return (await fetch(`${Backend()}/api/v1/login`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            id: 'all'
        })
    }))
}

export { Login, Logout, RefreshLogin }