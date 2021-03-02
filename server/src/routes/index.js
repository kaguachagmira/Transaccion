const {Router} = require('express');
const router =  Router();

rutas = require('../controllers/controllers')

router.post('/transferenciaNormal', rutas.realizarTransferenciaNormal)
router.post('/transferenciaCommit', rutas.realizarTransferenciaCommit)
router.post('/transferenciaRollBack', rutas.realizarTransferenciaRollBack)
router.get('/transferencia',rutas.getLastTransferencia)
router.get('/cuenta/:numero_cuenta',rutas.getCuentaSaldo)

module.exports = router;