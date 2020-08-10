/* City of Concourse Website - Component to hold user profile information
	Copyright 2019, 2020 Alex Isabelle Shuping

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

import React from 'react'
import { PlusSquare } from 'react-feather'

import { ChangeIEX } from '../../util/Users.js'
import { Logout } from '../../util/Auth.js'

import './UserProfile.css'

function UserProfile({cfetch}){
    function regenCB(){
        ChangeIEX().then(() => {
            window.location.reload(true)
        })
    }

    function logout(){
        Logout().then(() => {
            window.location.reload(true)
        })
    }

    return <div className="prof-container">
        <div className="button" onClick={logout}>Logout</div>
        <div className="button" onClick={regenCB}>Regenerate IEX</div>
    </div>
}

export default UserProfile
