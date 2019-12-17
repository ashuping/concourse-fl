import express from 'express'
const Router = express.Router()

/* GET users listing. */
Router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

export default Router;
