/* City of Concourse Website - Citizen Voices page
	Copyright 2019 Alex Isabelle Shuping

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

import bg from '../../assets/starry-sky-bg.svg'

import './CitizenVoicesView.css'

function CitizenVoice({name, occupation, quote}){
	return <div className="citizen-voice">
		<p>"{quote}"</p>
		<h1>-{name}</h1>
		<h2>{occupation}</h2>
	</div>
}

function CitizenVoicesView({cfetch, set_title}){
	const [voices, set_voices] = useState(null)
	const [load_done, set_load_done] = useState(false)

	useEffect(() => {
		cfetch("all_voices", null).then((voices) => {
			set_voices(voices)
			set_load_done(true)
		})
	}, [cfetch])

	useEffect(() => {
		set_title("Citizen Voices")
	}, [set_title])

	let count = -1
	const voices_parsed = load_done
		? (voices
			? voices.map((voice) => {
				count += 1
				return <CitizenVoice 
					key={count}
					name={voice.name}
					occupation={voice.occupation}
					quote={voice.quote}
				/>
			})
			: <p>No Citizen Voices yet, check back later!</p>
		)
		: <p>Loading, Please Wait...</p>

	return <div className="citizen-voice-view">
		<div className="bg-img">
			<img src={bg} alt="background" />
		</div>
		<div className="page-body">
			<h1>Citizen Voices!</h1>
			<h2>Here are some things that real citizens have to say about Concourse!</h2>
		</div>
		<div className="citizen-voices-container">
			{voices_parsed}
		</div>
	</div>
}

export default CitizenVoicesView