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
import DashboardView from './views/DashboardView/DashboardView'
import SessionView from './views/SessionView/SessionView'

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

const tbar_modes = [
	"main",
	"nobg"
]

function App() {
	const [cache, set_cache] = useState({})
	const [title, set_title] = useState("City of Concourse")
	const [mode, set_mode] = useState("main")

	const fetch_wrapper = (type, id, force) => fetch_value(type, id, force, cache, set_cache)

	return (
		<div className={`approot approot-${mode}`}>
			<div className={"approot-body"}>
				<Router>
					{tbar_modes.includes(mode) ? <Header title={title} /> : null}
					{tbar_modes.includes(mode) ? <div className="header-spacer" /> : null}
					<Switch>
						<Route exact path="/">
							{/* <Header title={title} /> */}
							<LandingPageView 
								cfetch={fetch_wrapper}
								set_title={set_title}
								set_app_mode={set_mode}
							/>
						</Route>
						<Route path="/citizen-voices">
							{/* <Header title={title} /> */}
							<CitizenVoicesView
								cfetch={fetch_wrapper}
								set_title={set_title}
							/>
						</Route>
						<Route path="/login">
							{/* <Header title={title} /> */}
							<LoginView 
								cfetch={fetch_wrapper}
								set_title={set_title}
								set_app_mode={set_mode}
							/>
						</Route>
						<Route path="/register">
							{/* <Header title={title} /> */}
							<RegisterView 
								cfetch={fetch_wrapper}
								set_title={set_title}
								set_app_mode={set_mode}
							/>
						</Route>
						<Route path="/dashboard">
							{/* <Header title={title} /> */}
							<DashboardView 
								cfetch={fetch_wrapper}
								set_title={set_title}
								active_tab="campaigns"
								props={null}
							/>
						</Route>
						<Route path="/profile">
							{/* <Header title={title} /> */}
							<DashboardView
								cfetch={fetch_wrapper}
								set_title={set_title}
								active_tab="profile"
								props={null}
							/>
						</Route>
						<Route path="/admin">
							{/* <Header title={title} /> */}
							<DashboardView 
								cfetch={fetch_wrapper}
								set_title={set_title}
								active_tab="admin"
								props={null}
							/>
						</Route>
						<Route exact path="/campaigns/create">
							{/* <Header title={title} /> */}
							<DashboardView 
								cfetch={fetch_wrapper}
								set_title={set_title}
								active_tab="campaign_create"
								props={null}
							/>
						</Route>
						<Route exact path="/campaigns/:cid" 
							render={props => <div>
								{/* <Header title={title} /> */}
								<DashboardView 
									cfetch={fetch_wrapper}
									set_title={set_title}
									active_tab="campaign_detail"
									props={props}
								/>
							</div>}
						/>
						<Route exact path="/campaigns/:cid/characters/:charid/edit"
							render={(props) => {
								props.match.params.cmode = 'edit'
								return <div>
									{/* <Header title={title} /> */}
									<DashboardView 
										cfetch={fetch_wrapper}
										set_title={set_title}
										active_tab="campaign_detail"
										props={props}
									/>
									</div>
							}}
						/>
						<Route exact path="/campaigns/:cid/characters/new"
							render={(props) => {
								props.match.params.cmode = 'new'
								return <div>
									{/* <Header title={title} /> */}
									<DashboardView 
										cfetch={fetch_wrapper}
										set_title={set_title}
										active_tab="campaign_detail"
										props={props}
									/>
								</div>
							}}
						/>
						<Route exact path="/campaigns/:cid/sessions/start"
							render={(props) => {
								return <SessionView 
									cid={props.match.params.cid}
									sid={null}
									setAppMode={set_mode}
								/>
							}}
						/>
						<Route exact path="/campaigns/:cid/sessions/:sid"
							render={(props) => {
								return <SessionView 
									cid={props.match.params.cid}
									sid={props.match.params.sid}
									setAppMode={set_mode}
								/>
							}}
						/>
					</Switch>
				</Router>
			</div>
		</div>
	);
}

export default App;
