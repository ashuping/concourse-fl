/* City of Concourse Website - User utilities
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
 * Retrieves the currently logged-in user from the backend
 * 
 * @returns the currently logged-in user, or null if not logged in
 */
async function GetCurrentUser(){
    const user = await fetch(`${Backend()}/api/v1/users/current`, {
        credentials: 'same-origin'
    })
    if(user.status === 200){
        return user.json()
    }else{
        return null
    }

}

/**
 * Retrieves a user by ID
 * 
 * @param {ObjectID} id the ID of the user to retrieve
 * 
 * @returns the requested user, or null if the lookup fails
 */
async function GetUser(id){
    const user = await fetch(`${Backend()}/api/v1/users/${id}`, {
        credentials: 'include'
    })

    if(user.status === 200){
        return user.json()
    }else{
        return null
    }
}

export { GetCurrentUser, GetUser }