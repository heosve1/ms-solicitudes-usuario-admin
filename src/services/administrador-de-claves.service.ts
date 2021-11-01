import { /* inject, */ BindingScope, injectable} from '@loopback/core';
var generatePassword = require('password-generator');
var CryptoJS = require('crypto-js');

@injectable({scope: BindingScope.TRANSIENT})
export class AdministradorDeClavesService {
  constructor(/* Add @inject to inject parameters */) { }

  /*
   * Add service methods here
   */

  GenerarClaveAleatoria() {
    let claveAleatoria = generatePassword(12, false);
    return claveAleatoria;
  }

  CifrarTexto(texto: string) {
    let textoCifrado = CryptoJS.MD5(texto).toString();
    return textoCifrado
  }
}
