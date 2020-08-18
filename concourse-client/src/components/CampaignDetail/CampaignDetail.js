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
import { Power, Play, MinusCircle, Slash, User } from 'react-feather'

import { IField_Flexbox } from '../IField/IField.js'
import StatusButton, { SBStatus } from '../StatusButton/StatusButton.js'
import ToggleElem from '../ToggleElem/ToggleElem.js'
import { GetCampaigns, GenCampaignInvite } from '../../util/Campaigns.js'
import { CTERenderer } from '../ComplexTextEditor/ComplexTextEditor.js'

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

function PlayerList({players}){
    const player_objects = []

    for(const player of players){
        player_objects.push(
        <div 
            className="player-list-player"
            key={player.user._id}
            title={`${player.user.username} The ${player.user.iex}`}
        >
            <User /><span>{player.user.username}</span>
        </div>)
    }

    return <div className="player-list">{player_objects}</div>
}

function InviteButton({campaign}){
    const [text, set_text] = useState('')
    const [uses, set_uses] = useState('')
    const [request_status, set_request_status] = useState(null)
    const [give_admin, set_give_admin] = useState(false)
    const [give_create_campaigns, set_give_create_campaigns] = useState(false)
    const [give_create_invites, set_give_create_invites] = useState(false)
    const [roles, set_roles] = useState([])
    const [btn_err_text, set_btn_err_text] = useState('Error!')

    let status = SBStatus.DISABLED
    
    function code_valid(){
        return text.length > 16
    }

    function num_valid(){
        return /^[0-9]+$/.test(uses)
    }

    function roles_valid(){
        return roles.length > 0
    }

    if(request_status){
        status = request_status
    }else if(code_valid() && num_valid() && roles_valid()){
        status = SBStatus.READY
    }

    function doSubmit(){
        if(status === SBStatus.READY){
            set_request_status(SBStatus.WORKING)
            GenCampaignInvite(
                text,
                campaign._id,
                roles,
                Number.parseInt(uses),
                give_admin,
                give_create_campaigns,
                give_create_invites
            ).then((res) => {
                if(res.status === 200){
                    set_request_status(SBStatus.DONE)
                    setTimeout(() => {
                        set_request_status(null)
                    }, 2000)
                }else{
                    res.json().then((rjson) => {
                        set_btn_err_text(rjson.reason)
                    })
                    set_request_status(SBStatus.FAILED)
                    setTimeout(() => {
                        set_request_status(null)
                    }, 2000)
                }
            })
        }
    }

    const role_elems = campaign.roles.map((role) => {
        return <ToggleElem
            checked={roles.includes(role._id)}
            set_checked={(new_checked) => {
                if(new_checked){
                    const new_roles = roles.concat([role._id])
                    set_roles(new_roles)
                }else{
                    const new_roles = roles.filter((elem) => {
                        return elem !== role._id
                    })
                    set_roles(new_roles)
                }
            }}
            text={role.name}
            key={role._id}
        />
    })

    return <div className="invite-btn std-form">
        <h2>Invite Players to {campaign.name}</h2>
        <IField_Flexbox 
            changeCallback={(event) => set_text(event.target.value)}
            good={code_valid()}
            name="Invite Code"
            help_text="Enter a phrase to use as an invite code."
            good_text=""
            bad_text="Minimum invite length is 32 characters."
        />
        <IField_Flexbox
            changeCallback={(event) => set_uses(event.target.value)}
            good={num_valid()}
            name="Number of Uses"
            help_text="Number of times this code can be used."
            good_text=""
            bad_text="That doesn't look like a number."
        />
        <div className="invite-toggle-row">
            <span>Global options</span>
            <ToggleElem
                checked={give_admin}
                set_checked={set_give_admin}
                text="Admin"
            />
            <ToggleElem
                checked={give_create_campaigns}
                set_checked={set_give_create_campaigns}
                text="Create Campaigns"
            />
            <ToggleElem
                checked={give_create_invites}
                set_checked={set_give_create_invites}
                text="Create Invites"
            />
        </div>
        <div className="role-toggle-row">
            <span>Roles</span>
            {role_elems}
        </div>
        <StatusButton
            onClick={doSubmit}
            status={status}
            ready_text='Generate Invite'
            working_text='Generating...'
            done_text='Finished'
            failed_text={btn_err_text}
        />
    </div>
}

function CampaignDetail({campaign_id}){
    const [campaign, set_campaign] = useState(null)
    const [load_done, set_load_done] = useState(false)

    // TODO: API endpoint to retrieve only one campaign
    useEffect(() => {
        GetCampaigns().then((response) => {
            for(const camp of response){
                if(camp._id === campaign_id){
                    set_campaign(camp)
                }
            }

            set_load_done(true)
        })
    }, [set_campaign, set_load_done, campaign_id])

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
            <CTERenderer
                cte_raw_content={JSON.parse(campaign.description)}
            />
            <h1>Characters</h1>
            <p>somebody</p>
            <h1>Players</h1>
            <PlayerList players={campaign.members} />
            {campaign.permissions.administrate ? <InviteButton campaign={campaign} /> : null}
            <h1>Recent Sessions</h1>
            <p>somebody</p>
        </div>
    </div>
}

export default CampaignDetail
