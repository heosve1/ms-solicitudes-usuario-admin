import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {Configuraciones} from '../config/configuraciones';
import {NotificacionCorreo} from '../models';
const fetch = require("node-fetch")
@injectable({scope: BindingScope.TRANSIENT})
export class NotificacionesService {
  constructor(/* Add @inject to inject parameters */) { }

  /*
   * Add service methods here
   */

  EnviarCorreo(notificacion: NotificacionCorreo): Boolean {
    let url = `${Configuraciones.url_notificaciones_email}?correo_destino=${notificacion.destinatario}&asunto=${notificacion.asunto}&mensaje=${notificacion.mensaje}`;
    fetch(url)
      .then((data: any) => {
        return true;
      });
    return true
  }
}

