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

async function GetRegistrationOptions(){
	const res = await fetch(`${Backend()}/api/v1/users/create`)

	if(res.status === 200){
		return res.json()
	}else{
		return null
	}
}

async function Register(
	username,
	password,
	display_name,
	pronouns,
	email,
	registration_key
){
	const res = await fetch(`${Backend()}/api/v1/users/create`, {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			username: username,
			password: password,
			display_name: display_name,
			pronouns: {
				subject: pronouns.subject,
				object: pronouns.object,
				dependent_possessive: pronouns.dependent_possessive,
				independent_possessive: pronouns.independent_possessive,
				reflexive: pronouns.reflexive
			},
			email: email,
			registration_key: registration_key
		})
	})

	return res
}

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
	const user = await fetch(`${Backend()}/api/v1/users/i/${id}`, {
		credentials: 'include'
	})

	if(user.status === 200){
		return user.json()
	}else{
		return null
	}
}

export { GetCurrentUser, GetUser, GetRegistrationOptions, Register }