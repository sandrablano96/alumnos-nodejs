const express = require('express');
require('dotenv').config();
const { dbConnection } = require('../database/config')
const {validationResult, check} = require('express-validator');
const Alumno = require('./alumno');
const Usuario = require('./usuario');
const port = process.env.PORT;
const bcryptjs = require('bcryptjs');

const { OAuth2Client } = require('google-auth-library');
const fileUpload = require('express-fileupload');
const { generarJWT } = require('../helpers/generarJWT')
const { validarJWT } = require('../middleware/validar-JWT');
const { v4: uuidv4 } = require('uuid');

var options = {
    index: "login.html"
  };
  
class Server{
    
    constructor(){
        this.app = express();
        this.conectarDB();
        this.middlewares();
        this.rutas();
    }

    middlewares(){
        this.app.use(express.json());
        this.app.use(express.static('public', options));
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
                let usuario = await Usuario.findOne({ email });
                const salt = bcryptjs.genSaltSync();
                if (!usuario) {
                    let data = {
                        nombre,
                        apellidos,
                        email,
                        password: bcryptjs.hashSync("1234", salt),
                        google: true,
                    }
                    console.log('Nuevo usuario:', data);
                    usuario = new Usuario(data);
                    await usuario.save();
                    console.log('creado', usuario)
                }
                const tokenGenerado = await generarJWT(usuario.id);
                res.json({
                    msg: "Todo bien con google",
                    token:tokenGenerado,
                    usuario
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
            check('password', 'La contrase??a es obligatoria').not().isEmpty(),
            async function (req, res) {
                const erroresVal = validationResult(req);
                if (!erroresVal.isEmpty()) {
                    return res.status(400).json({ msg: erroresVal.array() });
                }
                const { email, password } = req.body;
                try {
                    //verificar si existe
                    const usuario = await Usuario.findOne({ email });
                    if (!usuario) {
                        res.status(400).json({
                            msg: "El correo no existe",
                            email
                        })
                    } else {
                        const validPassword = bcryptjs.compareSync(password, usuario.password);
                        if (!validPassword) {
                            res.status(400).json({
                                msg: "El password no es correcto"
                            })
                        } else {
                            const token = await generarJWT(usuario.id);
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
        /*this.app.post('/alumno',
        check('nombre', 'El nombre es obligatorio').not().isEmpty(),
        check('apellidos', 'El apellido es obligatorio').not().isEmpty(),
        check('email', 'El email es obligatorio').isEmail().not().isEmpty(),
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
        */
        this.app.put('/alumno/:id',
        check('nombre', 'El nombre es obligatorio').not().isEmpty(),
        check('apellido', 'El apellido es obligatorio').not().isEmpty(),validarJWT, 
        async function(req,res){
            if (!req.files ){
                res.status(400).json({
                  msg: "no se han mandado archivos"    
                });
              }
             
              //esperamos un archivo con el nombre de 'archivo'
              //SI SE HA ENVIADO ARCHIVO
              if (!req.files.imagen ){
                res.status(400).json({
                  msg: "no se han mandado 'imagen'"    
                });
              } else {
                console.log("dentro");
                const  { imagen } = req.files;
                const nombreCortado = imagen.name.split(".");
                const extension = nombreCortado[nombreCortado.length -1];
                //validar la extensi??n
                const extensionesValidas = ['jpg','jpeg','png','PNG'];
                if ( !extensionesValidas.includes(extension)){
                  return res.status(400).json({
                    msg: `La extensi??n ${extension} no est?? permitida ${extensionesValidas}`
                  })
                }
                const nombreTemporal = uuidv4() +'.' + extension;
                const nombre = req.body.nombre;
                const apellidos = req.body.apellidos;
                const email = req.body.email;
                const asignatura = req.body.asignatura;
                let nuevosDatos = {nombre,apellidos,email, asignatura, imagen:nombreTemporal};
                const id = req.params.id;
                await Alumno.findByIdAndUpdate(id, nuevosDatos);
                let alumno = await Alumno.findById(id);
                const path = require('path');
                const uploadPath = path.join(__dirname,'../public/img',nombreTemporal);
                imagen.mv(uploadPath, function(err){
                  if ( err ) {
                    return res.status(500).json(err);
                  }
                  res.status(200).json({
                    msg:'Subido correctamente',
                    alumno
                  
                  })
                }); //SI se ha enviado 'archivo'
                
              }
        });
        this.app.delete('/alumno/:id',validarJWT, async function(req,res){
            const id = req.params.id;
            await Alumno.findByIdAndDelete(id);
            res.status(200).json({
                borrado:true
            })
        });
    
/*
    this.app.post("/subir",validarJWT, async function (req, res) {
        if (!req.files) {
            res.status(400).json({
                msg: "No se ha seleccionado un archivo"
            });
            return;
        }
        if (!req.files.imagen) {
            res.status(400).json({
                msg: "No se ha seleccionado un archivo con nombre 'imagen'"
            });
        } else {
            const imagen = req.files.imagen;
            let path = require('path');
            const nombreCortado = imagen.name.split('.');
            const extension = nombreCortado[nombreCortado.length - 1];
            const extensionesValidas = ['jpg', 'png', 'jpeg', 'PNG', 'png'];
            if (!extensionesValidas.includes(extension)) {
                return res.status(400).json({
                    msg: `La extension ${extension} no es valida`
                })
            }
            let uploadPath = path.join(__dirname, '../img', imagen.name);
            imagen.mv(uploadPath, async function (err) {
                if (err) {
                    return res.status(500).send(err);
                }
                res.json({msg:'Subido correctamente'});
            });
        }
    });
*/
    this.app.post(
        "/subir2",
        async function (req, res) {
          if (!req.files ){
            res.status(400).json({
              msg: "no se han mandado archivos"    
            });
          }
         
          //esperamos un archivo con el nombre de 'archivo'
          //SI SE HA ENVIADO ARCHIVO
          if (!req.files.imagen ){
            res.status(400).json({
              msg: "no se han mandado 'imagen'"    
            });
          } else { //SI se ha enviado 'archivo'
            console.log("dentro")
            const  { imagen } = req.files;
            const nombreCortado = imagen.name.split(".");
            const extension = nombreCortado[nombreCortado.length -1];
            //validar la extensi??n
            const extensionesValidas = ['jpg','jpeg','png','PNG'];
            if ( !extensionesValidas.includes(extension)){
              return res.status(400).json({
                msg: `La extensi??n ${extension} no est?? permitida ${extensionesValidas}`
              })
            }
            const nombreTemporal = uuidv4() +'.' + extension;
            //una vez que tiene el nombre del archivo temporal crea el objeto producto y lo guarda
            const nombre = req.body.nombre;
            const apellidos = req.body.apellidos;
            const email = req.body.email;
            const asignatura = req.body.asignatura;
            let alumnoNuevo = new Alumno();
            alumnoNuevo.nombre = nombre;
            alumnoNuevo.apellidos = apellidos;
            alumnoNuevo.email = email;
            alumnoNuevo.asignatura = asignatura;
            alumnoNuevo.imagen = nombreTemporal;
            alumnoNuevo.save();
            console.log(alumnoNuevo)
            //FIN DE LO QUE SE HA A??ADIDO A LA RUTA SUBIR
            const path = require('path');
            const uploadPath = path.join(__dirname,'../public/img',nombreTemporal);
            imagen.mv(uploadPath, function(err){
              if ( err ) {
                return res.status(500).json(err);
              }
              res.status(200).json({
                msg:'Subido correctamente',
                alumnoNuevo
              
              })
            })
   
          }
        })
  
}
    listen(){
        this.app.listen(port, function() { 
            console.log('Escuchando el puerto',port)});
    }
}

module.exports = Server;