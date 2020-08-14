/* City of Concourse Website - Component for a button containing status information
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

import React from 'react'
import { Circle, CheckCircle, MinusCircle, XCircle, Loader } from 'react-feather'

import './StatusButton.css'

export const SBStatus = {
    READY: {
        icon: <Circle />,
        class: 'sb-ready'
    },
    DISABLED: {
        icon: <MinusCircle />,
        class: 'sb-disabled'
    },
    WORKING: {
        icon: <Loader />,
        class: 'sb-working'
    },
    DONE: {
        icon: <CheckCircle />,
        class: 'sb-done'
    },
    FAILED: {
        icon: <XCircle />,
        class: 'sb-failed'
    }
}

function StatusButton({onClick, status, ready_text, disabled_text, working_text, done_text, failed_text}){

    if(!disabled_text){
        disabled_text = ready_text
    }

    if(!working_text){
        working_text = ready_text
    }

    if(!done_text){
        done_text = ready_text
    }
    
    if(!failed_text){
        failed_text = ready_text
    }

    let text = ready_text
    let btn_cls = ''
    switch(status){
        case SBStatus.READY:
            text = ready_text
            break
        case SBStatus.DISABLED:
            text = disabled_text
            btn_cls = 'button-disabled'
            break
        case SBStatus.WORKING:
            text = working_text
            btn_cls = 'button-working'
            break
        case SBStatus.DONE:
            text = done_text
            btn_cls = 'button-green button-force-hover'
            break
        case SBStatus.FAILED:
            text = failed_text
            btn_cls = 'button-red button-force-hover'
            break
    }

    return <div className={`sb-container ${status.class}`}>
        <div 
            className={`button ${btn_cls} sb-button`}
            onClick={onClick}
        >
            <span>{text}</span>
            {status.icon}
        </div>
    </div>
}

export default StatusButton