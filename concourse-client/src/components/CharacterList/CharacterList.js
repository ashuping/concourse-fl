/* City of Concourse Website - Component to hold a list of characters
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
import { PlusSquare } from 'react-feather'

import { CharacterBox_MOTW } from '../CharacterBox/CharacterBox.js'

import './CharacterList.css'

function NewCharBox({campaign}){
	return <Link 
		to={`/campaigns/${campaign._id}/characters/new`}
		className="character-list-newbox"
	><PlusSquare /><span>New Character</span></Link>
}

function CharacterList({user, chars, campaign}){

	const char_objs = chars.map((char) => {
		if(
			(campaign && campaign.permissions.administrate)
			|| char.character.owner._id.toString() === user._id.toString()
		){
			return <CharacterBox_MOTW 
				char={char}
				key={char._id}
				show_edit_link={true}
				edit_link_to={`/campaigns/${campaign._id}/characters/${char._id}/edit`}
			/>
		}else{
			return <CharacterBox_MOTW 
				char={char}
				key={char._id}
			/>
		}
	})

    return <div className="character-list">
        {char_objs}
		{(campaign && campaign.permissions.play) ? <NewCharBox campaign={campaign} /> : null}
    </div>
}

export default CharacterList