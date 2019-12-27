/* City of Concourse Website - Backend Main Application
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

import cors from 'cors'
import createError from 'http-errors'
import crypto from 'crypto'
import express from 'express'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import mongoose from 'mongoose'

import config from './config/config.js'
 
import citizen_voice_router from './routes/CitizenVoiceRoutes.js'
import authenticaion_router from './routes/AuthenticationRoutes.js'
import user_router from './routes/UserRoutes.js'

import { UserLoginModel } from './models/UserLoginSchema.js'
import { UserProfileModel } from './models/UserProfileSchema.js'
import { RegistrationKeyModel } from './models/RegistrationKeySchema.js'

import './passport.js'

var app = express()

if(process.env.DB_DB || (config && config.db && config.db.db)){
	mongoose.connect(process.env.DB_URI || config.db.uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		dbName: process.env.DB_DB || config.db.db
	})
}else{
	mongoose.connect(process.env.DB_URI || config.db.uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
}

// Helper function to perform crypto.randomBytes as a promise
function __promisified_crypto_random_bytes(count){
	return new Promise(function(resolve, reject){
		crypto.randomBytes(count, (err, buf) => {
			if(err){reject(err)}
			resolve(buf)
		})
	})
}

// Add initial login token if no users are present on startup
async function initial_run_check(){

	const found_users = await UserLoginModel.countDocuments()

	if(!found_users){
		const root_user_password = (await __promisified_crypto_random_bytes(256)).toString('hex')
		const root_user_profile = new UserProfileModel({
			username: "root",
			display_name: "System",
			pronouns: "000000000000000000000000",
			emails: [{
				address: "root@example.com",
				verified: true,
				primary: true
			}],
			administrator: true,
			can_create_campaigns: true,
			can_create_registration_keys: true,
			campaigns: []
		})

		await root_user_profile.save()

		const root_user_login = new UserLoginModel({
			username: "root",
			password: root_user_password,
			profile: root_user_profile._id
		})

		await root_user_login.save()

		const found_initial_key = await RegistrationKeyModel.findOne({text: process.env.REGISTRATION_INITIAL_KEY || config.registration.initial_key})

		if(found_initial_key){
			found_initial_key = new RegistrationKeyModel({
				creator: root_user_profile._id,
				text: process.env.REGISTRATION_INITIAL_KEY || config.registration.initial_key,
				uses_total: 1,
				uses_remaining: 1,
				grants_administrator: true,
				grants_create_campaigns: true,
				grants_create_registration_keys: true
			})

			await found_initial_key.save()
			return true
		}else{
			const initial_key = new RegistrationKeyModel({
				creator: root_user_profile._id,
				text: process.env.REGISTRATION_INITIAL_KEY || config.registration.initial_key,
				uses_total: 1,
				uses_remaining: 1,
				grants_administrator: true,
				grants_create_campaigns: true,
				grants_create_registration_keys: true
			})
	
			await initial_key.save()
			return true
		}
	}

	return false
}

initial_run_check()
	.then((changed) => {
		if(changed){
			console.log(`Detected a new installation (no users currently present). A one-use administrator registration key, "${process.env.REGISTRATION_INITIAL_KEY || config.registration.initial_key}", has been created. Please register a new administrator account with this key.`)
		}
	})
	.catch((err) => {
		console.error(`Failed to perform the initial user check: ${err}`)
	})

app.use(logger('dev'));
app.use(cors({credentials: true, origin: 'http://localhost:3000'}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api/v1/voices', citizen_voice_router)
app.use('/api/v1/login', authenticaion_router)
app.use('/api/v1/users', user_router)
app.use(express.static(process.env.CLIENT_FILES_PATH || config.client_files_path))

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.sendStatus(err.status || 500);
});

export default app;
