/* City of Concourse Website - Authentication Controller Tests
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
import chai from 'chai'
import chai_as_promised from 'chai-as-promised'
import crypto from 'crypto'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import app from '../app.js'
import { UserLoginModel } from '../models/UserLoginSchema.js'
import { UserProfileModel } from '../models/UserProfileSchema.js'
import request from 'supertest'
import { fail } from 'assert'

import config from '../config/config.js'

chai.use(chai_as_promised)

const expect = chai.expect

var tables_exist = false

// Helper function to perform crypto.randomBytes as a promise
function __promisified_crypto_random_bytes(count){
	return new Promise(function(resolve, reject){
		crypto.randomBytes(count, (err, buf) => {
			if(err){reject(err)}
			resolve(buf)
		})
	})
}

before(async function(){
	const user_logins = mongoose.model('UserLogin')
	const user_profiles = mongoose.model('UserProfile')
	const token_blacklists = mongoose.model('TokenBlacklist')
	const count = await user_logins.countDocuments({}) + await user_profiles.countDocuments({}) + await token_blacklists.countDocuments({})

	if(count === 0){
		tables_exist = false
	}else{
		tables_exist = true
		console.warn('\n\n >>> WARNING! THE userlogins TABLE IS ALREADY POPULATED <<<\n\n     These tests should NOT be run against a production database.\n     To avoid tears, the database will NOT be automatically dropped at the end of the test suite.')
	}

	const existing_user = await UserProfileModel.findOne({username: 'lyra'})
	if(existing_user){
		console.error('\n\n >>> ERROR! THE USER "lyra", USED FOR TESTING, HAS ALREADY BEEN DEFINED <<< \n\n     To protect against accidental use in a production database, the tests will not modify existing data.\n     Tests will likely fail due to authentication issues - clear the database and try again.')
		return
	}

	const new_user_profile = new UserProfileModel({
		username: "lyra",
		display_name: "Lyra [TESTING USER - DELETE IF IN PRODUCTION]",
		pronouns: "000000000000000000000000",
		emails: [{
			address: "lyra@coolbooks.biz",
			verified: true,
			primary: true
		}],
		administrator: true,
		can_create: true,
		campaigns: []
	})

	await new_user_profile.save()

	// Probably overkill - the testing user should never show up in prod, and
	// it should get deleted at the end of the tests anyway, but just in case,
	// it's best not to have an admin account with a well-known password lying
	// around.
	const random_password = (await __promisified_crypto_random_bytes(64)).toString('hex')

	process.env.TESTING_USER_PASSWORD = random_password

	const new_user_login = new UserLoginModel({
		username: "lyra",
		password: random_password,
		profile: new_user_profile._id
	})

	await new_user_login.save()

	// Add second user
	const existing_user_2 = await UserProfileModel.findOne({username: 'lyra-2'})
	if(existing_user_2){
		console.error('\n\n >>> ERROR! THE USER "lyra-2", USED FOR TESTING, HAS ALREADY BEEN DEFINED <<< \n\n     To protect against accidental use in a production database, the tests will not modify existing data.\n     Tests will likely fail due to authentication issues - clear the database and try again.')
		return
	}

	const new_user_profile_2 = new UserProfileModel({
		username: "lyra-2",
		display_name: "Lyra-2 [TESTING USER - DELETE IF IN PRODUCTION]",
		pronouns: "000000000000000000000000",
		emails: [{
			address: "lyra2@coolbooks.biz",
			verified: true,
			primary: true
		}],
		administrator: false,
		can_create: true,
		campaigns: []
	})

	await new_user_profile_2.save()

	const random_password_2 = (await __promisified_crypto_random_bytes(64)).toString('hex')

	process.env.TESTING_USER_2_PASSWORD = random_password_2

	const new_user_login_2 = new UserLoginModel({
		username: "lyra-2",
		password: random_password_2,
		profile: new_user_profile_2._id
	})

	await new_user_login_2.save()
})

after(async function(){
	if(tables_exist){
		console.warn('  >> Refusing to automatically drop tables which already had data prior to the test suite.\n    Please erase the database manually\n    (or, if this is a production database, DO NOT run these tests against it)')
		console.warn(`  >> The test user (username: "lyra", password: "${process.env.TESTING_USER_PASSWORD}") may still be present in the database.\n    This user has administrator privileges, so you should make sure to delete it if this is a production database.`)
	}else{
		await mongoose.connection.db.dropCollection("userlogins")
		await mongoose.connection.db.dropCollection("userprofiles")
		await mongoose.connection.db.dropCollection("tokenblacklists")
	}
})

function validate_user_object(user, alternate){
	if(alternate){
		expect(user).to.exist
		expect(user._id).to.exist
		expect(user.username).to.equal('lyra-2')
		expect(user.display_name).to.equal('Lyra-2 [TESTING USER - DELETE IF IN PRODUCTION]')
		expect(user.pronouns).to.equal('000000000000000000000000')
		expect(user.emails).to.exist
		expect(user.emails).to.have.length(1)
		expect(user.emails[0]).to.exist
		expect(user.emails[0].address).to.equal('lyra2@coolbooks.biz')
		expect(user.emails[0].verified).to.be.true
		expect(user.emails[0].primary).to.be.true
		expect(user.administrator).to.be.false
		expect(user.can_create).to.be.true
		expect(user.campaigns).to.exist
		expect(user.campaigns).to.be.empty
	}else{
		expect(user).to.exist
		expect(user._id).to.exist
		expect(user.username).to.equal('lyra')
		expect(user.display_name).to.equal('Lyra [TESTING USER - DELETE IF IN PRODUCTION]')
		expect(user.pronouns).to.equal('000000000000000000000000')
		expect(user.emails).to.exist
		expect(user.emails).to.have.length(1)
		expect(user.emails[0]).to.exist
		expect(user.emails[0].address).to.equal('lyra@coolbooks.biz')
		expect(user.emails[0].verified).to.be.true
		expect(user.emails[0].primary).to.be.true
		expect(user.administrator).to.be.true
		expect(user.can_create).to.be.true
		expect(user.campaigns).to.exist
		expect(user.campaigns).to.be.empty
	}
}

function validate_token_from_setcookie(res, alternate_user){
	const setcookie = res.headers['set-cookie']
	expect(setcookie).to.exist
	const tkn_match = setcookie[0].toString().match(new RegExp(`^token=(.*); Max-Age=${(process.env.AUTH_TKN_LIFETIME || config.auth.token_lifetime) / 1000}; Path=\/api\/v1; Expires=Invalid Date; HttpOnly(?:; Secure)?; SameSite=Strict$`))
	expect(tkn_match).to.exist.and.have.length(2)
	const token = tkn_match[1]
	expect(token).to.exist


	try{
		const decoded_payload = jwt.verify(token, process.env.AUTH_SECRET || config.auth.secret)
		expect(decoded_payload.id).to.exist
		expect(decoded_payload.user).to.exist
		validate_user_object(decoded_payload.user, alternate_user)
		return {cookie: setcookie, token: token, payload: decoded_payload}
	}catch(e){
		fail(e)
	}
}

async function do_login(alternate_user, agent){
	if(!agent){
		agent = request.agent(app)
	}

	let agent_cookie = null
	let agent_tkn_payload = null

	if(alternate_user){
		await agent
			.post('/api/v1/login')
			.send({
				method: 'local',
				username: 'lyra-2',
				password: process.env.TESTING_USER_2_PASSWORD
			})
			.expect(200)
			.expect((res) => validate_user_object(res.body.user, true))
			.expect((res) => {
				const cookie_info = validate_token_from_setcookie(res, true)
				agent_cookie = cookie_info.cookie[0]
				agent_tkn_payload = cookie_info.payload
				return true
			})
	}else{
		await agent
			.post('/api/v1/login')
			.send({
				method: 'local',
				username: 'lyra',
				password: process.env.TESTING_USER_PASSWORD
			})
			.expect(200)
			.expect((res) => validate_user_object(res.body.user))
			.expect((res) => {
				const cookie_info = validate_token_from_setcookie(res)
				agent_cookie = cookie_info.cookie[0]
				agent_tkn_payload = cookie_info.payload
				return true
			})
	}

	// superagent, in its infinite wisdom, will not send a 'Secure' cookie over
	// a direct connection to the app. Thus, we kludge it.
	// 
	// Make sure to manually inject this cookie into any authenticated
	// requests! Otherwise, the request will throw a 401, because computers are
	// an exercise in suffering.
	return [agent_cookie, agent_tkn_payload, agent]
}

describe('Authentication Controller', function(){
	describe('Login method', function(){
		describe('General', function(){
			it('should fail when no method is given', function(){
				return request(app)
					.post(`/api/v1/login`)
					.send({})
					.expect(400)
					.expect({
						reason: `Malformed request: 'method' is required`
					})
			})

			it('should fail when an invalid method is given', function(){
				return request(app)
					.post(`/api/v1/login`)
					.send({
						method: "potato"
					})
					.expect(400)
					.expect({
						reason: `Unknown authentication method "potato"`
					})
			})
		})

		describe('Local Authentication', function(){
			it('should fail when required information is missing', async function(){
				await request(app)
					.post('/api/v1/login')
					.send({
						method: 'local'
					})
					.expect(400)
					.expect({
						reason: "Malformed request: 'username' and 'password' are required"
					})
				
				await request(app)
					.post('/api/v1/login')
					.send({
						method: 'local',
						username: 'lyra'
					})
					.expect(400)
					.expect({
						reason: "Malformed request: 'username' and 'password' are required"
					})
				
				return request(app)
					.post('/api/v1/login')
					.send({
						method: 'local',
						password: process.env.TESTING_USER_PASSWORD
					})
					.expect(400)
					.expect({
						reason: "Malformed request: 'username' and 'password' are required"
					})
			})

			it('should fail when a nonexistent user is provided', function(){
				return request(app)
					.post('/api/v1/login')
					.send({
						method: 'local',
						username: 'jf2pq98jf$EFAW#24fw34fgw45gwert',
						password: process.env.TESTING_USER_PASSWORD
					})
					.expect(401)
					.expect({
						reason: 'Authentication failure'
					})
			})

			it('should fail when an incorrect password is provided', function(){
				return request(app)
					.post('/api/v1/login')
					.send({
						method: 'local',
						username: 'lyra',
						password: 'this is not the correct password'
					})
					.expect(401)
					.expect({
						reason: 'Authentication failure'
					})
			})

			it('should succeed when the correct username and password are provided', function(){
				return do_login()
			})

			it('should return the same message for an authentication failure, regardless of whether the username or the password is incorrect', async function(){
				const res_bad_username = await request(app)
					.post('/api/v1/login')
					.send({
						method: 'local',
						username: 'pjkv0da9fjgw954%G@$GwergsdGq34',
						password: process.env.TESTING_USER_PASSWORD
					})
				
				return request(app)
					.post('/api/v1/login')
					.send({
						method: 'local',
						username: 'lyra',
						password: 'this is not the correct password'
					})
					.expect(res_bad_username.status)
					.expect(res_bad_username.body)
			})
		})

		describe('Token Renewal', function(){
			it('should not allow persistent session keys to be retrieved', async function(){
				const [cookie, payload, agent] = await do_login()

				return agent
					.post('/api/v1/login')
					.send({
						method: 'token',
						persistent: true
					})
					.expect(400)
					.expect({
						reason: 'Persistent session keys cannot be retrieved with this authentication method.'
					})
			})

			it('should fail when no token is present', async function(){
				return request(app)
					.post('/api/v1/login')
					.send({
						method: 'token'
					})
					.expect(401)
					.expect({
						reason: 'Authentication failure'
					})
			})

			it('should succeed when a valid, non-blacklisted token is used', async function(){
				const [cookie, payload, agent] = await do_login()

				return agent
					.post('/api/v1/login')
					.set('Cookie', cookie)
					.send({
						method: 'token'
					})
					.expect(200)
					.expect((res) => validate_user_object(res.body.user))
					.expect(validate_token_from_setcookie)
			})

			it('should fail when a blacklisted token is used', async function(){
				const [cookie, payload, agent] = await do_login()

				await agent
					.delete('/api/v1/login')
					.set('Cookie', cookie)
					.send({
						id: payload.id
					})
					.expect(200)
				
				return agent
					.post('/api/v1/login')
					.set('Cookie', cookie)
					.send({
						method: 'token'
					})
					.expect(401)
					.expect({
						reason: 'Authentication failure'
					})
			})
		})

		describe('Persistent Session Keys', function(){
			it('should respond properly to non-implemented functionality', async function(){
				await request(app)
					.post('/api/v1/login')
					.send({
						method: 'local',
						username: 'lyra',
						password: process.env.TESTING_USER_PASSWORD,
						persistent: true
					})
					.expect(501)
					.expect({
						reason: "Persistent session keys not yet implemented"
					})

				return request(app)
					.post(`/api/v1/login`)
					.send({
						method: "session"
					})
					.expect(501)
					.expect({
						reason: "Persistent session keys not yet implemented"
					})
			})
		})

	})

	describe('Logout method', function(){
		it('should fail if no user is logged in', function(){
			return request(app)
				.delete(`/api/v1/login`)
				.send({
					id: 'all'
				})
				.expect(401)
		})

		it('should fail with 400 if the session ID is malformed', async function(){
			const [cookie, payload, agent] = await do_login()

			return request(app)
				.delete('/api/v1/login')
				.set('Cookie', cookie)
				.send({
					id: 'invalid'
				})
				.expect(400)
				.expect({
					reason: 'Malformed Object ID'
				})
		})

		it('should fail with 400 if an administrator requests to delete all tokens for an invalid user', async function(){
			const [cookie, payload, agent] = await do_login()

			return request(app)
				.delete('/api/v1/login')
				.set('Cookie', cookie)
				.send({
					id: 'all',
					invalidate_other_user: 'invalid user id'
				})
				.expect(400)
				.expect({
					reason: 'Malformed Object ID'
				})
		})

		it('should fail with 404 if an administrator requests an invalid session ID', async function(){
			const [cookie, payload, agent] = await do_login()

			return request(app)
				.delete(`/api/v1/login`)
				.set('Cookie', cookie)
				.send({
					id: '000000000000000000000000'
				})
				.expect(404)
				.expect({
					reason: 'Session already expired or invalid'
				})
		})

		it('should fail with 403 if a non-administrator requests an invalid session ID', async function(){
			const [cookie, payload, agent] = await do_login(true)

			return request(app)
				.delete('/api/v1/login')
				.set('Cookie', cookie)
				.send({
					id: '000000000000000000000000'
				})
				.expect(403)
				.expect({
					reason: 'Not authorized to invalidate this session'
				})
		})

		it('should fail with 403 if a non-administrator requests to invalidate all sessions for another user', async function(){
			const [cookie, payload, agent] = await do_login(true)

			return request(app)
				.delete('/api/v1/login')
				.set('Cookie', cookie)
				.send({
					id: 'all',
					invalidate_other_user: '000000000000000000000000'
				})
				.expect(403)
				.expect({
					reason: 'Not authorized to invalidate sessions for other users'
				})
		})

		it('should fail with a 403 if a non-administrator requests to invalidate another user\'s session', async function(){
			const [ocookie, opayload, oagent] = await do_login()
			const [cookie, payload, agent] = await do_login(true)

			return request(app)
				.delete('/api/v1/login')
				.set('Cookie', cookie)
				.send({
					id: opayload.id
				})
				.expect(403)
				.expect({
					reason: 'Not authorized to invalidate this session'
				})
		})

		it('should fail in the exact same way if a non-administrator requests to invalidate another user\'s session, or a session which does not exist', async function(){
			const [ocookie, opayload, oagent] = await do_login()
			const [cookie, payload, agent] = await do_login(true)

			const res_nonexistent = await request(app)
				.delete('/api/v1/login')
				.set('Cookie', cookie)
				.send({
					id: '000000000000000000000000'
				})

			return request(app)
				.delete('/api/v1/login')
				.set('Cookie', cookie)
				.send({
					id: opayload.id
				})
				.expect(res_nonexistent.status)
				.expect(res_nonexistent.body)
		})

		it('should allow a user to invalidate their own token', async function(){
			const [cookie, payload, agent] = await do_login(true)

			return request(app)
				.delete('/api/v1/login')
				.set('Cookie', cookie)
				.send({
					id: payload.id
				})
				.expect(200)
		})

		it('should allow an administrator to invalidate another user\'s token', async function(){
			const [acookie, apayload, aagent] = await do_login()
			const [ncookie, npayload, nagent] = await do_login(true)

			return request(app)
				.delete('/api/v1/login')
				.set('Cookie', acookie)
				.send({
					id: npayload.id
				})
				.expect(200)
		})

		it('should allow a user to invalidate all of their own tokens', async function(){
			const [cookie1, payload1, agent1] = await do_login(true)
			const [cookie2, payload2, agent2] = await do_login(true)

			await request(app)
				.delete('/api/v1/login')
				.set('Cookie', cookie1)
				.send({
					id: 'all'
				})
				.expect(200)

			await request(app)
				.post('/api/v1/login')
				.set('Cookie', cookie1)
				.send({
					method: 'token'
				})
				.expect(401)
				.expect({
					reason: 'Authentication failure'
				})

			return request(app)
				.post('/api/v1/login')
				.set('Cookie', cookie2)
				.send({
					method: 'token'
				})
				.expect(401)
				.expect({
					reason: 'Authentication failure'
				})
		})

		it('should allow an administrator to invalidate all of another user\'s tokens', async function(){
			const [cookie1, payload1, agent1] = await do_login(true)
			const [cookie2, payload2, agent2] = await do_login(true)
			const [acookie, apayload, aagent] = await do_login()

			await request(app)
				.delete('/api/v1/login')
				.timeout(20000) // There could be quite a few tokens in the database at this point, so this may take a little while.
				.set('Cookie', acookie)
				.send({
					id: 'all',
					invalidate_other_user: payload1.user._id
				})
				.expect(200)

			await request(app)
				.post('/api/v1/login')
				.set('Cookie', cookie1)
				.send({
					method: 'token'
				})
				.expect(401)
				.expect({
					reason: 'Authentication failure'
				})

			await request(app)
				.post('/api/v1/login')
				.set('Cookie', cookie2)
				.send({
					method: 'token'
				})
				.expect(401)
				.expect({
					reason: 'Authentication failure'
				})

			return request(app)
				.post('/api/v1/login')
				.set('Cookie', acookie)
				.send({
					method: 'token'
				})
				.expect(200)
				.expect((res) => validate_user_object(res.body.user))
				.expect(validate_token_from_setcookie)
		})

		it('should allow an administrator to invalidate ALL tokens', async function(){
			const [cookie1, payload1, agent1] = await do_login(true)
			const [cookie2, payload2, agent2] = await do_login(true)
			const [acookie, apayload, aagent] = await do_login()

			await request(app)
				.delete('/api/v1/login')
				.set('Cookie', acookie)
				.send({
					id: 'all',
					invalidate_other_user: 'all'
				})
				.expect(200)

			await request(app)
				.post('/api/v1/login')
				.set('Cookie', cookie1)
				.send({
					method: 'token'
				})
				.expect(401)
				.expect({
					reason: 'Authentication failure'
				})

			await request(app)
				.post('/api/v1/login')
				.set('Cookie', cookie2)
				.send({
					method: 'token'
				})
				.expect(401)
				.expect({
					reason: 'Authentication failure'
				})

			return request(app)
				.post('/api/v1/login')
				.set('Cookie', acookie)
				.send({
					method: 'token'
				})
				.expect(401)
				.expect({
					reason: 'Authentication failure'
				})
		})
	})
})