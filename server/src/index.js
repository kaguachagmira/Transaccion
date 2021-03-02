const express =  require('express');
const app  = express();
const bodyparser = require('body-parser');
const cors = require('cors');


//middlewars si mis rutas van usar datos que llegan del cliente
// primero debo poder interpretarlos uso el 
app.use(bodyparser.urlencoded({extended:true}));
app.use(bodyparser.json());
app.use(cors({origin:'http://localhost:4200', optionsSuccessStatus:200}));

//Rutas
app.use(require('./routes/index'));

app.listen(3000);

