import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  Rol,
  Usuario,
} from '../models';
import {RolRepository} from '../repositories';

export class RolUsuarioController {
  constructor(
    @repository(RolRepository) protected rolRepository: RolRepository,
  ) { }

  @get('/rols/{_id}/usuarios', {
    responses: {
      '200': {
        description: 'Array of Rol has many Usuario',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Usuario)},
          },
        },
      },
    },
  })
  async find(
    @param.path.string('_id') _id: string,
    @param.query.object('filter') filter?: Filter<Usuario>,
  ): Promise<Usuario[]> {
    return this.rolRepository.esta_asociado(_id).find(filter);
  }

  @post('/rols/{_id}/usuarios', {
    responses: {
      '200': {
        description: 'Rol model instance',
        content: {'application/json': {schema: getModelSchemaRef(Usuario)}},
      },
    },
  })
  async create(
    @param.path.string('_id') _id: typeof Rol.prototype._id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {
            title: 'NewUsuarioInRol',
            exclude: ['_id'],
            optional: ['id_rol']
          }),
        },
      },
    }) usuario: Omit<Usuario, '_id'>,
  ): Promise<Usuario> {
    return this.rolRepository.esta_asociado(_id).create(usuario);
  }

  @patch('/rols/{_id}/usuarios', {
    responses: {
      '200': {
        description: 'Rol.Usuario PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.string('_id') _id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Partial<Usuario>,
    @param.query.object('where', getWhereSchemaFor(Usuario)) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.rolRepository.esta_asociado(_id).patch(usuario, where);
  }

  @del('/rols/{_id}/usuarios', {
    responses: {
      '200': {
        description: 'Rol.Usuario DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('_id')_id: string,
    @param.query.object('where', getWhereSchemaFor(Usuario)) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.rolRepository.esta_asociado(_id).delete(where);
  }
}
