import React, { useState, useEffect } from 'react'
import { Redirect } from 'react-router-dom'
import { EditorState, convertToRaw } from 'draft-js'
// import { Editor } from 'react-draft-wysiwyg'
import { Save } from 'react-feather'

import { IField_Flexbox } from '../IField/IField.js'
import ComplexTextEditor from '../ComplexTextEditor/ComplexTextEditor.js'

import { CreateCampaign } from '../../util/Campaigns.js'

import './CampaignCreate.css'

function CampaignCreate({user}){
    const [name, set_name] = useState("")
    const [desc, set_desc] = useState(EditorState.createEmpty())
    const [redir, do_redir] = useState(null)

    function saveCB(){
        console.log(desc.getCurrentContent())
        console.log(convertToRaw(desc.getCurrentContent()))
        CreateCampaign(name, JSON.stringify(convertToRaw(desc.getCurrentContent()))).then(async (res) => {
            if(res.status === 200){
                const cjson = await res.json()
                do_redir(`/campaigns/${cjson._id}`)
            }else{
                console.error(`Failed to create campaign! Response ${res.status} ${res.statusText}`)
            }
        })
    }

    if(redir){
        return <Redirect to={redir} />
    }

    let nText = name
    if(!name){
        nText = "New Campaign"
    }

    return <div className="campaign-create">
        <div className="campaign-new-header" onClick={saveCB}>
            <div className="cleft">{user.username} / {nText}</div>
            <div className="ccenter"></div>
            <div className="cright"><span>Save</span><Save /></div>
        </div>
        <div className="campaign-create-inner std-form">
            <IField_Flexbox 
                changeCallback={(event) => set_name(event.target.value)}
                good={true}
                name="Name"
                help_text=""
                good_text=""
                bad_text=""
            />
            <h2>Description</h2>
            <ComplexTextEditor
                cte_state={desc}
                set_cte_state={set_desc}
            />
            {/* <table><tbody>
                <tr>
                    <td>Description</td>
                    <td>
                        <ComplexTextEditor
                            cte_state={desc}
                            set_cte_state={set_desc}
                        />
                    </td>
                </tr>
            </tbody></table> */}
            {/* <Editor 
                editorState={desc}
                toolbarClassName="campaign-desc-editor-toolbar"
                wrapperClassName="campaign-desc-editor-wrapper"
                editorClassName="campaign-desc-editor"
                onEditorStateChange={set_desc}
            /> */}
        </div>
    </div>
}

export default CampaignCreate