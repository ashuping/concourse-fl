import React from 'react'
import { Editor } from 'draft-js'

import './ComplexTextEditor.css'

function ComplexTextEditor( {cte_state, set_cte_state} ){
    return <div className="complex-text-editor">
        <div className="cte-inner">
            <Editor 
                editorState={cte_state}
                onChange={set_cte_state}
            />
        </div>
    </div>
}

export function CTERenderer( {cte_raw_content, short} ){
    const paras = []

    for (const block of cte_raw_content.blocks){
        paras.push(<p key={block.key}>{block.text}</p>)
        if(short){
            break
        }
    }

    return <div className="complex-text-rendered">{paras}</div>
}

export default ComplexTextEditor