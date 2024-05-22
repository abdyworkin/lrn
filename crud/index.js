const express = require('express')
const { todoRouter } = require('./routes/todoRouter')

const PORT = 3000

const app = express()

app.use(express.json())

app.use('/todo', todoRouter)

app.listen(PORT, () => console.log(`Server started on port ${PORT}`))