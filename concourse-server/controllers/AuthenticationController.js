/* City of Concourse Website - Authentication Controller
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

import jwt from 'jsonwebtoken'
import mongodb from 'mongodb'
import passport from 'passport'

import { TokenBlacklistModel } from '../models/TokenBlacklistSchema.js'

import config from '../config/config.js'
import { UserProfileModel } from '../models/UserProfileSchema.js'

/* Attempts to authenticate a user.
 * 
 * NOTE: Persistent session keys have not yet been implemented. Attempts to use
 * them will result in 501 errors.
 * 
 * Returns a signed JWT containing the user's profile on success.
 * 
 * The field "method" is required, and specifies how the user should
 * authenticate to the application.
 * 
 * The following methods are available:
 *   > local: authenticate with an email and password
 *       The "email" and "password" fields should be included in requests
 *       using this method. To get a persistent session-cookie in addition to
 *       the short-term JWT, pass "persistent: true"
 *   > token: use an existing valid and unexpired JWT to retrieve a new token
 *   > session: use a persistent session-cookie to retrieve a new token
 * 
 * Note that a persistent session-cookie can only be retrieved with the "local"
 * method - the "persistent" key will result in a 400 error in all other
 * methods.
 * 
 * Responds with status code 200 on success, 401 on authentication failure, 500
 * if an internal error occurs, 400 if the request is malformed such that it
 * cannot be processed, and 501 if the request attempts to use a feature which
 * has not yet been implemented.
 */
export const Login = (req, res, next) => {
	if(!req.body.method){
		return res.status(400).json({
			reason: "Malformed request: 'method' is required"
		})
	}
	if(req.body.method == 'local'){
		if(!(
			req.body.email && req.body.password
		)){
			return res.status(400).json({
				reason: "Malformed request: 'email' and 'password' are required"
			})
		}
		// console.log('About to look up user ID by email')
		// const uid = UserProfileModel.findOne({email: [{ address: req.body.email, verified: true, primary: true }]})
		// try{
		// 	const uid = UserProfileModel.findOne({email: { address: req.body.email, verified: true, primary: true }})
		// }catch(e){
		// 	console.error(e)
		// 	return res.sendStatus(500)
		// }
		// if(!uid){
		// 	return res.status(401).json({
		// 		reason: "Authentication failure."
		// 	})
		// }
		// console.log('Looked up user ID by email')
		// req.body.profile = uid._id
		passport.authenticate('local', {session: false}, function(err, user, info){
			if(req.body.persistent){
				return res.status(501).json({
					reason: "Persistent session keys not yet implemented"
				})
			}
			if(err){
				return next(err)
			}

			if(!user){
				console.log('Passport local authentication failed:')
				console.log(info)
				return res.status(401).json({
					reason: "Authentication failure"
				})
			}

			req.login(user, {session: false}, async function(err){
				if(err){
					return next(err)
				}

				const blacklist_entry = new TokenBlacklistModel({
					owning_user: user._id
				})

				await blacklist_entry.save()

				const token = {
					id: blacklist_entry._id,
					user: user.toJSON()
				}

				return res.status(200).cookie(
					'token',
					jwt.sign(token, process.env.AUTH_SECRET || config.auth.secret, {expiresIn: process.env.AUTH_TKN_LIFETIME || config.auth.token_lifetime}),
					{
						secure: (process.env.NODE_ENV=='production' ? true : false),
						sameSite: 'strict',
						path: '/api/v1',
						httpOnly: true,
						maxAge: (process.env.AUTH_TKN_LIFETIME || config.auth.token_lifetime)
					}).json({
						id: blacklist_entry._id,
						user: user.toJSON()
					})
			})
		})(req, res)
	}else if(req.body.method == 'token'){
		if(req.body.persistent){
			return res.status(400).json({
				reason: 'Persistent session keys cannot be retrieved with this authentication method.'
			})
		}
		passport.authenticate('jwt', {session: false}, function(err, user, info){
			if(err){
				return next(err)
			}

			if(!user){
				return res.status(401).json({
					reason: "Authentication failure"
				})
			}

			req.login(user.user, {session: false}, async function(err){
				if(err){
					return next(err)
				}

				const blacklist_entry = new TokenBlacklistModel({
					owning_user: user.user._id
				})

				await blacklist_entry.save()

				const token = {
					id: blacklist_entry._id,
					user: user.user.toJSON()
				}
				
				return res.status(200).cookie(
					'token',
					jwt.sign(token, process.env.AUTH_SECRET || config.auth.secret, {expiresIn: process.env.AUTH_TKN_LIFETIME || config.auth.token_lifetime}),
					{
						secure: (process.env.NODE_ENV=='production' ? true : false),
						sameSite: 'strict',
						path: '/api/v1',
						httpOnly: true,
						maxAge: (process.env.AUTH_TKN_LIFETIME || config.auth.token_lifetime)
					}).json({
						id: blacklist_entry._id,
						user: user.user.toJSON()
					})
			})
		})(req, res)
	}else if(req.body.method == 'session'){
		if(req.body.persistent){
			return res.status(400).json({
				reason: 'Persistent session keys cannot be retrieved with this authentication method.'
			})
		}

		return res.status(501).json({
			reason: "Persistent session keys not yet implemented"
		})
	}else{
		return res.status(400).json({
			reason: `Unknown authentication method "${req.body.method}"`
		})
	}
}

/* Attempts to invalidate one or all tokens for a user.
 * 
 * The request body should contain an id field - this should either contain the
 * UID of the token to invalidate (this ID is provided as part of the response
 * to the login method), or "all" to invalidate every token created by the
 * logged-in user.
 * 
 * Administrators can additionally request to invalidate all of a different
 * user's tokens - pass the user-id of the user to invalidate as the 
 * 'invalidate_other_user' field. Pass 'all' instead of a user id to invalidate
 * ALL current tokens.
 * 
 * If the requested ID cannot be parsed as an ObjectID (and is not 'all'), this
 * will fail with 400.
 * 
 * If the requesting user is an administrator, this will either succeed (200)
 * or return a 404 to indicate that the requested ID was not found.
 * 
 * If the requesting user is NOT an administrator, this will either succeed (200)
 * or return 403 to indicate that either the requested ID was not found or that
 * the ID is for a different user's session. The response will not indicate
 * which is the case.
 */
export const Logout = async (req, res, next) => {
	if(!req.user){
		return res.sendStatus(500)
	}

	let to_invalidate = []

	if(req.body.id == 'all'){
		if(req.body.invalidate_other_user){
			if(req.user.user.administrator){
				if(req.body.invalidate_other_user == 'all'){
					to_invalidate = await TokenBlacklistModel.find()
				}else{
					if(!mongodb.ObjectID.isValid(req.body.invalidate_other_user)){
						return res.status(400).json({
							reason: 'Malformed Object ID'
						})
					}
					to_invalidate = await TokenBlacklistModel.find({owning_user: req.body.invalidate_other_user})
				}
			}else{
				return res.status(403).json({
					reason: 'Not authorized to invalidate sessions for other users'
				})
			}
		}else{
			to_invalidate = await TokenBlacklistModel.find({owning_user: req.user.user._id})
		}
	}else{
		if(!mongodb.ObjectID.isValid(req.body.id)){
			return res.status(400).json({
				reason: 'Malformed Object ID'
			})
		}

		const single_to_invalidate = await TokenBlacklistModel.findById(req.body.id)
		to_invalidate = [single_to_invalidate]

		if(!single_to_invalidate){
			if(req.user.user.administrator){
				return res.status(404).json({
					reason: 'Session already expired or invalid'
				})
			}else{
				return res.status(403).json({
					reason: "Not authorized to invalidate this session"
				})
			}
		}

		if(
			single_to_invalidate.owning_user.toString() !== req.user.user._id.toString()
			&& !req.user.user.administrator
		){
			return res.status(403).json({
				reason: "Not authorized to invalidate this session"
			})
		}
	}

	if(to_invalidate){

		for(let i = 0; i < to_invalidate.length; i++){
			// have to await each blacklist, so we can't use vanilla forEach
			to_invalidate[i].blacklisted = true
			await to_invalidate[i].save()
		}

		return res.sendStatus(200)
	}else{
		console.error(`User requested to invalidate a token, but no token was found! This should not happen!`)
		return res.sendStatus(500)
	}
}