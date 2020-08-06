/* City of Concourse Website - Registration page
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

import React, { useState, useEffect, useCallback } from 'react'

import { Link, Redirect } from 'react-router-dom'

import { Register } from '../../util/Users'

import { Login } from '../../util/Auth'

import bg from '../../assets/starry-sky-bg.svg'

import './RegisterView.css'

const pronouns_they_them = {
	"subject": "they",
	"object": "them",
	"dependent_possessive": "their",
	"independent_possessive": "theirs",
	"reflexive": "themself"
}

const pronouns_she_her = {
	"subject": "she",
	"object": "her",
	"dependent_possessive": "her",
	"independent_possessive": "hers",
	"reflexive": "herself"
}

const pronouns_he_him = {
	"subject": "he",
	"object": "him",
	"dependent_possessive": "his",
	"independent_possessive": "his",
	"reflexive": "himself"
}

function RegisterView({cfetch, set_title}){
	const [user, set_user] = useState(null)
	const [reg_warning, set_reg_warning] = useState(null)
	const [regcode_required, set_regcode_required] = useState(false)

	const [username, set_username] = useState("")
	const [password, set_password] = useState("")
	const [display_name, set_display_name] = useState("")
	const [pronouns_option, set_pronouns_option] = useState("they")
	const [pronouns_sub, set_pronouns_sub] = useState("")
	const [pronouns_obj, set_pronouns_obj] = useState("")
	const [pronouns_dps, set_pronouns_dps] = useState("")
	const [pronouns_ips, set_pronouns_ips] = useState("")
	const [pronouns_rfx, set_pronouns_rfx] = useState("")
	const [regcode, set_regcode] = useState("")
	const [email, set_email] = useState("temp@coolbooks.biz")
	const [persist, set_persist] = useState(false)

	const [btn_enabled, set_btn_enabled] = useState(false)

	useEffect(() => {
		set_title("New User Registration")
	}, [set_title])

	useEffect(() => {
		cfetch("user", "current", true).then(set_user)
		cfetch("registration_options", null, false).then((reg_options) => {set_regcode_required(reg_options.keys_required)})
	}, [cfetch])

	useEffect(() => {
		if(username && password && display_name
			&& ((!regcode_required) || regcode)
			&& ((pronouns_option !== 'custom') || (pronouns_dps && pronouns_ips && pronouns_obj && pronouns_rfx && pronouns_sub))
		){
			set_btn_enabled(true)
		}else{
			set_btn_enabled(false)
		}
	}, [username, password, display_name, pronouns_option, pronouns_dps, pronouns_ips, pronouns_obj, pronouns_rfx, pronouns_sub, regcode, persist, regcode_required])

	const on_register = useCallback(async () => {
		if(!btn_enabled){return}

		let pronouns = {
			"subject": pronouns_sub,
			"object" : pronouns_obj,
			"dependent_possessive"  : pronouns_dps,
			"independent_possessive": pronouns_ips,
			"reflexive": pronouns_rfx
		}

		if(pronouns_option === "they"){
			pronouns = pronouns_they_them
		}else if(pronouns_option === "she"){
			pronouns = pronouns_she_her
		}else if(pronouns_option === "he"){
			pronouns = pronouns_he_him
		}

		set_btn_enabled(false)
		const res = await Register(
			username, password, display_name, pronouns, email, regcode
		)
		set_btn_enabled(true)

		if(res.status === 200){
			set_reg_warning(null)
			await Login(username, password, false)
			cfetch("user", "current", true).then(set_user)
		}else{
			console.log(res)
			let rjs = await res.json()
			console.log(rjs)
			if(rjs.reason === "Password found in breach database"){
				let time_or_times = "time"
				if(rjs.breaches > 1){
					time_or_times = "times"
				}
				set_reg_warning(<div className="smol-warn">
					<p>The password you chose was found on a list of breached passwords (found {rjs.breaches} {time_or_times}). Choose a different password, and if you use this password anywhere else, consider changing it.</p>
				</div>)
			}else{
				set_reg_warning(<div className="smol-warn">
					<p>Registration error: {rjs.reason}</p>
				</div>)
			}
		}
	}, [username, password, display_name, pronouns_option, pronouns_dps, pronouns_ips, pronouns_obj, pronouns_rfx, pronouns_sub, regcode, btn_enabled, email, cfetch])

	if(user){
		// Logged-in users don't need to register - redirect to main.
		return <Redirect to="/dashboard"/>
	}

	let regcode_line = <tr>
		<td><input className="regcode" type="text" onChange={(event) => set_regcode(event.target.value)} placeholder="Registration Code" /></td>
		<td><div className={btn_enabled ? "button" : "button button-disabled"} onClick={on_register}>Register</div></td>
	</tr>

	if(!regcode_required){
		regcode_line = <tr>
			<td colSpan={2}><div className={btn_enabled ? "button" : "button button-disabled"} onClick={on_register}>Register</div></td>
		</tr>
	}

	let custom_pronouns = null

	if(pronouns_option === 'custom'){
		custom_pronouns = <tr><td colSpan={2} style={{width: 'min-content'}}><div style={{width: '100%'}}>
			<input type="text" onChange={(event) => set_pronouns_sub(event.target.value)} placeholder="Subjective - they" />
			<input type="text" onChange={(event) => set_pronouns_obj(event.target.value)} placeholder="Objective - them" />
			<input type="text" onChange={(event) => set_pronouns_dps(event.target.value)} placeholder="Dependent Possessive - their" />
			<input type="text" onChange={(event) => set_pronouns_ips(event.target.value)} placeholder="Independent Possessive - theirs" />
			<input type="text" onChange={(event) => set_pronouns_rfx(event.target.value)} placeholder="Reflexive - themself" />
		</div></td></tr>
	}

	return <div className="register-view center-both-container">
		<div className="bg-img">
			<img src={bg} alt="background" />
		</div>
		<div className="center-both-contents">
			<h1>Welcome!</h1>
			<h2>Please register below or <Link to='/login'>Log in</Link></h2>
			{reg_warning}
			<table className="register-form std-form"><tbody>
				<tr>
					<td><input className="display-name" type="text" onChange={(event) => set_display_name(event.target.value)} placeholder="Display Name" /></td>
					<td><select value={pronouns_option} onChange={(event) => {set_pronouns_option(event.target.value)}}>
						<option value="she">She/Her</option>
						<option value="he">He/Him</option>
						<option value="they">They/Them</option>
						<option value="custom">Customize</option>
					</select></td>
				</tr>
				{custom_pronouns}
				<tr>
					<td colSpan={2}><input className="email" type="text" onChange={(event) => set_email(event.target.value)} placeholder="Email" /></td>
				</tr>
				<tr>
					<td colSpan={2}><input className="username" type="text" onChange={(event) => set_username(event.target.value)} placeholder="Username" /></td>
				</tr>
				<tr>
					<td colSpan={2}><input className="password" type="password" onChange={(event) => set_password(event.target.value)} placeholder="Password" /></td>
				</tr>
				{regcode_line}
			</tbody></table>
			
		</div>
	</div>
}

export default RegisterView