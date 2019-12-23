/* City of Concourse Website - Backend Main Application
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

import cors from 'cors'
import createError from 'http-errors'
import express from 'express'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import mongoose from 'mongoose'

import config from './config/config.js'
 
import citizen_voice_router from './routes/CitizenVoiceRoutes.js'
import authenticaion_router from './routes/AuthenticationRoutes.js'
import user_router from './routes/UserRoutes.js'

import './passport.js'

var app = express()

if(process.env.DB_DB || (config && config.db && config.db.db)){
	mongoose.connect(process.env.DB_URI || config.db.uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		dbName: process.env.DB_DB || config.db.db
	})
}else{
	mongoose.connect(process.env.DB_URI || config.db.uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
}

// view engine setup

app.use(logger('dev'));
app.use(cors({credentials: true, origin: ['http://localhost:3000', 'http://localhost:5000']}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api/v1/voices', citizen_voice_router)
app.use('/api/v1/login', authenticaion_router)
app.use('/api/v1/users', user_router)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.sendStatus(err.status || 500);
});

export default app;
