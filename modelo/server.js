const express = require('express');
require('dotenv').config();
const { dbConnection } = require('../database/config')
const {validationResult, check} = require('express-validator');
const Alumno = require('./alumno');
const port = process.env.PORT;

class Server{
    constructor(){
        this.app = express();
        this.conectarDB();
        this.middlewares();
        this.rutas();
    }

    middlewares(){
        this.app.use(express.json());
        this.app.use(express.static('public'));
    }

    async conectarDB(){
        await dbConnection();
    }

    rutas(){

        this.app.get('/alumnos', async function(req,res){
            let alumnos = await Alumno.find();
            res.json(alumnos);
                
        })
        this.app.get('/alumno/:id',async function(req,res){
            const id = req.params.id;
            let alumno = await Alumno.findById(id);
            res.json(alumno);
        })
        this.app.post('/alumno',
        check('nombre', 'El nombre es obligatorio').not().isEmpty(),
        check('apellido', 'El apellido es obligatorio').not().isEmpty(),
         async function(req,res){
            
            const body = req.body;
            
            const errorVal = validationResult(req);

            if(!errorVal.isEmpty()){
                return res.status(400).json({"msg": errorVal.array()})
                //"msg":errorVal.array(); devuelve informacion de los errores
            }
            let alumno = new Alumno(body);
            alumno.save();
            res.json({
                insertado:true,
                alumno
            })
        });
        this.app.put('/alumno/:id',
        check('nombre', 'El nombre es obligatorio').not().isEmpty(),
        check('apellido', 'El apellido es obligatorio').not().isEmpty(), 
        async function(req,res){
            const body = req.body;
            const id = req.params.id;
            await Alumno.findByIdAndUpdate(id,body);
            let alumno = await Alumno.findById(id);
            res.json({
                actualizado:true,
                alumno
            })
        });
        this.app.delete('/alumno/:id', async function(req,res){
            const id = req.params.id;
            await Alumno.findByIdAndDelete(id);
            res.status(200).json({
                borrado:true
            })
        });
    }

    listen(){
        this.app.listen(port, function() { 
            console.log('Escuchando el puerto',port)});
    }
}

module.exports = Server;