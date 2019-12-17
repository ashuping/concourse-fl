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
    port: 5000, // PORT
    db: {
        uri: 'mongodb://user:password@example.biz/database' // DB_URI
    }
}