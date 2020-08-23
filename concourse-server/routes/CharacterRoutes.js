/* City of Concourse Website - Character Routes
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

import { CreateCharacter, SetCharacterAttribute, GetCharacterAttribute, GetInstance, GetCharacter, EditCharacter, DeleteCharacter, DeleteInstance } from '../controllers/CharacterController.js'

Router.post('/new', passport.authenticate('jwt', {session: false}), CreateCharacter)
Router.get('/:charid', passport.authenticate('jwt', {session: false}), GetCharacter)
Router.post('/:charid', passport.authenticate('jwt', {session: false}), EditCharacter)
Router.delete('/:charid', passport.authenticate('jwt', {session: false}), DeleteCharacter)
Router.get('/instance/:charid', passport.authenticate('jwt', {session: false}), GetInstance)
Router.delete('/instance/:instid', passport.authenticate('jwt', {session: false}), DeleteInstance)
Router.get('/instance/:charid/:attrid', passport.authenticate('jwt', {session: false}), GetCharacterAttribute)
Router.post('/instance/:charid/:attrid', passport.authenticate('jwt', {session: false}), SetCharacterAttribute)

export default Router