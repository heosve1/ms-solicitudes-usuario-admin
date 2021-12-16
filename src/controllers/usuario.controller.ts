import {service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del, get,
  getModelSchemaRef, param, patch, post, put, requestBody,
  response
} from '@loopback/rest';
import {Credenciales, CredencialesCambioClave, CredencialesRecuperarClave, NotificacionCorreo, Usuario} from '../models';
import {UsuarioRepository} from '../repositories';
import {AdministradorDeClavesService, NotificacionesService} from '../services';
import {SesionUsuariosService} from '../services/sesion-usuarios.service';
export class UsuarioController {
  constructor(
    @repository(UsuarioRepository)
    public usuarioRepository: UsuarioRepository,
    @service(AdministradorDeClavesService)
    public servicioClaves: AdministradorDeClavesService,
    @service(NotificacionesService)
    public servicioNotificaciones: NotificacionesService,
    @service(SesionUsuariosService)
    public servicioSesionUsuario: SesionUsuariosService
  ) { }

  @post('/usuarios')
  @response(200, {
    description: 'Usuario model instance',
    content: {'application/json': {schema: getModelSchemaRef(Usuario)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {
            title: 'NewUsuario',
            exclude: ['_id'],
          }),
        },
      },
    })
    usuario: Omit<Usuario, '_id'>,
  ): Promise<Usuario> {
    let clave = this.servicioClaves.GenerarClaveAleatoria();
    console.log(clave);
    //EN ESTE PUNTO SE NECESITA NOTIFICAR AL USUARIO POR MEDIO DE UN CORREO CUAL ES SU CLAVE NORMAL, ANTES DE CIFRARLA
    let notificacion = new NotificacionCorreo();
    notificacion.destinatario = usuario.correo;
    notificacion.asunto = "Registro en el sistema";
    notificacion.mensaje = `Hola ${usuario.nombre}<br /> Su clave de acceso al sistema es: ${clave} y su usuario es el correo electronico`
    this.servicioNotificaciones.EnviarCorreo(notificacion)
    //LA CLAVE CIFRADA ES PARA LA BASE DE DATOS, (como se descifra ? :P)
    let claveCifrada = this.servicioClaves.CifrarTexto(clave)
    console.log(claveCifrada)
    usuario.clave = claveCifrada
    return this.usuarioRepository.create(usuario);
  }

  @get('/usuarios/count')
  @response(200, {
    description: 'Usuario model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.count(where);
  }

  @get('/usuarios')
  @response(200, {
    description: 'Array of Usuario model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Usuario, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Usuario) filter?: Filter<Usuario>,
  ): Promise<Usuario[]> {
    return this.usuarioRepository.find(filter);
  }

  @patch('/usuarios')
  @response(200, {
    description: 'Usuario PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.updateAll(usuario, where);
  }

  @get('/usuarios/{id}')
  @response(200, {
    description: 'Usuario model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Usuario, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Usuario, {exclude: 'where'}) filter?: FilterExcludingWhere<Usuario>
  ): Promise<Usuario> {
    return this.usuarioRepository.findById(id, filter);
  }

  @patch('/usuarios/{id}')
  @response(204, {
    description: 'Usuario PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.updateById(id, usuario);
  }

  @put('/usuarios/{id}')
  @response(204, {
    description: 'Usuario PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.replaceById(id, usuario);
  }

  @del('/usuarios/{id}')
  @response(204, {
    description: 'Usuario DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.usuarioRepository.deleteById(id);
  }

  // -----SECCION DE SEGURIDAD------
  @post("/identificar-usuario", {
    responses: {
      '200': {
        description: "Identificación de usuarios"
      }
    }
  })
  async identificar(
    @requestBody() credenciales: Credenciales
  ): Promise<object> {
    let usuario = await this.servicioSesionUsuario.ValidarCredenciales(credenciales);
    let token = "";
    if (usuario) {
      usuario.clave = "";
      token = await this.servicioSesionUsuario.CrearToken(usuario);
    }
    return {
      tk: token,
      usuario: usuario
    };
  }

  @post("/recuperar-clave", {
    responses: {
      '200': {
        description: "Recuperación de clave de usuarios"
      }
    }
  })
  async recuperarClave(
    @requestBody() credenciales: CredencialesRecuperarClave
  ): Promise<Boolean> {
    let usuario = await this.usuarioRepository.findOne({
      where: {
        correo: credenciales.correo
      }
    });
    if (usuario) {
      let clave = this.servicioClaves.GenerarClaveAleatoria();
      console.log(clave)
      let claveCifrada = this.servicioClaves.CifrarTexto(clave);
      console.log(claveCifrada)
      usuario.clave = claveCifrada;
      await this.usuarioRepository.updateById(usuario._id, usuario);
      //CONSUMIR EL MS DE NOTIFICACIONES
      //ENVIAR LA NUEVA CLAVE POR SMS
      let notificacion = new NotificacionCorreo();
      notificacion.destinatario = usuario.correo;
      notificacion.asunto = "Registro en el sistema";
      notificacion.mensaje = `Hola ${usuario.nombre}<br /> su  nueva clave de acceso al sistema es: ${clave}`
      this.servicioNotificaciones.EnviarCorreo(notificacion)
      return true;
    }
    return false;
  }

  @post("/cambiar-clave", {
    responses: {
      '200': {
        description: "Cambio de clave de usuarios"
      }
    }
  })
  async cambiarClave(
    @requestBody() datos: CredencialesCambioClave
  ): Promise<Boolean> {
    let usuario = await this.usuarioRepository.findById(datos.id);
    if (usuario) {
      if (usuario.clave == datos.clave_actual) {
        usuario.clave = datos.nueva_clave;
        console.log(datos.nueva_clave);
        await this.usuarioRepository.updateById(datos.id, usuario)
        //ENVIAR UN CORREO AL USUARIO NOTIFICANDO EL CAMBIO DE CONTRASEÑA
        let notificacion = new NotificacionCorreo();
        notificacion.destinatario = usuario.correo;
        notificacion.asunto = "Cambio de clave";
        notificacion.mensaje = `Hola ${usuario.nombre}<br /> Su contraseña en el sistema ha sido modificada exitosamente`
        this.servicioNotificaciones.EnviarCorreo(notificacion)
        return true;
      } else {
        return false;
      }
    }
    return false;
  }
}
