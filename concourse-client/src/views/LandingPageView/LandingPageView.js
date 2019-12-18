/* City of Concourse Website - Landing Page View
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
import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'

import l0 from '../../assets/starry-sky-bg.svg'
import logo from '../../assets/concourse-logo.svg'

import './LandingPageView.css'

function LandingPageView({set_title}){
	useEffect(() => {
		set_title("City of Concourse")
	}, [set_title])

	return <main className="main">
		<div className="bg-parallax">
			<img src={l0} className="layer-0" alt="background layer 0" />
		</div>
		<div className="title-box">
			<h1>Welcome to</h1>
			<img src={logo} className="concourse-title-logo" alt="Concourse, Florida: Gateway to the Sunshine State" />
		</div>
		<div className="top-blurb">
			<p>Concourse is a small city in southern Florida, on the wooded shores of <Link to="/lake-yeehaw">Lake Yeehaw</Link>. Home to over 28,000 happy <Link to="/citizen-voices">citizens</Link>, Concourse is </p>
		</div>
	</main>
}

export default LandingPageView