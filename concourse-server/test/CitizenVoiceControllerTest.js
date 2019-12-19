import mongoose from 'mongoose'

import request from 'supertest'
import {expect} from 'chai'
import app from '../app.js'

var voice_table_exists = false

before(function(done){
	const voices = mongoose.model('CitizenVoice')
	voices.countDocuments({})
		.then(function(count){
			if(count === 0){
				voice_table_exists = false
			}else{
				voice_table_exists = true
				console.warn('\n\n >>> WARNING! THE VOICES TABLE IS ALREADY POPULATED <<<\n\n    These tests should NOT be run against a production database.\n     To avoid tears, the database will NOT be automatically dropped at the end of the test suite.')
			}
		})
		.then(done)
})

after(function(done){
	const voices = mongoose.model('CitizenVoice')
	if(voice_table_exists){
		console.warn('  >> Refusing to automatically drop table "voices" which already had data prior to the test suite.\n    Please erase the database manually\n    (or, if this is a production database, DO NOT run these tests against it)')
		done()
	}else{
		mongoose.connection.db.dropCollection("citizenvoices").then(() => done())
	}
})

describe('Voice', function(){
	describe('Create Method', function(){
		it('should fail and return the appropriate json on an empty request', function(){
			return request(app)
				.post('/api/v1/voices/create')
				.expect(400)
				.expect('Content-Type', /json/)
				.expect({
					reason: "Missing required fields"
				})
					  
		})

		it('should succeed (response code 200) for a properly-formatted request', function(){
			return request(app)
				.post('/api/v1/voices/create')
				.send({
					name: "Some Guy",
					occupation: "Tailor",
					quote: "It has a the good and"
				})
				.expect(200)
		})

		it('should return the correct object, including an id, for a properly-formatted request', function(){
			const sent_json = {
				name: "Garak",
				occupation: "Tailor",
				quote: "It has lots of lovely dark corners"
			}
			return request(app)
				.post('/api/v1/voices/create')
				.send(sent_json)
				.expect('Content-Type', /json/)
				.expect(function(response){
					expect(Object.keys(response.body)).to.contain('_id')
					expect(response.body.name).to.equal(sent_json.name)
					expect(response.body.occupation).to.equal(sent_json.occupation)
					expect(response.body.quote).to.equal(sent_json.quote)
				})
		})
	})

	describe('Retrieve-All Method', function(){
		it('should return data when values are present in the database', async function(){
			const to_insert = {
				name: "Odo",
				occupation: "Security",
				quote: "The surveillance infrastructure is very well put-together. I appreciate a good, comprehensive security system."
			}

			const insert_response = await request(app)
				.post('/api/v1/voices/create')
				.send(to_insert)
				.expect(200)

			return request(app)
				.get('/api/v1/voices')
				.expect(200)
				.expect(function(res){
					expect(res.body.length).to.be.greaterThan(0)
				})
		})
	})

	describe('Retrieve-One Method', function(){
		it('should return the appropriate object when said object is present', async function(){
			const to_insert = {
				name: "Nerys",
				occupation: "Ambassador",
				quote: "The landscape is idyllic, and there are plenty of places for members of an underground resistance cell to hide."
			}

			const insert_response = await request(app)
				.post('/api/v1/voices/create')
				.send(to_insert)
				.expect(200)
			
			return request(app)
				.get(`/api/v1/voices/${insert_response.body._id}`)
				.expect(200)
				.expect(insert_response.body)
		})

		it('should return 404 when no object is present', function(){
			return request(app)
				.get('/api/v1/voices/000000000000000000000000')
				.expect(404)
		})

		it('should return 400 with the appropriate error string when invalid data is passed', function(){
			return request(app)
				.get('/api/v1/voices/invalid')
				.expect(400)
				.expect({
					reason: "Malformed Object ID"
				})
		})
	})

	describe('Edit function', function(){
		it('should return 404 when no object is present', function(){
			return request(app)
				.post('/api/v1/voices/000000000000000000000000')
				.send({name: "aaaaa"})
				.expect(404)
		})

		it('should return 400 with the appropriate error string when an invalid URL is accessed', function(){
			return request(app)
				.post('/api/v1/voices/invalid')
				.send({
					name: "bad",
					occupation: "no",
					quote: "stop"
				})
				.expect(400)
				.expect({
					reason: "Malformed Object ID"
				})
		})

		it('should return 400 with the appropriate error string (and not modify the original entry) when invalid data is passed to a valid URL', async function(){
			const original = await request(app)
			.post('/api/v1/voices/create')
			.send({
				name: "Dax",
				occupation: "Science",
				quote: "I've seen better party scenes, but I've also seen worse, so ehh."
			})
			.expect(200)
			
			const malformed = {
				quomt: "e",
				bad: "field"
			}

			await request(app)
				.post(`/api/v1/voices/${original.body._id}`)
				.send(malformed)
				.expect(400)
				.expect({
					reason: `Unknown input field(s) quomt,bad`
				})

			return request(app)
				.get(`/api/v1/voices/${original.body._id}`)
				.expect(function(res){
					expect(res.body.name).to.equal(original.body.name)
					expect(res.body.occupation).to.equal(original.body.occupation)
					expect(res.body.quote).to.equal(original.body.quote)
				})
		})

		it('should properly update all fields', async function(){
			const original = await request(app)
				.post('/api/v1/voices/create')
				.send({
					name: "Sysko",
					occupation: "Commander",
					quote: "Great scenery, nice people, a great baseball team - what's not to love..."
				})
				.expect(200)
			
			const modified = {
				name: "Sisko",
				occupation: "Captain",
				quote: "Great scenery, nice people, a great baseball team - what's not to love?"
			}

			await request(app)
				.post(`/api/v1/voices/${original.body._id}`)
				.send(modified)
				.expect(200)
				.expect(function(res){
					expect(res.body._id).to.equal(original.body._id)
					expect(res.body.name).to.equal(modified.name)
					expect(res.body.occupation).to.equal(modified.occupation)
					expect(res.body.quote).to.equal(modified.quote)
				})
			
			return request(app)
				.get(`/api/v1/voices/${original.body._id}`)
				.expect(200)
				.expect(function(res){
					expect(res.body._id).to.equal(original.body._id)
					expect(res.body.name).to.equal(modified.name)
					expect(res.body.occupation).to.equal(modified.occupation)
					expect(res.body.quote).to.equal(modified.quote)
				})
		})

		it('should not modify fields which are not present in the edit request, or which are empty', async function(){
			const original = await request(app)
				.post('/api/v1/voices/create')
				.send({
					name: "Wofr",
					occupation: "Security",
					quote: "The people here do not have very much fun. This puts them in a better position to defend against an attack."
				})
				.expect(200)
			
			const modified = {
				name: "Worf",
				occupation: ""
			}

			await request(app)
				.post(`/api/v1/voices/${original.body._id}`)
				.send(modified)
				.expect(200)
				.expect(function(res){
					expect(res.body._id).to.equal(original.body._id)
					expect(res.body.name).to.equal(modified.name)
					expect(res.body.occupation).to.equal(original.body.occupation)
					expect(res.body.quote).to.equal(original.body.quote)
				})

			return request(app)
				.get(`/api/v1/voices/${original.body._id}`)
				.expect(200)
				.expect(function(res){
					expect(res.body._id).to.equal(original.body._id)
					expect(res.body.name).to.equal(modified.name)
					expect(res.body.occupation).to.equal(original.body.occupation)
					expect(res.body.quote).to.equal(original.body.quote)
				})
		})

		it('should not allow modification of the object ID', async function(){
			const original = await request(app)
				.post('/api/v1/voices/create')
				.send({
					name: "Quarmk",
					occupation: "Bartender",
					quote: "This place is always filled with people passing through - the profit potential is incredible!"
				})
			
			const modified = {
				_id: "5dfb07f9329a5c4b319c765f",
				name: "Quark"
			}

			await request(app)
				.post(`/api/v1/voices/${original.body._id}`)
				.send(modified)
				.expect(400)
				.expect({
					reason: "Object ID cannot be modified"
				})
			
			return request(app)
				.get(`/api/v1/voices/${original.body._id}`)
				.expect(200)
				.expect(function(res){
					expect(res.body._id).to.equal(original.body._id)
					expect(res.body.name).to.equal(original.body.name)
					expect(res.body.occupation).to.equal(original.body.occupation)
					expect(res.body.quote).to.equal(original.body.quote)
				})
		})
	})

	describe('Delete method', function(){
		it('should return 404 when no object is present', function(){
			return request(app)
				.delete('/api/v1/voices/000000000000000000000000')
				.expect(404)
		})

		it('should return 400 with the appropriate error string when an invalid URL is accessed', function(){
			return request(app)
				.delete('/api/v1/voices/invalid')
				.expect(400)
				.expect({
					reason: "Malformed Object ID"
				})
		})

		it('should delete and return the appropriate object', async function(){
			const to_delete = await request(app)
				.post('/api/v1/voices/create')
				.send({
					name: "Eddington",
					occupation: "Security",
					quote: "It reminds me of Canada..."
				})
				.expect(200)
			
			await request(app)
				.delete(`/api/v1/voices/${to_delete.body._id}`)
				.expect(200)
				.expect(function(res){
					expect(res.body.name).to.equal(to_delete.body.name)
					expect(res.body.occupation).to.equal(to_delete.body.occupation)
					expect(res.body.quote).to.equal(to_delete.body.quote)
				})

			return request(app)
				.get(`/api/v1/voices/${to_delete.body._id}`)
				.expect(404)
		})
	})
})