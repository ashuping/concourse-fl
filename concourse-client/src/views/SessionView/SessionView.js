import React, { useState, useEffect } from 'react'
import useWebSocket from 'react-use-websocket'
import { Redirect } from 'react-router-dom'
import { Loader } from 'react-feather'

import { GetOneCampaign } from '../../util/Campaigns.js'
import { GetSession, StartSession, ConnectSession } from '../../util/Sessions.js'
import { MSG, pkt, dpkt } from '../../util/WSDefs.mjs'

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
    const [err_text, set_err_text] = useState('Error!')
    // const [sock, set_sock] = useState(null)
    const [sock_url, set_sock_url] = useState(null)
    const [redir, do_redir] = useState(null)
    const [peers, set_peers] = useState([])

    const close_cb = function(closeEvent){
        // The websocket should be open in the LOADING_SESSION or
        // READY states - if the socket disconnects during one of
        // these states, we should try to reconnect. Otherwise, we
        // should not.
        return (!(
            slstate === SessionLoadState.LOADING_SESSION
            || slstate === SessionLoadState.READY
        ))
    }

    const {
        sendMessage,
        lastMessage,
        readyState
    } = useWebSocket(sock_url, {
        shouldReconnect: close_cb
    })

    useEffect(() => {
        setAppMode('session')
        return (() => {setAppMode('main')})
    }, [])

    useEffect(() => {
        console.log(lastMessage)
        if(!lastMessage){return}
        const msg = JSON.parse(lastMessage.data)
        switch(msg.msg){
            case MSG.PEER_CONNECTED:
                set_peers(peers.concat(msg.peer))
                break
            default:
                break
        }
    }, [lastMessage])

    async function do_initialize(){
        do_redir(null)
        set_slstate(SessionLoadState.LOADING_CAMPAIGN)
        set_campaign(await GetOneCampaign(cid))
        if(sid === null){
            set_slstate(SessionLoadState.INITIALIZING_SESSION)
            const newSid = await StartSession(cid)
            if(newSid.status !== 200){
                set_slstate(SessionLoadState.ERROR)
                set_err_text(`Server returned status code ${newSid.status} while trying to create session!`)
                return
            }
            do_redir(`/campaigns/${cid}/sessions/${(await newSid.json()).id}`)
            return
        }else if(sock_url === null){
            const res = await GetSession(sid)
            if(res.status !== 200){
                set_slstate(SessionLoadState.ERROR)
                set_err_text(`Server returned status code ${res.status} while trying to retrieve session!`)
                return
            }
            const url = (await res.json()).url
            set_sock_url(url)
        }else{
            set_slstate(SessionLoadState.LOADING_SESSION)
            sendMessage(pkt(MSG.ALL_INFO_REQ))
        }
    }

    useEffect(() => {do_initialize()}, [cid, sid, sock_url])

    if(redir){
        return <Redirect to={redir} />
    }

    const peerList = peers.map((peer) => {
        return <h2 key={`${peer.scid}`}>{peer.username}</h2>
    })

    switch(slstate){
        case SessionLoadState.LOADING_CAMPAIGN:
            return <SVLoadView lstate={slstate} text="Preparing..." />
        case SessionLoadState.INITIALIZING_SESSION:
            return <SVLoadView lstate={slstate} text="Initializing Session..." />
        case SessionLoadState.LOADING_SESSION:
            return <SVLoadView lstate={slstate} text="Loading Session Data..." />
        case SessionLoadState.ERROR:
            return <SVLoadView lstate={slstate} text={err_text} />
        case SessionLoadState.READY:
            return <div>
                <h1>Connected peers:</h1>
                {peerList}
            </div>
            // return <SVLoadView lstate={slstate} text="Done!" />
        default:
            return <SVLoadView lstate={slstate} text="Unknown state!" />
    }
}

export default SessionView