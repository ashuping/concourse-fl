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

/* Creates a new Citizen Voice entry
 *
 * Expects a JSON object as the body, in the form
 * {
 *    name: "name of the quote author",
 *    occupation: "occupation of the quote author",
 *    quote: "the quote to display"
 * }
 * 
 * Returns 200 if the quote was successfully added, or 400 if the request was
 * malformed in some way.
 * 
 * If the request was successful, also returns the same object sent with the
 * request, but with an additional _id field that can be used as a unique
 * identifier.
 * 
 * Response format:
 * {
 *    _id: "unique_hexadecimal_identifier"
 *    name: "name of the quote author",
 *    occupation: "occupation of the quote author",
 *    quote: "the quote to display"
 * }
 */
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

/* Retrieves a single Citizen Voice entry
 * 
 * Expects the unique identifier for the requested object to be passed in as
 * part of the URL.
 * 
 * Returns the same objects returned by CreateCitizenView, above.
 * 
 * Returns 200 if the request was successful, 404 if the identifier was not
 * found, or 400 if the identifier is malformed in some way.
 */
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

/* Retrieves all CitizenVoice entries
 * 
 * If the database contains any CitizenVoice entries, this returns a JSON array
 * containing all entries (with status code 200). If the database does not
 * contain any entries, returns status code 404.
 */
export const RetrieveAllVoices = async (req, res, next) => {
	const got = await CitizenVoiceModel.find()

	if(got){
		res.status(200).json(got)
	}else{
		res.status(404)
	}
}

/* Updates a CitizenVoice entry
 * 
 * Expects the unique identifier for the requested object to be passed in as
 * part of the URL. The values to update should be provided as a JSON object in
 * the body of the request.
 * 
 * Only fields which are modified need to be included in the request -
 * fields which are not present in the request are assumed by the server to be
 * unmodified.
 * 
 * The _id field CANNOT BE MODIFIED, and should not be included in the request.
 * Requests containing an _id entry will be rejected with a 400 status code.
 * 
 * If the entry is found and successfully updated, a JSON object (in the same
 * format returned by CreateCitizenVoice) representing the object's state after
 * modification is returned, with status code 200.
 * 
 * If no entry is found, status code 404 is returned. If the unique identifier
 * is malformed, if the body of the request contains unknown keys, or if the
 * body contains the _id field, 400 is returned.
 */
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

/* Deletes a Citizen Voice entry from the database
 *
 * Expects the unique identifier for the requested object to be passed in as
 * part of the URL.
 * 
 * If the object exists, it will be deleted, and a JSON object representing the
 * object (before deletion) will be returned (in the same format as that
 * returned by CreateCitizenVoice) with status code 200.
 * 
 * Returns 404 if the identifier was not found, or 400 if the identifier is
 * malformed in some way.
 */
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