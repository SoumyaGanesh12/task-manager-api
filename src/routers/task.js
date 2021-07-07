const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

// app.post('/tasks', async (req, res) => {
// router.post('/tasks', async (req, res) => {
router.post('/tasks', auth, async (req, res) => {
    // const task = new Task(req.body)

    const task = new Task({
        ...req.body, // this will copy the description and commpleted values from request body into the task object
        owner: req.user._id
    })
    try{
        await task.save()
        res.status(201).send(task)
    }catch (e) {
        res.status(500).send(e)
    }
})

// router.get('/tasks', async (req, res) => {
// router.get('/tasks', auth, async (req, res) => {
    
//     try{
//         // const tasks = await Task.find({})
//         // const tasks = await Task.find({ owner: req.user._id}) // 1st approach
//         // const tasks = await req.user.populate('tasks').execPopulate() // 2nd approach
//         // res.send(tasks) 
//         // shorthand way of 2nd approach
//         await req.user.populate('tasks').execPopulate() // 2nd approach
//         res.send(req.user.tasks)
//     }catch (e){
//         res.status(500).send(e)
//     }

// })

// To apply filters to tasks /tasks will be the url to use
// GET {{url}}/tasks or GET {{url}}/tasks?completed=false or {{url}}/tasks?completed=true

// -----------------------------------------------------

// PAGINATION - for nabling pagination we use two options: limit and skip
// GET {{url}}/tasks?limit=10&skip=0 => limit is no.of docs shown at a time, skip if it is 0 it will show first 10 docs, if skip is 10 it will show page 2 ie, second 10 docs and so on
// GET {{url}}/tasks?limit=3&skip=3 => if there are 4 tasks, the fourth task will be shown as we are skipping the first page

// ------------------------------------------------------

// SORTING - to get the oldest or newest tasks in ascending or descending order
// GET {{url}}/tasks?sortBy=createdAt:desc or GET {{url}}/tasks?sortBy=createdAt_desc , for ascending use asc
// GET {{url}}/tasks?sortBy=description:desc - to sort alphabetically in reverse order

// ------------------------------------------------------
// multiple filters: GET {{url}}/tasks?sortBy=createdAt:desc&completed=true
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if(req.query.completed){ // if completed property is given as query inside url then we will add that to match, but req.query.completed returns a string value true/false not boolean value true/false
        match.completed = req.query.completed === 'true' // if string matches with 'true' then match.completed will get a boolean value true 
    }

    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':')
        // sort[parts[0]] = parts[1] === 'desc' ? -1 : 1    // -1: desc and 1:asc
        sort[parts[0]] = parts[1] // sort is an object but we can access object properties using brackets: example-
        // const myObj  = {
        //     name: "Adam"
        // }
        // console.log(myObj["name"]) // outputs "Adam"
    }
    
    try{
        await req.user.populate({
            path: 'tasks',
            match,                   // match: match instead of shorthand usage
            options: {
                limit: parseInt(req.query.limit), // limit: 2
                skip: parseInt(req.query.skip),
                sort
                // sort: {
                //     // createdAt: 1 // ascending = 1, descending = -1
                //     completed: 1  // -1: shows completed tasks and then incompleted tasks, 1: opposite
                // }
            }
            // match: {            // path has to match this condition
            //     completed: false // url(this is what internally happens): GET /tasks?completed=false
            // }
        }).execPopulate() // 2nd approach
        res.send(req.user.tasks)
    }catch (e){
        res.status(500).send(e)
    }

})

// router.get('/tasks/:id', async (req, res) => {
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try{
        // const task = await Task.findById(_id)
        const task = await Task.findOne({_id, owner: req.user._id}) // task associated with the currently logged in authenticated user who is also the owner of the task is what we have to find

        if(!task){
            res.status(404).send('Unable to find task') // if authenticated user and their task combo doesnot exist then this will be executed
        }
        res.send(task)
    }catch(e){
        res.status(500).send(e)
    }

})

// router.patch('/tasks/:id', async (req, res) => {

//     const updates = Object.keys(req.body)
//     const allowedUpdates = ["description", "completed"]
//     const isValidUpdate = updates.every((update) => allowedUpdates.includes(update))

//     if(!isValidUpdate){
//         res.status(404).send({ error : "Invalid Update!"})
//     }

//     try{
//         const task = await Task.findById(req.params.id)

//         updates.forEach((update) => task[update] = req.body[update])
//         await task.save()
//         //const task = await Task.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})

//         if(!task){
//             res.status(404).send('Unable to find the task')
//         }
//         res.send(task)
//     }catch (e){
//         res.status(400).send(e)
//     }
// })

router.patch('/tasks/:id', auth, async (req, res) => {

    const updates = Object.keys(req.body)
    const allowedUpdates = ["description", "completed"]
    const isValidUpdate = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidUpdate){
        res.status(404).send({ error : "Invalid Update!"})
    }

    try{
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id})

        if(!task){
            res.status(404).send('Unable to find the task')
        }

        updates.forEach((update) => task[update] = req.body[update])
        await task.save()
        res.send(task)
    }catch (e){
        res.status(400).send(e)
    }
})

// router.delete('/tasks/:id', async(req, res) => {
router.delete('/tasks/:id', auth, async(req, res) => {
    try{
        // const task = await Task.findByIdAndDelete(req.params.id)
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})

        if(!task){
            res.status(404).send({ error: "Invalid deletion!"})
        }

        res.send(task)
    }catch (e){
        res.status(500).send(e)
    }
})

module.exports = router