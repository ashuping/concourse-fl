import mongoose from 'mongoose'
const Schema = mongoose.Schema

const citizenVoiceSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    occupation: {
        type: String,
        required: true
    },
    quote: {
        type: String,
        required: true
    }
})

export const CitizenVoiceModel = mongoose.model('CitizenVoice', citizenVoiceSchema)