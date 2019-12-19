/* City of Concourse Website - Citizen Voices Controller
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

import { CitizenVoiceModel } from '../models/CitizenVoiceSchema.js'
import mongodb from 'mongodb'

export const CreateCitizenVoice = (req, res, next) => {
	if(!(
		req.body.name
		&& req.body.occupation
		&& req.body.quote
	)){
		return res.status(400).json({
			reason: "Missing required fields"
		})
	}
	const new_voice = new CitizenVoiceModel({
		name: req.body.name,
		occupation: req.body.occupation,
		quote: req.body.quote
	})

	new_voice.save((err) => {
		if(err){
			return next(err)
		}

		res.status(200).json(new_voice)
	})
}

export const RetrieveCitizenVoice = async (req, res, next) => {
	const obj_id = req.params.id

	if(!mongodb.ObjectID.isValid(obj_id)){
		res.status(400).json({
			reason: "Malformed Object ID"
		})
	}else{

		const got = await CitizenVoiceModel.findById(obj_id)

		if(got){
			res.status(200).json(got)
		}else{
			res.sendStatus(404)
		}
	}
}

export const RetrieveAllVoices = async (req, res, next) => {
	const got = await CitizenVoiceModel.find()

	if(got){
		res.status(200).json(got)
	}else{
		res.status(404)
	}
}

export const EditCitizenVoice = async (req, res, next) => {
	const obj_id = req.params.id

	if(!mongodb.ObjectID.isValid(obj_id)){
		return res.status(400).json({
			reason: "Malformed Object ID"
		})
	}else{
		const to_edit = await CitizenVoiceModel.findById(obj_id)

		if(!to_edit){
			return res.sendStatus(404)
		}

		const valid_keys = [
			"name", "occupation", "quote"
		]
		let unknown_keys = []
		Object.keys(req.body).forEach(function(key){
			if(!valid_keys.includes(key)){
				unknown_keys.push(key)
			}
		})

		if(unknown_keys.length > 0){
			if(unknown_keys.includes("_id")){
				return res.status(400).json({
					reason: "Object ID cannot be modified"
				})
			}else{
				return res.status(400).json({
					reason: `Unknown input field(s) ${unknown_keys}`
				})
			}
		}

		if(req.body.name){
			if(!typeof(req.body.name) === "string"){
				return res.status(400).json({
					reason: "Malformed input data"
				})
			}
			to_edit.name = req.body.name
		}

		if(req.body.occupation){
			if(!typeof(req.body.occupation) === "string"){
				return res.status(400).json({
					reason: "Malformed input data"
				})
			}
			to_edit.occupation = req.body.occupation
		}

		if(req.body.quote){
			if(!typeof(req.body.occupation) === "string"){
				return res.status(400).json({
					reason: "Malformed input data"
				})
			}
			to_edit.quote = req.body.quote
		}

		to_edit.save((err) => {
			if(err){
				return next(err)
			}

			return res.status(200).json(to_edit)
		})
	}
}

export const DeleteCitizenVoice = async (req, res, next) => {
	const obj_id = req.params.id

	if(!mongodb.ObjectID.isValid(obj_id)){
		return res.status(400).json({
			reason: "Malformed Object ID"
		})
	}else{
		const deleted = await CitizenVoiceModel.findByIdAndDelete(req.params.id)

		if(deleted){
			res.status(200).json(deleted)
		}else{
			res.sendStatus(404)
		}
	}
}