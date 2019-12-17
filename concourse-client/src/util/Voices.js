/* City of Concourse Website - Citizen Voices access utilities
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

function GetAllVoices(){
	return fetch(`${Backend()}/api/v1/voices`)
		.then((data) => data.json())
		.catch((e) => console.error(e))
}

function GetVoice(id){
	return fetch(`${Backend()}/api/v1/voices/${id}`)
		.then((data) => data.json())
		.catch((e) => console.error(e))
}

function CreateVoice(voice){
	console.log("CreateVoice not yet implemented!")
}

function EditVoice(voice){
	console.log("EditVoice not yet implemented!")
}

function DeleteVoice(id){
	console.log("DeleteVoice not yet implemented!")
}

export { GetAllVoices, GetVoice, CreateVoice, EditVoice, DeleteVoice }