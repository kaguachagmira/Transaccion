const {Pool}  = require ('pg');

const config ={
    user: 'postgres',
    host: 'localhost',
    password: '12345678',
    database: 'Sistema_Bancario',
    port: "5432"
}
const pool = new Pool(config)  

const realizarTransferenciaNormal = async (req,res)=>{

    var current = new Date();
    try{
        const cuenta_fuente = req.body.cuenta_fuente;
        const cuenta_destino =  req.body.cuenta_destino;
        const monto =  req.body.monto;

        let resp1 = await  pool.query(`INSERT INTO "Movimiento"."Transferencia"(
            id_sucursal, id_rol_banco_usuario, id_rol_banco_usuario_cajero, numero_cuenta, estado, 
            monto, fecha_transferencia, hora_transferencia, descripcion)
            VALUES (1, 3, 601, $1, 'true', $2, $3, $4, 'Debito') returning numero_comprobante;
            `,[cuenta_destino,monto,current, current.getHours()+':'+current.getMinutes()+':'+current.getSeconds()])

        await pool.query(`UPDATE "Movimiento"."Cuenta"
            SET  saldo=saldo + $1
            WHERE numero_cuenta= $2;`,[monto, cuenta_destino])
        
        await pool.query(`UPDATE "Movimiento"."Cuenta"
            SET  saldo=saldo - $1
            WHERE numero_cuenta = $2;`,[monto, cuenta_fuente])

        console.log(resp1.rows[0].numero_comprobante)
        res.json(resp1.rows[0].numero_comprobante); 
        }
    catch(e){
        console.log(e);
    }
}

const realizarTransferenciaCommit = async (req,res)=>{

    var current = new Date();
    try{
        console.log(req.body)
        const cuenta_fuente = req.body.cuenta_fuente;
        const cuenta_destino =  req.body.cuenta_destino;
        const monto =  req.body.monto;

        await pool.query(`begin`);
        await pool.query(`INSERT INTO "Movimiento"."Transferencia"(
            id_sucursal, id_rol_banco_usuario, id_rol_banco_usuario_cajero, numero_cuenta, estado, 
            monto, fecha_transferencia, hora_transferencia, descripcion)
            VALUES (1, 3, 601, $1, 'true', $2, $3, $4, 'Debito');
            `,[cuenta_destino,monto,current, current.getHours()+':'+current.getMinutes()+':'+current.getSeconds()])

       await pool.query(`UPDATE "Movimiento"."Cuenta"
            SET  saldo=saldo + $1
            WHERE numero_cuenta= $2;`,[monto, cuenta_destino])
            
        await pool.query(`UPDATE "Movimiento"."Cuenta"
            SET  saldo=saldo - $1
            WHERE numero_cuenta = $2;`,[monto, cuenta_fuente])

        await pool.query(`COMMIT`);

        res.send('Transferencia exitosa')
    }
    catch(e){
        await pool.query(`ROLLBACK`);
        console.log(e);
        res.send('Ha ocurrido algun error transferencia cancelada')
    }
}



const realizarTransferenciaRollBack = async (req,res)=>{

    var current = new Date();
    try{
        console.log(req.body)
        const cuenta_fuente = req.body.cuenta_fuente;
        const cuenta_destino =  req.body.cuenta_destino;
        const monto =  req.body.monto;

        await pool.query(`begin`);
        await  pool.query(`INSERT INTO "Movimiento"."Transferencia"(
            id_sucursal, id_rol_banco_usuario, id_rol_banco_usuario_cajero, numero_cuenta, estado, 
            monto, fecha_transferencia, hora_transferencia, descripcion)
            VALUES (1, 3, 601, $1, 'true', $2, $3, $4, 'Debito');
            `,[cuenta_destino,monto,current, current.getHours()+':'+current.getMinutes()+':'+current.getSeconds()])
    
        //CONSULTO PARA COMPROBAR LA INSERCIÓN DE LA TRANSFERENCIA PREVIO AL ERROR DE SINTAXIS POR TANTO AL ROLLBACK
        var consulta1 =  await pool.query(`SELECT *
        FROM "Movimiento"."Transferencia"
        offset ((select count(*) from "Movimiento"."Transferencia" )-1)`)
        await console.log("Esta es la consulta transferencia previo al rollback");
        await console.log(consulta1);


        await pool.query(`UPDATE "Movimiento"."Cuenta"
            SET  saldo=saldo + $1
            WHERE numero_cuenta= $2;`,[monto, cuenta_destino])

        //CONSULTO PARA COMPROBAR LA ACTULIZACIÓN DE LA CUENTA DESTINO PREVIO AL ERROR DE SINTAXIS POR TANTO AL ROLLBACK
        var consulta2 =  await pool.query(`SELECT numero_cuenta, saldo
        FROM "Movimiento"."Cuenta"
        where numero_cuenta = $1`,[cuenta_destino])
        await console.log("Esta es la consulta cuenta destino previo al rollback");
        await console.log(consulta2);

        
        
        // EL ERROR A PROPOSITO ES PONER SAT EN VEZ DE SET AL INTENTAR
        // ACTUALIZAR EL DESCUENTO DE DINERO EN LA CUENTA DE ORIGEN
        await pool.query(`UPDATE "Movimiento"."Cuenta"
            SAT  saldo=saldo - $1
            WHERE numero_cuenta = $2;`,[monto, cuenta_fuente])

        res.send('Todo bien')
    }
    catch(e){
        //COMO HUBO UN ERROR AL ACTUALIZAR LA CUENTA DE ORIGEN POR ERROR DE SYNTAXIS
        //ENTRA AL CATCH Y REALIZAR EL ROLLBACK
        await pool.query(`ROLLBACK`);
        console.log(e);
        res.send('Ha ocurrido algun error transferencia cancelada')
    }
}

const getLastTransferencia = async (req,res)=>{
    try{
        const resp = await  pool.query(`SELECT *
        FROM "Movimiento"."Transferencia"
        offset ((select count(*) from "Movimiento"."Transferencia" )-1)`)
        console.log(resp.rows);
        res.status(200).json(resp.rows); 
    }
    catch(e){
        console.log(e);
    }
}
const getCuentaSaldo = async (req,res)=>{
        try{
            let numero_cuenta = req.params.numero_cuenta
            const resp = await  pool.query(`SELECT *
            FROM "Movimiento"."Cuenta"
            where numero_cuenta = $1`,[numero_cuenta])
            console.log(resp);
            res.status(200).json(resp.rows); 
        }
        catch(e){
            console.log(e);
        }
}


module.exports = {
    realizarTransferenciaNormal,
    realizarTransferenciaCommit,
    realizarTransferenciaRollBack,
    getLastTransferencia,
    getCuentaSaldo
}
