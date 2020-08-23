/* City of Concourse Website - Campaign Routes
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

import express from 'express'
const Router = express.Router()

import passport from 'passport'

import { CreateCampaign, RetrieveAllCampaigns, RetrieveCampaign, CreateInstanceAttribute } from '../controllers/CampaignController.js'

Router.get('/', passport.authenticate('jwt', {session: false}), RetrieveAllCampaigns)
Router.get('/:id', passport.authenticate('jwt', {session: false}), RetrieveCampaign)
Router.post('/new', passport.authenticate('jwt', {session: false}), CreateCampaign)
Router.post('/:id/attributes/new', passport.authenticate('jwt', {session: false}), CreateInstanceAttribute)

export default Router