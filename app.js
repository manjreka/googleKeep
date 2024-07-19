const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const cors = require('cors')

const users = require('./models/userModels')
const Note = require('./models/notesModel')


const app = express()

app.use(bodyParser.json())
app.use(cors())

app.listen(3040, () => {
    console.log('server connected successfully to port 3040')
})

const database = 'mongodb+srv://ashwarya:ashwarya@cluster0.rjiv1wr.mongodb.net/CRUD_App?retryWrites=true&w=majority&appName=Cluster0'

const SECRETE_KEY = 'super_secrete_key'

mongoose.connect(database).then(() => {
    console.log('database got connected successfully!!')
})
    .catch((err) => {
        console.log('error while connecting database', err)
    })



//****************** */
//Authentication 

app.post('/register', async (req, res) => {
    try {
        const { email, username, password, confirmPassword } = req.body
        const hasedPassword = await bcrypt.hash(password, 10)
        const hasedConfirmPassword = await bcrypt.hash(confirmPassword, 10)
        const newUser = new users({ email, username, password: hasedPassword, confirmPassword: hasedConfirmPassword })

        console.log(newUser)

        if (password !== confirmPassword) {
           
            return res.status(401).json({ message: 'password not matching confirm password' })
           
        }

        await newUser.save()
        res.status(201).json({ message: 'user created sccessfully!!' })
        
    }
    catch (err) {
        res.status(500).json({ error: "error while signing up !!", err })
    }
})


app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body
        const user = await users.findOne({ username })
        if (!user) {
            res.status(401).json({ message: 'kindly register to login!!' })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid Credentials' })
        }

        const token = jwt.sign({ userID: user._id }, SECRETE_KEY, { expiresIn: '5hr' })

        return res.status(200).json({ meesage: 'login successfull!!', token })




    }
    catch (err) {
        return res.status(500).json({ message: 'Error while logging in', err })
    }
})


// create Note  // successfull
app.post('/notes', async (req, res) => {
    try {
        const { title, content, archived } = req.body

        const newNote = new Note({
            title, content, archived
        })
        await newNote.save()
        return res.status(201).send(newNote)

    }
    catch (err) {
        console.log(err)
        res.status(500).json({ error: "error while creating note !!", err })
    }
})

//update note // successfull 
app.patch('/notes/update/:id', async (req, res) => {
    try {
        const { id } = req.params
        console.log(req.body)
        const notes = await Note.findByIdAndUpdate(id, req.body, { new: true })
        if (!notes) {
            return res.status(400).json({ message: 'error while updating note' })
        }

        return res.status(200).send(notes)

    }
    catch (err) {
        return res.json({ message: 'error while updating note', err })
    }
})

// get all notes excluding those in trash and in archive  // successfull
app.get('/notes', async (req, res) => {
    try {
        const notes = await Note.find({ deletedAt: null, archived: false })
        res.status(200).send(notes)
        console.log(notes)
    }
    catch (err) {
        res.status(400).json({ error: 'error while fecthing data', err })
    }
})

// get notes based on user defined input // successfull
app.get('/notes/search', async (req, res) => {
    try {
        const { title } = req.query
        const note = await Note.find({ title: { $eq: title } })
       
        if (!note){
            return res.status(404).json({message: 'no relevant data!!'})
        }
        return res.status(200).send(note)
    }
    catch (err) {
        return res.status(404).json({ message: 'error while fetching user defined data' })
    }
})

//Archieve
// Get archived notes // successfull
app.get('/notes/archive', async (req, res) => {
    try {
        const archivedNotes = await Note.find({ archived: true })
        res.status(200).send(archivedNotes)
        console.log(res)
    }
    catch (err) {
        res.status(400).json({ error: 'error while fecthing data', err })
    }
})

// Move a note to archive // successfull
app.patch('/notes/:id/archive', async (req, res) => {
    const { id } = req.params
    try {
        const note = await Note.findByIdAndUpdate(id, { archived: true }, { new: true })
        if (!note) {
            return res.status(404).send()
        }
        res.send(note)
    }
    catch (err) {
        return res.status(404).json({ message: 'err while moving note to archive', err })
    }
})

// Restore a note from archive // successfull
app.patch('/notes/:id/archive/restore', async (req, res) => {
    try {
        const { id } = req.params
        const note = await Note.findByIdAndUpdate(id, { archived: false }, { new: true })
        if (!note) {
            res.status(404).json({ message: 'no such note' })
        }
        res.send(note)
    }
    catch (err) {
        return res.status(404).json({ messgae: 'err while restoring note back from archive', err })
    }
})


//TRASH
// Get trashed notes // successfull 
app.get('/notes/trash', async (req, res) => {
    try {
        const notes = await Note.find({ deletedAt: { $ne: null } })
        res.status(200).send(notes)
        console.log(notes)
    }
    catch (err) {
        res.status(400).json({ error: 'error while fecthing trash notes', err })
    }
})

// Move a note to trash  // successfull
app.delete('/notes/trash/:id', async (req, res) => {
    try {
        const { id } = req.params
        const today = Date.now()
        const note = await Note.findByIdAndUpdate(id, { deletedAt: today }, { new: true });
        if (!note) {
            return res.status(404).json({ message: 'note id doesnot exist!!' });
        }
        res.send(note);
    } catch (error) {
        res.status(400).json({ message: 'err while moving note in trash', err });
    }
});

// Restore a trashed note // successfull
app.patch('/notes/:id/trash/restore', async (req, res) => {
    try {
        const { id } = req.params
        const note = await Note.findByIdAndUpdate(req.params.id, { deletedAt: null }, { new: true });
        if (!note) {
            return res.status(404).json({ message: 'note id doesnot exist!!' });
        }
        res.send(note);
    } catch (error) {
        res.status(400).json({ message: 'err while restoring from trash' });
    }
});



// permanently delete note // successfull
app.delete('/notes/:id/permanent', async (req, res) => {
    try {
        const { id } = req.params
        const note = await Note.findByIdAndDelete(id)
        if (!note) {
            return res.status(404).json({ message: 'id doesnot exist!!' })
        }
        res.send(note)
    }
    catch (err) {
        return res.status(500).json({ message: 'error while deleting permanently', err })
    }
})

