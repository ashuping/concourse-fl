/* City of Concourse Website - Passport authentication setup
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
import bcrypt from 'bcrypt'
import passport from 'passport'
import pl from 'passport-local'
import jwt from 'passport-jwt'

import { UserLoginModel } from './models/UserLoginSchema.js'
import { UserProfileModel } from './models/UserProfileSchema.js'
import { TokenBlacklistModel } from './models/TokenBlacklistSchema.js'

import config from './config/config.js'

function __promisified_bcrypt_compare(password, hash){
	return new Promise(function(resolve, reject){
		bcrypt.compare(password, hash, function(err, is_same){
			if(err){reject(err)}
			resolve(is_same)
		})
	})
}

passport.use(new pl.Strategy({
		usernameField: "username",
		passwordField: "password"
	}, async function(username, password, callback){
		const auth_fail_message = 'Authentication failure'

		const found_user = await UserLoginModel.findOne({username})
		if(!found_user){
			return callback(null, false, {message: auth_fail_message})
		}

		try{
			const password_good = await __promisified_bcrypt_compare(password, found_user.password)

			if(!password_good){
				return callback(null, false, auth_fail_message)
			}

			const user_profile = await UserProfileModel.findById(found_user.profile)
			return callback(null, user_profile, {message: 'Authentication success'})
		}catch(e){
			console.error(`Exception occured in password-hashing function: ${e}\n\n(username: ${username}, password ${password}, hash ${found_user.password})`)
		}

	}
))

passport.use(new jwt.Strategy({
		jwtFromRequest: jwt.ExtractJwt.fromExtractors([(req) => {
			if(req && req.cookies){
				return req.cookies.token
			}else{
				return null
			}
		}, jwt.ExtractJwt.fromAuthHeaderAsBearerToken()]),
		secretOrKey: process.env.AUTH_SECRET || config.auth.secret
	}, async function(payload, callback){

		const blacklist_entry = await TokenBlacklistModel.findById(payload.id)
		if(!blacklist_entry || blacklist_entry.blacklisted){
			
			return callback(null, null)
		}

		const current_user = await UserProfileModel.findById(payload.user._id)
		if(!current_user){
			// This could happen if the user was deleted before their token expired.
			return callback(null, null)
		}

		return callback(null, {tid: payload.id, user: current_user})
	}))