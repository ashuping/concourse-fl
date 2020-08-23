/* City of Concourse Website - Bar for discrete quantities, e.g. health
	Copyright 2020 Alex Isabelle Shuping

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

import './DiscreteMultibar.css'

export const DMBTheme = {
    HERO_HEALTH: "dmb-theme dmb-theme-hero-health",
    VILLAIN_HEALTH: "dmb-theme dmb-theme-villain-health",
    MAGIC: "dmb-theme dmb-theme-magic",
    STAMINA: "dmb-theme dmb-theme-stamina",
    BLAND: "dmb-theme dmb-theme-bland",
    CUSTOM: "dmb-theme-custom"
}

export const DMBMode = {
    VERTICAL: "dmb-vertical",
    HORIZONTAL: "dmb-horizontal"
}

export function DiscreteMultibar({cur, max, mode, theme}){

    if(!theme){
        theme = DMBTheme.BLAND
    }

    if(!mode){
        mode = DMBMode.VERTICAL
    }

    let bars = []

    function status(count){
        return ((count < (max - cur)) ? "cbox-dmb-off" : "cbox-dmb-on")
    }

    if(max <= 0){
        return null
    }else if(max === 1){
        bars.push(<div key={0} className={`cbox-dmb-top cbox-dmb-bottom ${theme} ${status(0)}`} />)
    }else if(max === 2){
        bars.push(<div key={0} className={`cbox-dmb-top ${theme} ${status(0)}`} />)
        bars.push(<div key={1} className={`cbox-dmb-bottom ${theme} ${status(1)}`} />)
    }else{
        bars.push(<div key={0} className={`cbox-dmb-top ${theme} ${status(0)}`} />)
        for(let i = 1; i < max-1; i++){
            bars.push(<div key={i} className={`cbox-dmb-mid ${theme} ${status(i)}`} />)
        }
        bars.push(<div key={max-1} className={`cbox-dmb-bottom ${theme} ${status(max-1)}`} />)
    }

    return <div className={`cbox-dmb ${mode}`}>
        {bars}
    </div>
}

export default DiscreteMultibar