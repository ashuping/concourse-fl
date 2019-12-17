import { CitizenVoiceModel } from '../models/CitizenVoiceSchema.js'

export const CreateCitizenVoice = (req, res, next) => {
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

export const RetrieveCitizenVoice = async (req, res, next) => {
    const got = await CitizenVoiceModel.findById(req.params.id)

    if(got){
        res.status(200).json(got)
    }else{
        res.status(404)
    }
}

export const RetrieveAllVoices = async (req, res, next) => {
    const got = await CitizenVoiceModel.find()

    if(got){
        res.status(200).json(got)
    }else{
        res.status(404)
    }
}

export const EditCitizenVoice = async (req, res, next) => {
    const to_edit = await CitizenVoiceModel.findById(req.params.id)

    if(!to_edit){
        return res.sendStatus(404)
    }

    if(req.body.name){
        to_edit.name = req.body.name
    }

    if(req.body.occupation){
        to_edit.occupation = req.body.occupation
    }

    if(req.body.quote){
        to_edit.quote = req.body.quote
    }

    to_edit.save((err) => {
        if(err){
            return next(err)
        }

        return res.status(200).json(to_edit)
    })
}

export const DeleteCitizenVoice = async (req, res, next) => {
    const deleted = await CitizenVoiceModel.findByIdAndDelete(req.params.id)

    if(deleted){
        res.status(200).json(deleted)
    }else{
        res.sendStatus(404)
    }
}