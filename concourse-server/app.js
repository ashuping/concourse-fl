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

import cookieParser from 'cookie-parser'
import cors from 'cors'
import createError from 'http-errors'
import crypto from 'crypto'
import express from 'express'
import logger from 'morgan'
import mongoose from 'mongoose'

import config from './config/config.js'
 
import citizen_voice_router from './routes/CitizenVoiceRoutes.js'
import authenticaion_router from './routes/AuthenticationRoutes.js'
import user_router from './routes/UserRoutes.js'
import campaign_router from './routes/CampaignRoutes.js'
import registration_key_router from './routes/RegistrationKeyRoutes.js'
import character_router from './routes/CharacterRoutes.js'
import session_router from './routes/SessionRoutes.js'

import { UserLoginModel } from './models/UserLoginSchema.js'
import { UserProfileModel } from './models/UserProfileSchema.js'
import { RegistrationKeyModel } from './models/RegistrationKeySchema.js'

import { send_mail, setup } from './controllers/MailController.js'

import './passport.js'
import { EmailModel } from './models/EmailSchema.js'
import { SessionModel } from './models/SessionSchema.js'

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

// [TEMP] - set up e-mail
setup(
	process.env.EMAIL_HOST || config.email.host,
	process.env.EMAIL_PORT || config.email.port,
	process.env.EMAIL_SECURE || config.email.secure,
	process.env.EMAIL_USERNAME || config.email.username,
	process.env.password || config.email.password
).then(() => {
	// send_mail({
	// 	from: '"Concourse" <no-reply@concourse.city>',
	// 	to: '"Core Logging Node" <logging@concourse.city>',
	// 	subject: 'Server started',
	// 	text: 'server started',
	// 	html: '<blink><marquee><h1>server started</h1></marquee></blink>'
	// })
})

// Add initial login token if no users are present on startup
async function initial_run_check(){

	const found_users = await UserLoginModel.countDocuments()

	if(!found_users){
		const root_user_password = (await __promisified_crypto_random_bytes(256)).toString('hex')
		const root_user_profile = new UserProfileModel({
			username: "root",
			iex: "Great Regal Adorable CloudDragon",
			display_name: "System",
			pronouns: {
				subject: "it",
				object: "it",
				dependent_possessive: "its",
				independent_possessive: "its",
				reflexive: "itself"
			},
			emails: [],
			administrator: true,
			can_create_campaigns: true,
			can_create_registration_keys: true,
			campaigns: []
		})

		const root_user_email = new EmailModel({
			address: "root@concourse.city",
			verified: true,
			primary: true,
			user: root_user_profile._id
		})

		root_user_profile.emails = [root_user_email._id]

		await root_user_profile.save()
		await root_user_email.save()

		const root_user_login = new UserLoginModel({
			email: root_user_email._id,
			password: root_user_password,
			profile: root_user_profile._id
		})

		await root_user_login.save()

		const found_initial_key = await RegistrationKeyModel.findOne({text: process.env.REGISTRATION_INITIAL_KEY || config.registration.initial_key})

		if(found_initial_key){
			found_initial_key.creator = root_user_profile.id,
			found_initial_key.text = process.env.REGISTRATION_INITIAL_KEY || config.registration.initial_key,
			found_initial_key.uses_total = 1
			found_initial_key.uses_remaining = 1
			found_initial_key.grants_administrator = true
			found_initial_key.grants_create_campaigns = true
			found_initial_key.grants_create_registration_keys = true

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

async function clean_up_orphan_sessions(){
	const orphanSessions = await SessionModel.find({
		active: true,
		active_node_id: (process.env.NODE_ID || config.node_id)
	})

	if(orphanSessions){
		console.log(`Found orphaned sessions! Did the server shut down unexpectedly? Cleaning up...`)
	}

	for(const session of orphanSessions){
		session.active = false
		session.url = null
		session.active_node_id = null

		await session.save()
	}
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

clean_up_orphan_sessions()

app.use(logger('dev'));
app.use(cors({credentials: true, origin: 'http://localhost:3000'}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api/v1/voices', citizen_voice_router)
app.use('/api/v1/login', authenticaion_router)
app.use('/api/v1/users', user_router)
app.use('/api/v1/campaigns', campaign_router)
app.use('/api/v1/invites', registration_key_router)
app.use('/api/v1/characters', character_router)
app.use('/api/v1/sessions', session_router)
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
