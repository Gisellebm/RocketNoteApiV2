const knex = require('../databse/knex')
const AppError = require('../utils/AppError')
const { compare } = require('bcryptjs')

const authConfig = require('../configs/auth')
const { sign } = require('jsonwebtoken')

class SessionsController {
    async create( request, response ) {
        const { email, password } = request.body

        const user = await knex('users').where({ email }).first()

        // Verifica se o usuário existe
        if (!user) {
            throw new AppError('E-mail ou senha inválidos', 401)
        }

        const passwordMatched = await compare(password, user.password)
        
        // Verifica se a senha esta correta
        if (!passwordMatched) {
            throw new AppError('E-mail ou senha inválidos', 401)
        }

        const { secret, expiresIn } = authConfig.jwt
        const token = sign({}, secret, {
            subject: String(user.id),
            expiresIn
        })
        
        return response.json({ user, token })
    }
}

module.exports = SessionsController