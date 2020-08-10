/* City of Concourse Website - Component to hold a list of campaigns
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
import { PlusSquare } from 'react-feather'

import { GetCampaigns } from '../../util/Campaigns.js'

import './CampaignList.css'

function CampaignListElem({campaign}){
    let join_box = null

    if(campaign.session_in_progress && campaign.permissions.play){
        const link_dst = "/campaigns/" + campaign._id + "/sessions/" + campaign.session_in_progress
        join_box = <div className="campaign-in-progress-box">
                <span className="campaign-box-text">Session In Progress</span> <Link to={link_dst} className="campaign-button" target="_blank">Join</Link>
            </div>
    }else if(campaign.permissions.start){
        const link_dst = "/campaigns/" + campaign._id + "/sessions/start"
        join_box = <div className="campaign-in-progress-box">
                <span className="campaign-box-text">Not Currently Running</span> <Link to={link_dst} className="campaign-button" target="_blank">Start</Link>
            </div>
    }

    return <div className="campaign-list-elem">
        {join_box}
        <h1><Link to={`/campaigns/${campaign._id}`}>{campaign.name}</Link></h1>
        <div>
            <p>{campaign.description}</p>
        </div>
    </div>
}

// function CampaignList({campaigns}){
function CampaignList(){
    const [campaigns, set_campaigns] = useState(null)

    const e_get_c = useEffect(() => {
        GetCampaigns().then((response) => {
            set_campaigns(response)
        })
    }, [set_campaigns])

    if(!campaigns){
        return <h1>Loading...</h1>
    }

    const campaign_elems = campaigns.map((campaign) => {
        return <CampaignListElem key={campaign._id} campaign={campaign} />
    })

    return <div className="campaign-list">
        <div className="campaign-new"><PlusSquare /> <span style={{padding: "auto"}}>New Campaign</span></div>
        <div className="campaign-list-inner">
            {campaign_elems}
        </div>
    </div>
}

export default CampaignList
