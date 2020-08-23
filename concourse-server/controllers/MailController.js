import crypto from 'crypto'
import nodemailer from 'nodemailer'

import { EmailVerifierModel } from '../models/EmailVerifierSchema.js'
import { EmailModel } from '../models/EmailSchema.js'
import { UserProfileModel } from '../models/UserProfileSchema.js'
import { UserLoginModel } from '../models/UserLoginSchema.js'

import { safe_delete_user } from './UserController.js'

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

export async function safe_delete_email(email){
    await EmailModel.findByIdAndDelete(email._id)
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

/* Perform necessary cleanup after marking an e-mail as verified.
 * 
 * Note that the relevant email must be marked as verified BEFORE calling
 * this function.
 * 
 * This function will look for any unverified email addresses that conflict
 * with the just-registered address and delete them. Additionally, if an
 * account was registered with the deleted address as its primary address, then
 * that account will be deleted.
 */
export async function post_verify_cleanup(email){
    await EmailVerifierModel.deleteMany({
        address: email
    })

    const orphan_emails = await EmailModel.find({
        address: email,
        verified: false
    })

    for(const orphan of orphan_emails){
        if(orphan.primary){
            const profile = await UserProfileModel.findById(orphan.user)
            if(profile){
                await safe_delete_user(profile)
                // safe_delete_user already cleans up emails, so we don't want
                // to try to delete it separately.
            }else{
                await EmailModel.findByIdAndDelete(orphan._id)
            }
        }else{
            await EmailModel.findByIdAndDelete(orphan._id)
        }
    }
}
