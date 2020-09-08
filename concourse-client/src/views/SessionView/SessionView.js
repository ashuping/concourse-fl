import React, { useState, useEffect } from 'react'
import { Redirect } from 'react-router-dom'
import { Loader } from 'react-feather'

import { GetOneCampaign } from '../../util/Campaigns.js'
import { GetSession, StartSession, ConnectSession } from '../../util/Sessions.js'

// import SessionStart from './SessionStart/SessionStart.js'

import './SessionView.css'

export const SessionLoadState = {
    ERROR: -1,
    LOADING_CAMPAIGN: 0,
    INITIALIZING_SESSION: 1,
    LOADING_SESSION: 2,
    READY: 3
}

function SVLoadView({lstate, text}){
    let css_name = ""

    switch(lstate){
        case SessionLoadState.LOADING_CAMPAIGN:
            css_name = "sv-connecting"
            break
        case SessionLoadState.INITIALIZING_SESSION:
            css_name = "sv-genning"
            break
        case SessionLoadState.LOADING_SESSION:
            css_name = "sv-loading"
            break
        case SessionLoadState.ERROR:
            css_name = "sv-error"
            break
        default:
            break
    }

    return <div className="sess-view">
        <div className="sess-view-main">
            <div className={`sess-view-item sess-view-loader ${css_name}`}><Loader /></div>
            <h1 className="sess-view-item">{text}</h1>
        </div>
    </div>
}

function SessionView({cid, sid, setAppMode}){
    const [campaign, set_campaign] = useState(null)
    const [slstate, set_slstate] = useState(SessionLoadState.LOADING_CAMPAIGN)
    const [sock, set_sock] = useState(null)
    const [redir, do_redir] = useState(null)

    useEffect(() => {
        setAppMode('session')
        return (() => {setAppMode('main')})
    }, [])

    async function do_initialize(){
        do_redir(null)
        set_slstate(SessionLoadState.LOADING_CAMPAIGN)
        set_campaign(await GetOneCampaign(cid))
        if(sid === null){
            set_slstate(SessionLoadState.INITIALIZING_SESSION)
            const newSid = await StartSession(cid)
            do_redir(`/campaigns/${cid}/sessions/${newSid}`)
            return
        }else{
            const {url} = await GetSession(sid)
            set_slstate(SessionLoadState.LOADING_SESSION)
            const sock = await ConnectSession(url)
            set_sock(sock)
            set_slstate(SessionLoadState.READY)
            console.log('Done.')
        }
    }

    useEffect(() => {do_initialize()}, [cid, sid])

    if(redir){
        return <Redirect to={redir} />
    }

    switch(slstate){
        case SessionLoadState.LOADING_CAMPAIGN:
            return <SVLoadView lstate={slstate} text="Preparing..." />
        case SessionLoadState.INITIALIZING_SESSION:
            return <SVLoadView lstate={slstate} text="Initializing Session..." />
        case SessionLoadState.LOADING_SESSION:
            return <SVLoadView lstate={slstate} text="Loading Session Data..." />
        case SessionLoadState.ERROR:
            return <SVLoadView lstate={slstate} text="Error!" />
        default:
            return <SVLoadView lstate={slstate} text="Error!" />
    }
}

export default SessionView