import express from 'express'
const Router = express.Router()

import { CreateCitizenVoice, RetrieveCitizenVoice, RetrieveAllVoices, EditCitizenVoice, DeleteCitizenVoice } from '../controllers/CitizenVoiceController.js'

Router.get('/', RetrieveAllVoices)
Router.get('/:id', RetrieveCitizenVoice)
Router.post('/create', CreateCitizenVoice)
Router.post('/:id', EditCitizenVoice)
Router.delete('/:id', DeleteCitizenVoice)

export default Router