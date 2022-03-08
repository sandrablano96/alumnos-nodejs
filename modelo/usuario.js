const mongoose = require('mongoose');
const UsuarioSchema = mongoose.Schema(
{
    nombre: {
        type:String,
        required: [true,'El nombre es obligatorio']
    }, 
    apellidos: {
        type:String,
        required: [true,'El apellido es obligatorio']
    }, 
    email: {
        type:String,
        required: [true,'El email es obligatorio']
    }, 
    password:{
        type:String,
        required: [true,'La contraseña es obligatoria']
    },
    google: {
        type: Boolean,
        default:true
    }
}
)

UsuarioSchema.methods.toJSON = function() {
    const { _id,...usuario} = this.toObject() ;
    usuario.id=_id;
    return usuario;
}

let Usuario = mongoose.model('Usuario',UsuarioSchema);
module.exports = Usuario;