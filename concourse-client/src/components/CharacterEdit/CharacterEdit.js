import React, { useState, useEffect } from 'react'
import { Redirect } from 'react-router-dom'
import { EditorState, convertToRaw, convertFromRaw } from 'draft-js'

import { IField_Flexbox } from '../IField/IField.js'
import StatusButton, { SBStatus } from '../StatusButton/StatusButton.js'
import ComplexTextEditor from '../ComplexTextEditor/ComplexTextEditor.js'

import { CreateCharacter, EditCharacter, SetAttribute, DeleteCharacter, DeleteInstance } from '../../util/Characters.js'

import './CharacterEdit.css'
import { Trash } from 'react-feather'

function CharacterEdit({user, init_char, campaign}){
    const [can_edit_personal_details, set_can_edit_personal_details] = useState(true)
    const [name, set_name] = useState("")
    const [desc, set_desc] = useState(EditorState.createEmpty())
    const [redir, do_redir] = useState(null)
    const [request_status, set_request_status] = useState(null)
    const [remove_status, set_remove_status] = useState(SBStatus.READY)
    const [delete_status, set_delete_status] = useState(SBStatus.READY)
    const [btn_err_text, set_btn_err_text] = useState('Error!')
    const [attribs, set_attribs] = useState({})

    function validate_name(){
        return (name && name.length > 0)
    }

    function validate_description(){
        return true
    }

    let status = SBStatus.DISABLED

    if(request_status){
        status = request_status
    }else{
        if(validate_name() && validate_description()){
            status = SBStatus.READY
        }
    }

    useEffect(() => {
        return () => {
            do_redir(null)
        }
    }, [])

    useEffect(() => {
        if(init_char){
            if(init_char.character.owner._id.toString() === user._id.toString()){
                set_can_edit_personal_details(true)
            }else{
                set_can_edit_personal_details(false)
            }
            set_name(init_char.character.name)
            set_desc(EditorState.createWithContent(convertFromRaw(JSON.parse(init_char.character.description))))
            const attr_init = {}
            for(const char_attrib of init_char.attributes){
                attr_init[char_attrib.campaign_character_attribute._id] = {
                    name: char_attrib.campaign_character_attribute.name,
                    modified: false,
                    type: char_attrib.type,
                    val: char_attrib.val
                }
            }
            for(const attrib of campaign.attributes){
                if(!attr_init[attrib._id]){
                    attr_init[attrib._id] = {
                        name: attrib.name,
                        modified: false,
                        type: attrib.type,
                        val: ""
                    }
                }
            }
            set_attribs(attr_init)
        }else{
            set_name("")
            set_desc(EditorState.createEmpty())
            const attr_init = {}
            for(const attrib of campaign.attributes){
                if(!attr_init[attrib._id]){
                    attr_init[attrib._id] = {
                        name: attrib.name,
                        modified: false,
                        type: attrib.type,
                        val: ""
                    }
                }
            }
            set_attribs(attr_init)
        }
    }, [init_char])

    async function do_save(){
        let res = null
        if(init_char && can_edit_personal_details){
            res = await EditCharacter(
                init_char.character._id,
                name,
                JSON.stringify(convertToRaw(desc.getCurrentContent()))
            )
        }else if(can_edit_personal_details){
            res = await CreateCharacter(
                name,
                JSON.stringify(convertToRaw(desc.getCurrentContent())),
                [campaign._id]
            )
        }

        if(can_edit_personal_details && res.status !== 200){
            set_request_status(SBStatus.FAILED)
            setTimeout(() => {
                set_request_status(null)
            }, 2000)
            const rj = await res.json()
            if(rj && rj.reason){
                set_btn_err_text(rj.reason)
            }

            return
        }

        let res_inst = null
        if(can_edit_personal_details){
            const res_json = await res.json()
            let res_char = null
            if(init_char){
                res_char = res_json
            }else{
                res_char = res_json.character
            }
            for(const instance of res_char.instances){
                if(instance.campaign._id.toString() === campaign._id.toString()){
                    res_inst = instance
                }
            }
        }else{
            res_inst = init_char
        }

        for(const attrib of Object.keys(attribs)){
            if(attribs[attrib].modified){
                res = await SetAttribute(res_inst._id, attrib, attribs[attrib].val)

                if(res.status !== 200){
                    set_request_status(SBStatus.FAILED)
                    setTimeout(() => {
                        set_request_status(null)
                    }, 2000)
                    const rj = await res.json()
                    if(rj && rj.reason){
                        set_btn_err_text(rj.reason)
                    }
        
                    return
                }
            }
        }

        set_request_status(SBStatus.DONE)
        setTimeout(() => {
            // TODO[standalone-char-edit]: fix this redirect
            do_redir(`/campaigns/${campaign._id}`)
        }, 1000)
    }

    async function do_delete_permanently(){
        set_delete_status(SBStatus.WORKING)
        const res = await DeleteCharacter(init_char.character._id)
        if(res.status === 200){
            set_delete_status(SBStatus.DONE)
            setTimeout(() => {
                // TODO[standalone-char-edit]: fix this redirect
                do_redir(`/campaigns/${campaign._id}`)
            }, 1000)
        }else{
            const rj = await res.json()
            if(rj.reason){
                set_btn_err_text(rj.reason)
            }
            set_delete_status(SBStatus.FAILED)
            setTimeout(() => {
                set_delete_status(SBStatus.READY)
            }, 2000)
        }
    }

    async function do_remove_from_campaign(){
        set_remove_status(SBStatus.WORKING)
        const res = await DeleteInstance(init_char._id)
        if(res.status === 200){
            set_remove_status(SBStatus.DONE)
            setTimeout(() => {
                // TODO[standalone-char-edit]: fix this redirect
                do_redir(`/campaigns/${campaign._id}`)
            }, 1000)
        }else{
            const rj = await res.json()
            if(rj.reason){
                set_btn_err_text(rj.reason)
            }
            set_remove_status(SBStatus.FAILED)
            setTimeout(() => {
                set_remove_status(SBStatus.READY)
            }, 2000)
        }
    }

    function get_attrib(attr){
        if(!attribs[attr]){
            return null
        }
        return attribs[attr].val
    }

    function type_attrib(attr){
        if(!attribs[attr]){
            return 'null'
        }
        return attribs[attr].type
    }

    function validate_attrib(attr){
        const attrib_ob = attribs[attr]
        if(!attrib_ob){
            return false
        }
        switch(attrib_ob.type){
            case 'number':
                return !isNaN(parseFloat(attrib_ob.val))
            case 'string':
                return attrib_ob.length > 0
            default:
                return true

        }
    }

    function set_attrib(attr, val){
        let attr_mut = attribs
        attr_mut[attr].val = val
        attr_mut[attr].modified = true
        set_attribs(attr_mut)
    }

    let attrib_section = null

    if(campaign.permissions.administrate){
        const attrib_objs = []
        for(const attrib of campaign.attributes){
            attrib_objs.push(<IField_Flexbox 
                changeCallback={(event) => set_attrib(attrib._id, event.target.value)}
                good={validate_attrib(attrib._id)}
                name={attrib.name}
                help_text={`Type: ${type_attrib(attrib._id)}`}
                good_text=""
                bad_text=""
                default_val={get_attrib(attrib._id)}
                key={attrib._id}
            />)
        }

        attrib_section = <div className="character-edit-attribs">
            <h2>Attributes</h2>
            {attrib_objs}
        </div>
    }

    if(redir){
        return <Redirect to={redir} />
    }

    if(!user){
        return <div className="character-create">
            <h1>Loading...</h1>
        </div>
    }

    let nText = name
    if(!name){
        nText = "New Character"
    }

    const remove_button = <StatusButton 
        onClick={do_remove_from_campaign}
        status={remove_status}
        ready_text={`Remove character from campaign`}
        working_text="Removing..."
        done_text="Success!"
        failed_text={btn_err_text}
    />

    const delete_button = <StatusButton 
        onClick={do_delete_permanently}
        status={delete_status}
        ready_text={`Delete character permanently!`}
        working_text="Deleting..."
        done_text="Success!"
        failed_text={btn_err_text}
    />
    
    const danger_buttons = []
    if(init_char){
        if(can_edit_personal_details){
            danger_buttons.push(remove_button)
            danger_buttons.push(delete_button)
        }else if(campaign.permissions.administrate){
            danger_buttons.push(remove_button)
        }
    }

    return <div className="character-create">
        <div className="character-new-header">
            <div className="cleft">{nText}</div>
            <div className="ccenter"></div>
            <div className="cright"></div>
        </div>
        <div className="character-create-inner std-form">
            <IField_Flexbox 
                changeCallback={(event) => set_name(event.target.value)}
                good={validate_name()}
                name="Name"
                help_text="Character name"
                good_text=""
                bad_text=""
                default_val={name}
                disabled={!can_edit_personal_details}
            />
            <h2>Description</h2>
            <ComplexTextEditor
                cte_state={desc}
                set_cte_state={set_desc}
            />
            {attrib_section}
            <StatusButton
                onClick={do_save}
                status={status}
                ready_text="Save"
                working_text="Saving..."
                done_text="Success!"
                failed_text={btn_err_text}
            />
            {danger_buttons.length > 0 ? <h2>Danger!</h2> : null}
            {danger_buttons}
        </div>
    </div>
}

export default CharacterEdit