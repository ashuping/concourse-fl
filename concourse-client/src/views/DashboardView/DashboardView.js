/* City of Concourse Website - User dashboard
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
import { Link, Redirect } from 'react-router-dom'
import './DashboardView.css'

import CampaignDetail from '../../components/CampaignDetail/CampaignDetail.js'
import CampaignList from '../../components/CampaignList/CampaignList.js'
import CampaignCreate from '../../components/CampaignCreate/CampaignCreate.js'
import UserProfile from '../../components/UserProfile/UserProfile.js'

const dbTabs = {
    CAMPAIGNS: {
        obj: (cfetch, set_title, props, user) => <CampaignList user={user} />
    },
    PROFILE: {
        obj: (cfetch, set_title, props, user) => <UserProfile cfetch={cfetch} />
    },
    ADMIN: {
        obj: (cfetch, set_title, props, user) => <div><blink><marquee><h1 className="spin">under construction</h1></marquee></blink></div>
    },
    CAMPAIGN_DETAIL: {
        obj: (cfetch, set_title, props, user) => {
            if(props){
                return <CampaignDetail campaign_id={props.match.params.cid} />
            }else{
                return null
            }
        }
    },
    CAMPAIGN_CREATE: {
        obj: (cfetch, set_title, props, user) => {
            return <CampaignCreate cfetch={cfetch} />
        }
    }
}

function DashboardView({cfetch, set_title, active_tab, props}){
    const [user, set_user] = useState(null)
    const [user_loaded, set_user_loaded] = useState(false)
    const [mode, set_mode] = useState(dbTabs.CAMPAIGNS)

    useEffect(() => {
        if(active_tab === "campaigns"){
            set_mode(dbTabs.CAMPAIGNS)
        }else if(active_tab === "profile"){
            set_mode(dbTabs.PROFILE)
        }else if(active_tab === "admin"){
            set_mode(dbTabs.ADMIN)
        }else if(active_tab === "campaign_detail"){
            console.log(`CID is ${props.match.params.cid} (props: ${JSON.stringify(props)})`)
            set_mode(dbTabs.CAMPAIGN_DETAIL)
        }else if(active_tab === "campaign_create"){
            set_mode(dbTabs.CAMPAIGN_CREATE)
        }else{
            set_mode(dbTabs.CAMPAIGNS)
        }
    }, [active_tab, set_mode])

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
        <h1 className="title">{user.username} <span className="title-small">the {user.iex}</span></h1>
        <div className="db-body">
            <div className="db-tabs-row">
                <div><Link to="/dashboard">Campaigns</Link></div>
                <div><Link to="/profile">Profile</Link></div>
                <div><Link to="/admin">Administrator Tools</Link></div>
            </div>
            {mode.obj(cfetch, set_title, props, user)}
        </div>
    </div>

}

export default DashboardView