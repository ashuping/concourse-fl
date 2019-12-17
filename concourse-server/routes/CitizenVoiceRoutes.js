/* City of Concourse Website - Citzen Voices Routes
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

import express from 'express'
const Router = express.Router()

import { CreateCitizenVoice, RetrieveCitizenVoice, RetrieveAllVoices, EditCitizenVoice, DeleteCitizenVoice } from '../controllers/CitizenVoiceController.js'

Router.get('/', RetrieveAllVoices)
Router.get('/:id', RetrieveCitizenVoice)
Router.post('/create', CreateCitizenVoice)
Router.post('/:id', EditCitizenVoice)
Router.delete('/:id', DeleteCitizenVoice)

export default Router