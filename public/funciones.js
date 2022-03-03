//mostrar info
document.getElementById("abrirInsertar").addEventListener('click', abrirInsertar);
document.getElementById("cargarAlumnos").addEventListener('click', cargaAlumnos);

//acciones
document.getElementById("btnInsertar").addEventListener('click', insertaAlumno);
document.getElementById("btnActualizar").addEventListener('click', actualizaAlumno);


function abrirInsertar(){
    $("#myModal").modal('show');
    
    document.getElementById("btnInsertar").classList.remove("oculto");
    document.getElementById("btnActualizar").classList.add("oculto");
    document.getElementById("divId").classList.add("oculto");
    
    document.getElementById("nombre").value = "";
    document.getElementById("apellido").value = "";
    document.getElementById("asignatura").value = "";
}

function getAbsolutePath() {
    var loc = window.location;
    var pathName = loc.pathname.substring(0, loc.pathname.lastIndexOf('/') + 1);
    return loc.href.substring(0, loc.href.length - ((loc.pathname + loc.search + loc.hash).length - pathName.length));
}


function cargaAlumnos() {
    let tabla = document.getElementById("tablaAlumnos");
    fetch(getAbsolutePath()+'alumnos)
            .then(response => response.json())
            .then(json => {
                console.log(json);
                //bucle para eliminar todas las filas de la tabla
                while (tabla.firstChild) {
                    tabla.removeChild(tabla.firstChild);
                }
                let filaTitulos = document.createElement("tr");
                let columnaId = document.createElement("th");
                columnaId.textContent = "ID";
                let columnaNombre = document.createElement("th");
                columnaNombre.textContent = "NOMBRE";
                let columnaApellido = document.createElement("th");
                columnaApellido.textContent = "APELLIDO";
                let columnaAsig = document.createElement("th");
                columnaAsig.textContent = "ASIGNATURA";
                let gestion = document.createElement("th");
                gestion.textContent = "GESTION";
                gestion.colSpan="2";
                gestion.style.textAlign = "center";
                filaTitulos.appendChild(columnaId);
                filaTitulos.appendChild(columnaNombre);
                filaTitulos.appendChild(columnaApellido);
                filaTitulos.appendChild(columnaAsig);
                filaTitulos.appendChild(gestion);
                tabla.appendChild(filaTitulos);
                
                for (i = 0; i <= json.length; i++) {
                    
                    let fila = document.createElement("tr");
                    let celdaId = document.createElement("td");
                    celdaId.textContent = json[i].id;
                    let celdaNombre = document.createElement("td");
                    celdaNombre.textContent = json[i].nombre;
                    let celdaApellido = document.createElement("td");
                    celdaApellido.textContent = json[i].apellido;
                    let celdaAsignatura = document.createElement("td");
                    celdaAsignatura.textContent = json[i].asignatura;

                    let celdaActualizar = document.createElement("td");
                    let botonActualizar = document.createElement("button");
                    botonActualizar.setAttribute("onclick", "cargaAlumnoPorId(" + json[i].id + ")");
                    celdaActualizar.appendChild(botonActualizar);
                    botonActualizar.textContent = "Actualizar";
                    
                    let celdaBorrar = document.createElement("td");
                    let botonBorrar = document.createElement("button");
                    botonBorrar.setAttribute("onclick", "borraAlumnoPorId(" + json[i].id + ")");
                    celdaBorrar.appendChild(botonBorrar);
                    botonBorrar.textContent = "Borrar";

                    fila.appendChild(celdaId);
                    fila.appendChild(celdaNombre);
                    fila.appendChild(celdaApellido);
                    fila.appendChild(celdaAsignatura);
                    fila.appendChild(celdaBorrar);
                    fila.appendChild(celdaActualizar);

                    tabla.appendChild(fila);
                    


                }//fin de for
            })
}

function cargaAlumnoPorId(id) {
    fetch(getAbsolutePath()+'alumno/' + id)
            .then(response => response.json())
            .then(json => {
                console.log(json);
                document.getElementById("formulario").style.display = "block";
                document.getElementById("id").value = json.id;
                document.getElementById("nombre").value = json.nombre;
                document.getElementById("apellido").value = json.apellido;
                document.getElementById("asignatura").value = json.asignatura;
            })
    $("#myModal").modal('show');
    document.getElementById("btnInsertar").classList.add("oculto");
    document.getElementById("btnActualizar").classList.remove("oculto");
    document.getElementById("divId").classList.remove("oculto");
    
}

function actualizaAlumno() {
    let id = document.getElementById("id").value;
    fetch(getAbsolutePath()+'alumno/' +id, {
        method: 'PUT',
        body: JSON.stringify({
            nombre: document.getElementById("nombre").value,
            apellido: document.getElementById("apellido").value,
            asignatura: document.getElementById("asignatura").value,
        }),
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
        },
    })
            .then((response) => response.json())
            .then((json) => console.log(json));
    cargaAlumnos();
}

function insertaAlumno() {
    fetch(getAbsolutePath()+'alumno/', {
        method: 'POST',
        body: JSON.stringify({
            nombre: document.getElementById("nombre").value,
            apellido: document.getElementById("apellido").value,
            asignatura: document.getElementById("asignatura").value,
        }),
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
        },
    })
            .then((response) => response.json())
            .then((json) => console.log(json));
            cargaAlumnos();
}


function borraAlumnoPorId(id) {
    fetch(getAbsolutePath()+'alumno/' + id, {
        method: 'DELETE',
    });
    cargaAlumnos();
    
}

