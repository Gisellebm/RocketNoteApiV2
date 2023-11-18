const knex = require("../databse/knex")

class NotesController {
    async create(request, response) {
        const { title, description, tags, links } = request.body
        const user_id = request.user.id

        const [note_id] = await knex("notes").insert({
            title,
            description,
            user_id
        })

        const linksInsert = links.map(link => {
            return {
                note_id,
                url: link
            }
        })

        await knex("links").insert(linksInsert)

        const tagsInsert = tags.map(name => {
            return {
                note_id,
                name,
                user_id
            }
        })

        await knex("tags").insert(tagsInsert)

        return response.json()
    }   

    async show(request, response) {
        const { id } = request.params

        const note = await knex("notes").where({ id }).first()
        const tags = await knex("tags").where({ note_id: id }).orderBy("name")
        const links = await knex("links").where({ note_id: id }).orderBy("created_at")

        return response.json({
            ...note,
            tags,
            links
        })
    }

    async delete(request, response) {
        const { id } = request.params

        await knex("notes").where({ id }).delete()

        return response.json()
    }

    async index(request, response) {
        const { title, tags } = request.query
        const user_id = request.user.id

        let notes

        if (tags) { // Se tiver tags
            const filterTags = tags.split(",").map(tag => tag.trim()) // Separa as tags em um array e remove os espaços em brancos
            notes = await knex("tags") // Seleciona as tags
                .select([ // Seleciona as colunas note_id e name da tabela tags e inner join com a tabela notes e seleciona as colunas id, title e user_id da tabela notes e ordena por title em ordem ascendente 
                    "notes.id",
                    "notes.title",
                    "notes.user_id",
                ])
                .where("notes.user_id", user_id) // Filtra pelo user_id passado na rota 
                .whereLike("notes.title", `%${title}%`) // Filtra pelo título passado na rota 
                .whereIn("name", filterTags) // Filtra pelo nome das tags passadas na rota 
                .innerJoin("notes", "notes.id", "tags.note_id") // Inner join com a tabela notes e seleciona as colunas id, title e user_id da tabela notes e ordena por title em ordem ascendente 
                .orderBy("notes.title")
        } else { // Se não tiver tags 
            notes = await knex("notes") // Seleciona as colunas id, title e user_id da tabela notes e ordena por title em ordem ascendente 
                .where({ user_id }) // Filtra pelo user_id passado na rota 
                .whereLike("title", `%${title}%`) // Filtra pelo título passado na rota 
                .orderBy("title") // Ordena por title em ordem ascendente 
        }

        const userTags = await knex("tags").where({ user_id }) // Seleciona as tags do usuário passado na rota 
        const notesWithTags = notes.map(note => { // Cria um novo array com as notas filtradas e as tags e links associadas a elas 
            const noteTags = userTags.filter(tag => tag.note_id === note.id) // Seleciona as tags associadas a cada nota e filtra pelo id da nota passada na rota 

            return { // Retorna as notas filtradas e as tags e links associadas a elas 
                ...note, // Retorna as colunas id, title e user_id da tabela notes
                tags: noteTags // Retorna as tags associadas a cada nota e filtra pelo id da nota passada na rota 
            }
        })

        return response.json(notesWithTags) // Retorna as notas filtradas e as tags e links associadas a elas  
    }
}

module.exports = NotesController