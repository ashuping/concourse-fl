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
import React from 'react'

import l0 from './parallax-bg/main-bg-lowest.svg'

import logo from './concourse-logo.svg'

import './LandingPageView.css'

function LandingPageView(){
	return <main className="main">
		<div className="bg-parallax">
			<img src={l0} className="layer-0" alt="background layer 0" />
		</div>
		<div className="title-box">
			<h1>Welcome to</h1>
			<img src={logo} className="concourse-title-logo" alt="Concourse, Florida: Gateway to the Sunshine State" />
		</div>
		<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla in porttitor nunc. Nullam quis lacus eu ante consequat accumsan ut ut lorem. Sed enim velit, vulputate sed blandit sed, varius nec nibh. Phasellus luctus quam purus, quis viverra mauris rhoncus eu. Nulla vestibulum arcu in nisl pulvinar rutrum. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Morbi mattis consequat sem a maximus. Nulla interdum massa vel dui rutrum lacinia. Ut luctus posuere tincidunt. Integer mattis auctor lobortis. Quisque id bibendum risus, vel congue tortor. Etiam vitae ligula ut arcu facilisis ornare. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Morbi sapien lectus, rhoncus at rutrum imperdiet, congue sit amet turpis.</p>
		<p>Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Donec pellentesque auctor ante, quis lacinia urna lobortis vel. Vestibulum viverra lectus turpis, ac feugiat massa vestibulum consectetur. Donec varius dolor aliquam, vehicula lectus vitae, venenatis lectus. Phasellus vehicula molestie ipsum, nec tristique turpis feugiat eget. Donec ut mollis urna, a posuere diam. Sed nec placerat dolor, id pretium nunc. Fusce malesuada nisi in lectus porta, vel aliquam augue cursus. Nam dolor sapien, interdum eu consectetur eget, porttitor vel nulla.</p>
		<p>Quisque congue tortor id hendrerit auctor. Nunc non ante vulputate elit ornare maximus. Vestibulum euismod blandit cursus. Fusce id sodales elit, ut vestibulum risus. Maecenas pulvinar risus nec purus vulputate, facilisis interdum ante interdum. Nunc elit eros, vulputate id mollis non, posuere id ligula. Pellentesque auctor sem nec sollicitudin pretium. Duis feugiat efficitur odio, eget venenatis ipsum laoreet ac. Integer in nisi commodo, tempus ante tincidunt, tempor justo. Quisque eu ultrices mauris. Sed nunc nisl, euismod sed metus eu, efficitur ullamcorper libero.</p>
		<p>Curabitur elementum, mauris non pellentesque finibus, sem sem rhoncus diam, vel molestie turpis ante eu augue. Etiam vestibulum augue lacinia neque blandit rutrum. Sed non felis enim. Aenean viverra pellentesque mauris sit amet sollicitudin. Quisque scelerisque est vel lacus malesuada malesuada. Nulla facilisi. Proin ut urna elementum risus dapibus congue. Etiam auctor condimentum mauris, fringilla rhoncus arcu imperdiet quis. Fusce malesuada, lacus eu accumsan efficitur, arcu arcu suscipit purus, quis pretium tortor tortor sit amet eros.</p>
		<p>Maecenas non velit sit amet ex rutrum euismod. Cras volutpat lorem ac quam dictum finibus. Integer gravida, erat id vulputate egestas, arcu nisl efficitur diam, vel malesuada est mi ac metus. Aliquam varius magna vel molestie ornare. Nam quis condimentum dolor, quis volutpat tortor. Proin aliquet vehicula est, nec iaculis felis ornare at. Donec luctus pellentesque magna, quis maximus est sagittis quis. Ut eget urna sed lorem tincidunt vehicula sit amet vitae dolor. Nunc eleifend tellus enim, in suscipit leo pharetra dignissim. Interdum et malesuada fames ac ante ipsum primis in faucibus. Duis interdum aliquet purus, volutpat volutpat eros dignissim sit amet. Nulla tristique mi a sapien finibus elementum. Mauris tempor bibendum maximus. Suspendisse vitae dapibus nibh. </p>
	</main>
}

export default LandingPageView