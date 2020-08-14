/* City of Concourse Website - Login page
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

import { Login } from '../../util/Auth'

import bg from '../../assets/starry-sky-bg.svg'

import './LoginView.css'

function LoginView({cfetch, set_title}){
	const [user, set_user] = useState(null)
	const [login_warning, set_login_warning] = useState(null)

	const [email, set_email] = useState("")
	const [password, set_password] = useState("")
	const [persist, set_persist] = useState(false)

	const [btn_enabled, set_btn_enabled] = useState(false)

	useEffect(() => {
		set_title("Log in")
	}, [set_title])

	useEffect(() => {
		cfetch("user", "current", true).then(set_user)
	}, [cfetch])

	useEffect(() => {
		if(email && password){
			set_btn_enabled(true)
		}else{
			set_btn_enabled(false)
		}
	}, [email, password])

	const on_login = useCallback(async () => {
		if(!btn_enabled){return}

		set_btn_enabled(false)
		const res = await Login(email, password, persist)
		set_btn_enabled(true)

		if(res.success){
			set_login_warning(null)
			set_user(true)
		}else{
			set_login_warning(<div className="smol-warn">
				<p>Authentication failed. Check your email and password and try again.</p>
			</div>)
		}
	}, [email, password, persist, btn_enabled])

	if(user){
		// Logged-in users don't need to log in again - redirect to main.
		return <Redirect to="/dashboard"/>
	}

	const not_yet_implemented_persist = <div style={{display: 'none'}}>
		<p>NOTE: This feature is not yet implemented on the backend - setting it to true will have no effect.</p>
		<p>Want to change that? <a href="https://github.com/ashuping/concourse-fl">We're open-source!</a></p>
		<p><input className="persist" style={{width: 0}} type="checkbox" onChange={(event) => set_persist(event.target.checked)} /> Stay logged in?</p>
	</div>

	return <div className="login-view center-both-container">
		<div className="bg-img">
			<img src={bg} alt="background" />
		</div>
		<div className="center-both-contents">
			<h1>Welcome back!</h1>
			<h2>Please log in below or <Link to='/register'>Create an Account</Link></h2>
			{login_warning}
			<div className="login-form std-form">
				<input className="email" type="text" onChange={(event) => set_email(event.target.value)} placeholder="Email Address" />
				<input className="password" type="password" onChange={(event) => set_password(event.target.value)} placeholder="Password" />
				{not_yet_implemented_persist}
			</div>
			<div className={btn_enabled ? "button" : "button button-disabled"} onClick={on_login}>Login</div>
		</div>
	</div>
}

export default LoginView