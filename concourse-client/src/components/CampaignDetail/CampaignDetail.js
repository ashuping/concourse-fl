/* City of Concourse Website - Component to show campaign information
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
import { Link } from 'react-router-dom'
import { Power, Play, MinusCircle, Slash } from 'react-feather'

import { GetCampaigns } from '../../util/Campaigns.js'

import './CampaignDetail.css'

function CDTopbar({campaign}){
    const name_text = `${campaign.creator.username} / ${campaign.name}`
    let session_endpoint = campaign.session_in_progress
    let clickable = false
    let link_state = "inactive"
    let status_text = "Offline"
    let join_text = ""
    let join_icon = <MinusCircle />

    if(campaign.session_in_progress){
        status_text = "Running"
        if(campaign.permissions.play){
            join_text = "Click to Join"
            join_icon = <Play />
            link_state = "active"
            clickable = true
        }else{
            join_icon = <Slash />
        }
    }else{
        if(campaign.permissions.start){
            join_text = "Click to Start"
            join_icon = <Power />
            clickable = true
            session_endpoint = 'start'
        }
    }

    const link_dst = "/campaigns/" + campaign._id + "/sessions/" + session_endpoint
    if(clickable){
        return <Link 
                className={`campaign-header ${link_state}`} 
                to={link_dst}
                target="_blank"
            >
            <div className="cname">{name_text}</div>
            <div className="cstatus">{status_text}</div>
            <div className="cjoin">{join_text}{join_icon}</div>
        </Link>
    }else{
        return <div className={`campaign-header ${link_state}`}>
            <div className="cname">{name_text}</div>
            <div className="cstatus">{status_text}</div>
            <div className="cjoin">{join_text}{join_icon}</div>
        </div>
    }

}

function CampaignDetail({campaign_id}){
    const [campaign, set_campaign] = useState(null)
    const [load_done, set_load_done] = useState(false)

    // TODO: API endpoint to retrieve only one campaign
    const e_get_c = useEffect(() => {
        GetCampaigns().then((response) => {
            console.log(`Checking campagins against id ${campaign_id}`)
            for(const camp of response){
                if(camp._id === campaign_id){
                    set_campaign(camp)
                }
            }

            set_load_done(true)
        })
    }, [set_campaign, set_load_done])

    if(!campaign){
        if(load_done){
            return <h1>The requested campaign doesn't exist.</h1>
        }else{
            return <h1>Loading...</h1>
        }
    }

    return <div className="campaign-detail">
        <CDTopbar campaign={campaign} />
        <div className="campaign-body">
            <h1 className="no-top-margin">Description</h1>
            <p>{campaign.description}</p>
            <h1>Characters</h1>
            <p>somebody</p>
            <h1>Characters</h1>
            <p>somebody</p>
            <h1>Characters</h1>
            <p>somebody</p>
            <h1>Characters</h1>
            <p>somebody</p>
        </div>
    </div>
}

export default CampaignDetail
