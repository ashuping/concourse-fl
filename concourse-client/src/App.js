/* City of Concourse Website - Main Application
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
import React, { useState } from 'react'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'

import './App.css'

import { GetAllVoices, GetVoice } from './util/Voices'
import { GetCurrentUser, GetUser, GetRegistrationOptions } from './util/Users'

import Header from './components/Header/Header'
import LandingPageView from './views/LandingPageView/LandingPageView'
import CitizenVoicesView from './views/CitizenVoicesView/CitizenVoicesView'
import LoginView from './views/LoginView/LoginView'
import RegisterView from './views/RegisterView/RegisterView'

async function fetch_value(type, id, force, cache, set_cache){
	switch(type){
		case "all_voices":
			if(!force && cache && cache.voice && cache.voice.all){
				return Object.values(cache.voice).filter((val) => val !== true)
			}else{
				const all_voices = await GetAllVoices()
				cache.voice = all_voices
				cache.voice.all = true
				set_cache(cache)
				return all_voices
			}
		case "voice":
			if(!force && cache && cache.voice && cache.voice[id]){
				return cache.voice[id]
			}else{
				const new_voice = await GetVoice(id)
				if(!cache.voice){cache.voice = {all: false}}
				cache.voice[id] = new_voice
				set_cache(cache)
				return new_voice
			}
		case "user":
			if(id === "current"){
				if(!force && cache && cache.current_user){
					return cache.current_user
				}else{
					cache.current_user = await GetCurrentUser()
					return cache.current_user
				}
			}else{
				if(!force && cache && cache.users && cache.users[id]){
					return cache.users[id]
				}else{
					const new_user = await GetUser(id)
					if(!cache.users){cache.users = {}}
					cache.users[id] = new_user
					set_cache(cache)
					return new_user
				}
			}
		case "registration_options":
			if(!force && cache && cache.registration_options){
				return cache.registration_options
			}else{
				cache.registration_options = await GetRegistrationOptions()
				return cache.registration_options
			}
		default:
			console.error(`Attempted to call fetch_value for unknown type ${type} (id ${id}).`)
			return null
	}
}

function App() {
	const [cache, set_cache] = useState({})
	const [title, set_title] = useState("City of Concourse")

	const fetch_wrapper = (type, id, force) => fetch_value(type, id, force, cache, set_cache)

	return (
		<Router>
			<Header title={title} />
			<Switch>
				<Route exact path="/">
					<LandingPageView 
						cfetch={fetch_wrapper}
						set_title={set_title}
					/>
				</Route>
				<Route path="/citizen-voices">
					<CitizenVoicesView
						cfetch={fetch_wrapper}
						set_title={set_title}
					/>
				</Route>
				<Route path="/login">
					<LoginView 
						cfetch={fetch_wrapper}
						set_title={set_title}
					/>
				</Route>
				<Route path="/register">
					<RegisterView 
						cfetch={fetch_wrapper}
						set_title={set_title}
					/>
				</Route>
			</Switch>
		</Router>
	);
}

export default App;
