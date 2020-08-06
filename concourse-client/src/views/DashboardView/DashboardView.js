/* City of Concourse Website - User utilities
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

import React, { useState, useEffect } from 'react'
import { Redirect } from 'react-router-dom'

function DashboardView({cfetch, set_title}){
    const [user, set_user] = useState(null)
    const [user_loaded, set_user_loaded] = useState(false)

	useEffect(() => {
		set_title("Dashboard")
	}, [set_title])

	useEffect(() => {
		cfetch("user", "current", false).then((user) => {
            set_user(user)
            set_user_loaded(true)
        })
    }, [cfetch])
    
    if(!user_loaded){
        return <div className="dashboard loading">
            <h1>Loading...</h1>
        </div>
    }

    // User must be logged in to see the dashboard.
    if(user_loaded && !user){
        return <Redirect to="/login" />
    }

    return <div className="dashboard">
        <h1>Welcome, {user.display_name}!</h1>
    </div>

}

export default DashboardView