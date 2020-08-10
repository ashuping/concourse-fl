import crypto from 'crypto'
import nodemailer from 'nodemailer'

import { EmailVerifierModel } from '../models/EmailVerifierSchema.js'
import { EmailModel } from '../models/EmailSchema.js'

let transport = null

// Helper function to perform crypto.randomBytes as a promise
function __promisified_crypto_random_bytes(count){
	return new Promise(function(resolve, reject){
		crypto.randomBytes(count, (err, buf) => {
			if(err){reject(err)}
			resolve(buf)
		})
	})
}

export async function setup(host, port, secure, user, pass){
    transport = nodemailer.createTransport({
        host: host,
        port: port,
        secure: secure,
        auth: {
            user: user,
            pass: pass
        }
    })
}

export async function send_mail(info){
    return await transport.sendMail(info)
}

export async function gen_verifier(){
    return (await __promisified_crypto_random_bytes(64))
}

export async function send_verification_email(uid, user_email){
    const verifier = (await gen_verifier()).toString('hex')
    const verify_url = 'https://localhost:5000/api/v1/users/verify/' + verifier

    const verifier_object = new EmailVerifierModel({
        uid: uid,
        address: user_email,
        key: verifier
    })

    await verifier_object.save()

    await send_mail({
        from: '"Concourse" <no-reply@concourse.city>',
        to: user_email,
        subject: 'Verify your e-mail address!',
        text: 'Please use the following link to verify your email: ' + verify_url,
        html: '<blink><marquee><h1>Concourse</h1></marquee></blink><a href=' + verify_url + '>verify your email</a>'
    })

    return verifier
}

export async function check_verification_email(code){
    const verifier = await EmailVerifierModel.findOne({key: code})

    if(!verifier){
        console.log('Verifier not found')
        return null
    }

    // The same email could theoretically be registered twice, if the second
    // registration happened before the first was verified. Ensure that there
    // is not a duplicate email already verified in the system.
    const duplicate = await EmailModel.findOne({address: verifier.address, verified: true})
    if(duplicate){
        console.log('Found duplicate email')
        await verifier.deleteOne()
        return null
    }

    const to_return = {
        uid: verifier.uid,
        address: verifier.address
    }

    await verifier.deleteOne()

    return to_return
}
