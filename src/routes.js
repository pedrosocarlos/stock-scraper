const express = require('express');

const stockController = require('./controllers/stockController');

const routes = express.Router();

//cadastro de pesos
routes.get('/', stockController.index);
routes.post('/', stockController.create);
routes.delete('/:id', stockController.delete);
routes.delete('/', stockController.deleteAll);
routes.post('/order', stockController.orderResults);
routes.get('/order/:id', stockController.getResults);
routes.get('/order', stockController.getOrders);
routes.post('/search', stockController.selectName);

module.exports = routes;