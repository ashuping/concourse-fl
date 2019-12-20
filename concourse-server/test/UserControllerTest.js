/* City of Concourse Website - User Controller Tests
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
import assert from 'assert'
import chai from 'chai'
import chai_as_promised from 'chai-as-promised'

chai.use(chai_as_promised)

const expect = chai.expect

import { has_been_pwned, validate_campaigns } from '../controllers/UserController.js'

describe('User', function() {
    describe('Password Check Function', function(){
        it('should disallow passwords on a known breach list', async function(){
			return expect(has_been_pwned('password')).to.eventually.be.greaterThan(0)
        })

        it('should allow passwords not on a known breach list', async function(){
			const password_to_test = 'fpoi2j3098fj2098uh098weay098sdfaFERG#42$%'
			return expect(
				has_been_pwned(password_to_test),
				`[NOTE: This test assumes that the SHA-1 hash of "${password_to_test}" is not part of any breach. If it starts failing out-of-the-blue, first check to make sure that this is actually still the case. If not, replace the password string in this test with a new random string and try again.]`
			).to.eventually.equal(0)
        })
	})
	
	describe('Campaign Validator Function', function(){
		it('should allow an empty campaign list', async function(){
			return expect(validate_campaigns([])).to.eventually.deep.equal([])
		})

		it('should allow a list containing a single valid campaign', async function(){
			await expect(
				validate_campaigns([{id: "000000000000000000000000", admin: false}])
			).to.eventually.deep.equal([{id: "000000000000000000000000", admin: false}])

			await expect(
				validate_campaigns([{id: "000000000000000000000000"}])
			).to.eventually.deep.equal([{id: "000000000000000000000000", admin: false}])

			return expect(
				validate_campaigns([{id: "000000000000000000000000", admin: true}])
			).to.eventually.deep.equal([{id: "000000000000000000000000", admin: true}])
		})

		it('should allow a list containing multiple valid campaigns', async function(){
			await expect(
				validate_campaigns([
					{id: "000000000000000000000000", admin: false},
					{id: "000000000000000000000001", admin: false}
				])
			).to.eventually.deep.equal([
				{id: "000000000000000000000000", admin: false},
				{id: "000000000000000000000001", admin: false}
			])

			await expect(
				validate_campaigns([
					{id: "000000000000000000000000"},
					{id: "000000000000000000000001"}
				])
			).to.eventually.deep.equal([
				{id: "000000000000000000000000", admin: false},
				{id: "000000000000000000000001", admin: false}
			])

			await expect(
				validate_campaigns([
					{id: "000000000000000000000000", admin: true},
					{id: "000000000000000000000001", admin: true}
				])
			).to.eventually.deep.equal([
				{id: "000000000000000000000000", admin: true},
				{id: "000000000000000000000001", admin: true}
			])

			return expect(
				validate_campaigns([
					{id: "000000000000000000000000", admin: false},
					{id: "000000000000000000000001", admin: true},
					{id: "000000000000000000000002"},
					{id: "000000000000000000000003", admin: true},
					{id: "000000000000000000000004", admin: true}
				])
			).to.eventually.deep.equal([
				{id: "000000000000000000000000", admin: false},
				{id: "000000000000000000000001", admin: true},
				{id: "000000000000000000000002", admin: false},
				{id: "000000000000000000000003", admin: true},
				{id: "000000000000000000000004", admin: true}
			])
		})

		it('should disallow an object which is not an array', async function(){
			return expect(
				validate_campaigns(37)
			).to.be.rejectedWith(`"campaigns" field is present but is not an array`)
		})

		it('should disallow an array containing malformed entries', async function(){
			await expect(
				validate_campaigns([{}])
			).to.eventually.be.rejectedWith("Campaign object missing required field id")

			await expect(
				(validate_campaigns([{aaaaa: "aaaaaa", id: "000000000000000000000000"}]))
			).to.eventually.be.rejectedWith("Campaign object contains unknown field aaaaa")

			await expect(
				validate_campaigns([
					{id: "000000000000000000000000"},
					{aaaaa: "aaaaa", id: "000000000000000000000001"}
				])
			).to.eventually.be.rejectedWith("Campaign object contains unknown field aaaaa")

			return expect(
				validate_campaigns([{aaaaa: "aaaaa"}])
			).to.eventually.be.rejected
		})

		it('should disallow an array containing an entry with a malformed id field', async function(){
			return expect(
				validate_campaigns([{id: "invalid"}])
			).to.eventually.be.rejectedWith('Campaign id field "invalid" is malformed.')
		})
	})
})