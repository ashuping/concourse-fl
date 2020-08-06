/* City of Concourse Website - Template configuration file
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

/* To set up a development environment, copy this file from "config.example.js"
 * to "config.js" and change the below values as appropriate.
 * 
 * In production environments, all of these values can be specified as
 * environment variables instead - the names of the appropriate variables are
 * given as comments below. Environment variables take precedence over values
 * specified here.
 */
 
export default {
	// Port to run the server on
	port: 5000, // PORT

	client_files_path: 'concourse-client/build', // CLIENT_FILES_PATH

	registration: {
		// Set to true to require a key to be entered before a user can register
		keys_required: true, // REGISTRATION_KEYS_REQUIRED

		// A key for initial setup.
		// 
		// The first time the system is started, it will detect an empty user
		// database, and enable a one-time registration with the key below, so
		// that you can create an initial account for administration. Note that
		// this key is one-use only and grants administrator access. This key
		// is only used when there are no users in the database - it will be
		// enabled regardless of the `keys_required` setting above.
		initial_key: 'Go, Searise!' // REGISTRATION_INITIAL_KEY
	},

	ssl: {
		// Set to true to disable SSL.
		disabled: false, // SSL_DISABLED

		// Path to the SSL certificate to use for the server. 
		// 
		// See https://certbot.eff.org/ for instructions on how to get a free SSL
		// certificate from the Electronic Frontier Foundation's Let's Encrypt
		// project.
		cert: '', // SSL_CERT

		// Path to the private key for the above SSL certificate
		pkey: '' // SSL_PKEY
	},

	auth: {
		// Secret to use for authentication - it is VERY important that this
		// secret is changed to a long, random string.
		secret: 'embarrassing photo of spongebob at the christmas party', // AUTH_SECRET

		// Lifetime for standard JWTs - the frontend will automatically
		// renew tokens before their lifetime expires (as long as you make
		// sure to keep this value the same as the value configured in the
		// frontend). Logout actions and permission changes cannot be
		// guaranteed to propagate until all JWTs signed with the old data
		// have expired, so make sure to keep this value relatively short.
		// 
		// Also note that, if the user does not elect to use a persistent
		// session (not yet implemented as-of 2019-12-21) and their browser
		// loses connection (and is thus unable to make a renewal request)
		// before their token expires, they will have to log in again, so don't
		// make it TOO short.
		// 
		// Value must be in ms.
		token_lifetime: '300000' // AUTH_TKN_LIFETIME
	},
    db: {
		// Mongodb URI to connect to - see 
		// https://docs.mongodb.com/manual/reference/connection-string/
		// for more information. The options "useNewURLParser" and
		// "useUnifiedTopology" are automatically passed to the database
		// connection call, so they do not need to be added to the URI.
		uri: 'mongodb://user:password@example.biz:27017/database', // DB_URI

		// Database to connect to. This value is optional - if it is not
		// specified, it will default to the value specified in the connection
		// URI, above.
		db: 'database' // DB_DB
    }
}