/* City of Concourse Website - Component to hold information on a character
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
import { Link } from 'react-router-dom'

import { CTERenderer } from '../ComplexTextEditor/ComplexTextEditor.js'
import DiscreteMultibar, { DMBTheme, DMBMode } from '../indicators/DiscreteMultibar.js'
import SpeedBar from './SpeedBar/SpeedBar.js'

import './CharacterBox.css'

export function CharacterBox_MOTW({char, show_edit_link, edit_link_to}){

	const elems = []
	const hp = {
		cur: null,
		max: null
	}
	let speed = null

	if(char.character.description){
		elems.push(
			<div 
				className="charbox-desc"
				key="description"
			><CTERenderer 
				cte_raw_content={JSON.parse(char.character.description)}
				short={true}
			/></div>
			)
	}

	for(const attribute of char.attributes){
		switch(attribute.campaign_character_attribute.name){
			case "Speed":
				speed = attribute.val
				break
			case "HP":
				hp.cur = attribute.val
				break
			case "Max HP":
				hp.max = attribute.val
			default:
				break
		}
	}

	if(hp.cur !== null && hp.max !== null){
		elems.push(
			<div 
				className="charbox-health"
				key="health"
			>
				<div className="charbox-health-desc">HARM {hp.max - hp.cur}/{hp.max}</div>
				<DiscreteMultibar cur={hp.cur} max={hp.max} theme={DMBTheme.HERO_HEALTH} mode={DMBMode.HORIZONTAL} />
			</div>
		)
	}

	if(speed !== null){
		elems.push(
			<div 
				className="charbox-speed"
				key="speed"
			>
				<SpeedBar speed={speed} />
			</div>
		)
	}
	
	let charname_elem = char.character.name

	if(show_edit_link){
		charname_elem = <Link to={edit_link_to}>{char.character.name}</Link>
	}

    return <div className="character-box">
        <div className="charbox-name">{charname_elem}</div>
		<div className="charbox-inner">
			{elems}
		</div>
    </div>
}