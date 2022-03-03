const mongoose = require('mongoose');
const AlumnoSchema = mongoose.Schema(
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
    asignatura: {
        type:String,
    }, 
    imagen: {
        type:String,
    }, 
    google: {
        type: Boolean,
        default:true
    }
}
)

AlumnoSchema.methods.toJSON = function() {
    const { _id,...alumno} = this.toObject() ;
    alumno.id=_id;
    return alumno;
}

let Alumno = mongoose.model('Alumno',AlumnoSchema);
module.exports = Alumno;