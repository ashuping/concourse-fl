import React, { useState } from 'react'

import { Terminal } from 'react-feather'

function SVChatbox({sendChatMessage, chatMessages, peers}){
    const [chatMsg, setChatMsg] = useState('')

    const peerAssoc = {}
    for(const peer of peers){
        peerAssoc[peer.scid] = peer.username
    }

    let ctr = 0
    const chatMsgObjects = chatMessages.map((msg) => {
        const msgStr = `${peerAssoc[msg.source]}: ${msg.chat}`
        return <div 
            key={ctr++} 
            className="sess-chatbox-history-line"
        >
            {msgStr}
        </div>
    })

    return <div className="sess-view-panel sess-view-chatbox">
        <div className="sess-view-panel sess-chatbox-msg-line">
            <div className="sess-chatbox-chat-symbol">
                <Terminal />
            </div>
            <input 
                className="sess-chatbox-input"
                onChange={(event) => {setChatMsg(event.target.value)}}
                value={chatMsg}
                onKeyDown={(event) => {
                    if(event.key !== 'Enter'){
                        return
                    }
                    if(chatMsg && chatMsg.length > 0){
                        sendChatMessage(chatMsg)
                        setChatMsg('')
                    }
                }}
            />
        </div>
        <div className="sess-chatbox-msg-history">
            <div >
                {chatMsgObjects}
            </div>
        </div>
    </div>
}

function SVBGSquare({
    ownership,
    contents,
    xCoord,
    yCoord
}){
    return <div
        className={`SVBGSquare SVBGS-${ownership}`}
        style={{
            gridRow: xCoord,
            gridColumn: yCoord
        }}
    >
        {contents}
    </div>
}

function SVBattleGrid({
    grid
}){
    const squares = []

    for(let x = 0; x < grid.cols; x++){
        for(let y = 0; y < grid.rows; y++){
            const square = grid.squares[x][y]
            squares.push(<SVBGSquare
                ownership={square.ownership}
                xCoord={x+1}
                yCoord={y+1}
                // contents={square.contents}
                contents={<div className='SVBGSquare-content'>square</div>}
            />)
        }
    }

    return <div className="sess-view-battlegrid sess-view-battlegrid-3d">
        {squares}
    </div>
}

function SVMainView({
    chatMessages,
    sendChatMessage,
    peers
}){
    // useEffect(() => {
    //     if(!lastMessage){return}
    //     const msg = depkt(lastMessage.data)
    //     console.log(`RECV ${stdCodeNumberPrint(msg.msg)} ${msgStr(msg.msg)}`)
    //     console.log(msg)

    //     switch(msg.msg){
    //         default:
    //             break
    //     }
    // }, [lastMessage])
    const grid = {
        rows: 8,
        cols: 4,
        squares: [
            [{ownership: 'red'}, {ownership: 'red'}, {ownership: 'red'}, {ownership: 'red'}, {ownership: 'blue'}, {ownership: 'blue'}, {ownership: 'blue'}, {ownership: 'blue'}],
            [{ownership: 'red'}, {ownership: 'red'}, {ownership: 'red'}, {ownership: 'red'}, {ownership: 'blue'}, {ownership: 'blue'}, {ownership: 'blue'}, {ownership: 'blue'}],
            [{ownership: 'red'}, {ownership: 'red'}, {ownership: 'red'}, {ownership: 'red'}, {ownership: 'blue'}, {ownership: 'blue'}, {ownership: 'blue'}, {ownership: 'blue'}],
            [{ownership: 'red'}, {ownership: 'red'}, {ownership: 'red'}, {ownership: 'red'}, {ownership: 'blue'}, {ownership: 'blue'}, {ownership: 'blue'}, {ownership: 'blue'}]
        ]
    }

    return <div className="sess-view">
        <div className="sess-view-panel sess-view-lefpanel">
            <div style={{flex: '1 1 auto', height: '100%'}} />
        </div>
        <div className="sess-view-panel sess-view-botpanel"></div>
        <div className="sess-view-panel sess-view-bfield">
            <SVBattleGrid grid={grid} />
        </div>
        <SVChatbox 
            chatMessages={chatMessages}
            sendChatMessage={sendChatMessage}
            peers={peers}
        />
    </div>
}

export default SVMainView