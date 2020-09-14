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
import { EditorState, convertToRaw } from 'draft-js'

import { IField_Flexbox } from '../IField/IField.js'
import StatusButton, { SBStatus } from '../StatusButton/StatusButton.js'
import ToggleElem from '../ToggleElem/ToggleElem.js'
import { GetOneCampaign, GenCampaignInvite, CreateCampaignAttribute, GetAttributeTypes } from '../../util/Campaigns.js'
import ComplexTextEditor, { CTERenderer } from '../ComplexTextEditor/ComplexTextEditor.js'

import CharacterList from '../CharacterList/CharacterList.js'
import CharacterEdit from '../CharacterEdit/CharacterEdit.js'

import './CampaignDetail.css'

function CDTopbar({campaign}){
    const name_text = `${campaign.creator.username} / ${campaign.name}`
    let session_endpoint = null
    let clickable = false
    let link_state = "inactive"
    let status_text = "Offline"
    let join_text = ""
    let join_icon = <MinusCircle />

    if(campaign.active){
        status_text = "Running"
        if(campaign.permissions.play){
            join_text = "Click to Join"
            join_icon = <Play />
            link_state = "active"
            clickable = true
            session_endpoint = campaign.sessions[0]
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
            title={`${player.user.username} the ${player.user.iex}`}
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
            bad_text="Minimum invite length is 16 characters."
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

function AdminSection({campaign}){
    const [att_name, set_att_name] = useState("")
    const [att_desc, set_att_desc] = useState(EditorState.createEmpty())
    const [status, set_status] = useState(null)
    const [btn_err_text, set_btn_err_text] = useState("Error!")
    const [active_type, set_active_type] = useState(null)

    let btn_status = SBStatus.DISABLED
    if(status !== null){
        btn_status = status
    }else{
        if(att_name.length > 0){
            btn_status = SBStatus.READY
        }
    }

    let attributes_section = null
    if(campaign.attributes){
        const attributes_list = campaign.attributes.map((attrib) => {
            return <div 
                className="admin-section-attrib-elem"
                key={attrib._id}
            >
                <span className="asae-name">{attrib.name}</span>
                <span className="asae-type">{attrib.attType}</span>
            </div>
        })
        attributes_section = <div className="admin-section-attributes">{attributes_list}</div>
    }

    const types = GetAttributeTypes()
    const types_objs = types.map((type) => {
        return <option key={type} value={type}>{type}</option>
    })

    async function make_new_attr(){
        if(btn_status !== SBStatus.READY){
            return
        }

        set_status(SBStatus.WORKING)

        const res = await CreateCampaignAttribute(
            att_name,
            JSON.stringify(convertToRaw(att_desc.getCurrentContent())),
            campaign._id,
            (active_type ? active_type : types[0])
        )

        if(res.status === 200){
            set_status(SBStatus.DONE)
            setTimeout(() => {
                set_status(null)
                set_att_name("")
                set_att_desc(EditorState.createEmpty())
            })
        }else{
            set_status(SBStatus.FAILED)
            const rj = await res.json()
            if(rj && rj.reason){
                set_btn_err_text(rj.reason)
            }
        }
    }

    return <div className="campaign-detail-admin-section std-form">
        <h1>Administration</h1>
        <h2>Attributes</h2>
        {attributes_section}
        <h2>New Attribute</h2>

        <IField_Flexbox
            changeCallback={(event) => set_att_name(event.target.value)}
            good={att_name.length > 0}
            name="Name"
            help_text="Attribute Name"
            good_text=""
            bad_text=""
        />

        <h3>Description</h3>
        <ComplexTextEditor
            cte_state={att_desc}
            set_cte_state={set_att_desc}
        />

        <h3>Type</h3>
        <select value={types[0]} onChange={(event) => {set_active_type(event.target.value)}}>
            {types_objs}
        </select>

        <StatusButton 
            onClick={make_new_attr}
            status={btn_status}
            ready_text="Add New Attribute"
            working_text="Working..."
            done_text="Finished"
            failed_text={btn_err_text}
        />
    </div>
}

function CampaignDetail({user, params}){
    const [campaign, set_campaign] = useState(null)
    const [load_done, set_load_done] = useState(false)
    const [inst_to_edit, set_inst_to_edit] = useState(null)
    const [do_inst_edit, set_do_inst_edit] = useState(false)

    useEffect(() => {
        GetOneCampaign(params.cid).then((response) => {
            set_campaign(response)
            set_load_done(true)
        })
    }, [set_campaign, set_load_done, params])

    useEffect(() => {
        if(campaign && params.cmode === "edit" && params.charid){
            for(const instance of campaign.instances){
                if(instance._id.toString() === params.charid.toString()){
                    set_inst_to_edit(instance)
                    set_do_inst_edit(true)
                    break
                }
            }
        }else if(campaign && params.cmode === "new"){
            set_inst_to_edit(null)
            set_do_inst_edit(true)
        }else{
            set_do_inst_edit(false)
        }
    }, [campaign, params])

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
            <CharacterList
                chars={campaign.instances}
                campaign={campaign}
                user={user}
            />
            {do_inst_edit ? <CharacterEdit user={user} init_char={inst_to_edit} campaign={campaign} /> : null }
            <h1>Players</h1>
            <PlayerList players={campaign.members} />
            {campaign.permissions.administrate ? <InviteButton campaign={campaign} /> : null}
            <h1>Recent Sessions</h1>
            <p>somebody</p>
            {campaign.permissions.administrate ? <AdminSection campaign={campaign} /> : null}
        </div>
    </div>
}

export default CampaignDetail
