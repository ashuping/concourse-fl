/* City of Concourse Website - Campaign utilities
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