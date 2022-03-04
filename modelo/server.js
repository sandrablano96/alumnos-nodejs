const express = require('express');
require('dotenv').config();
const { dbConnection } = require('../database/config')
const {validationResult, check} = require('express-validator');
const Alumno = require('./alumno');
const port = process.env.PORT;
const bcryptjs = require('bcryptjs');

const { OAuth2Client } = require('google-auth-library');
const fileUpload = require('express-fileupload');
const { generarJWT } = require('../helpers/generarJWT')
const { validarJWT } = require('../middleware/validar-JWT');

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
        this.app.use(fileUpload({
            useTempFiles: true,
            tempFileDir: '/tmp/'
        }));
    }

    async conectarDB(){
        await dbConnection();
    }

    rutas(){
        this.app.post('/logingoogle',check('id_token', 'id_token es necesario').not().isEmpty(), async function(req,res){
            const erroresVal = validationResult(req);
                if (!erroresVal.isEmpty()) {
                    return res.status(400).json({ msg: erroresVal.array() });
            }

            try{
                const {id_token} = req.body;
                const client = new OAuth2Client(process.env.GOOGLE_ID_CLIENTE);
                const ticket = await client.verifyIdToken({
                    idToken: id_token,
                    audience: process.env.GOOGLE_ID_CLIENTE
                });
                const payload = ticket.getPayload();
                console.log(payload);
                const email = payload.email;
                const nombre = payload.given_name;
                const apellidos = payload.family_name;
                let alumno = await Alumno.findOne({ email });
                const salt = bcryptjs.genSaltSync();
                if (!alumno) {
                    let data = {
                        nombre,
                        apellidos,
                        email,
                        password: bcryptjs.hashSync("1234", salt),
                        asignatura: "todas",
                        google: true,
                    }
                    console.log('Nuevo alumno:', data);
                    alumno = new Alumno(data);
                    await alumno.save();
                    console.log('creado', alumno)
                }
                const tokenGenerado = await generarJWT(alumno.id);
                res.json({
                    msg: "Todo bien con google",
                    token:tokenGenerado,
                    alumno
                })
            } catch(error){
                res.json({
                    msg: "Error de verificacion",
                    error
                })
            }
        });

        this.app.post('/login',
            check('email', 'El correo no es valido').isEmail(),
            check('password', 'La contraseña es obligatoria').not().isEmpty(),
            async function (req, res) {
                const erroresVal = validationResult(req);
                if (!erroresVal.isEmpty()) {
                    return res.status(400).json({ msg: erroresVal.array() });
                }
                const { email, password } = req.body;
                try {
                    //verificar si existe
                    const alumno = await Alumno.findOne({ email });
                    if (!alumno) {
                        res.status(400).json({
                            msg: "El correo no existe",
                            email
                        })
                    } else {
                        const validPassword = bcryptjs.compareSync(password, alumno.password);
                        if (!validPassword) {
                            res.status(400).json({
                                msg: "El password no es correcto"
                            })
                        } else {
                            const token = await generarJWT(alumno.id);
                            res.json({
                                msg: "Login ok",
                                token
                            })
                        }
                    }
                } catch (error) {
                    console.log(error);
                    res.status(500).json({
                        msg: "Error de autentificacion"
                    })
                }

            })

        this.app.get('/alumnos',validarJWT, async function(req,res){
            let alumnos = await Alumno.find();
            res.json(alumnos);
                
        })
        this.app.get('/alumno/:id',validarJWT,async function(req,res){
            const id = req.params.id;
            let alumno = await Alumno.findById(id);
            res.json(alumno);
        })
        this.app.post('/alumno',
        check('nombre', 'El nombre es obligatorio').not().isEmpty(),
        check('apellidos', 'El apellido es obligatorio').not().isEmpty(),
        check('email', 'El email es obligatorio').isEmail().not().isEmpty(),
        check('password', 'La contraseña es obligatoria').not().isEmpty(),
         async function(req,res){
            
            const body = req.body;
            
            const errorVal = validationResult(req);

            if(!errorVal.isEmpty()){
                return res.status(400).json({"msg": errorVal.array()})
                //"msg":errorVal.array(); devuelve informacion de los errores
            } 
            let alumno = new Alumno();
            const salt = bcryptjs.genSaltSync();
            alumno.nombre = body.nombre;
            alumno.apellidos = body.apellidos;
            alumno.email = body.email;
            alumno.asignatura = body.asignatura;
            alumno.password = bcryptjs.hashSync(body.password, salt)
            alumno.save();
            res.json({
                insertado:true,
                alumno
            })
        });
        this.app.put('/alumno/:id',
        check('nombre', 'El nombre es obligatorio').not().isEmpty(),
        check('apellido', 'El apellido es obligatorio').not().isEmpty(),validarJWT, 
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
        this.app.delete('/alumno/:id',validarJWT, async function(req,res){
            const id = req.params.id;
            await Alumno.findByIdAndDelete(id);
            res.status(200).json({
                borrado:true
            })
        });
    

    this.app.post("/subir", async function (req, res) {
        if (!req.files) {
            res.status(400).json({
                msg: "No se ha seleccionado un archivo"
            });
            return;
        }
        //esperamos un archivo con el nombre archivo
        if (!req.files.imagen) {
            res.status(400).json({
                msg: "No se ha seleccionado un archivo con nombre 'archivo'"
            });
        } else {
            const imagen = req.files.imagen;
            let path = require('path');
            const nombreCortado = imagen.name.split('.');
            const extension = nombreCortado[nombreCortado.length - 1];
            const extensionesValidas = ['jpg', 'png', 'jpeg'];
            if (!extensionesValidas.includes(extension)) {
                return res.status(400).json({
                    msg: `La extension ${extension} no es valida`
                })
            }
            let uploadPath = path.join(__dirname, '../img', imagen.name);
            imagen.mv(uploadPath, function (err) {
                if (err) {
                    return res.status(500).send(err);
                }
                res.send('Subido correctamente');
            });
        }
    });
}
    listen(){
        this.app.listen(port, function() { 
            console.log('Escuchando el puerto',port)});
    }
}

module.exports = Server;