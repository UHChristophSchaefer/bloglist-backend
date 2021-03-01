const blogsRouter = require('express').Router()
const jwt = require('jsonwebtoken')

const Blog = require('../models/blog')
const User = require('../models/user')


// GET
blogsRouter.get('/', async  (request, response) => {
  const blogs = await Blog
    .find({}).populate('user', { username: 1, name: 1 })

  response.json(blogs)
})

const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7)
  }
  return null
}

// POST
blogsRouter.post('/', async  (request, response) => {
  const body = request.body
  const token = getTokenFrom(request)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  if(!body.title || !body.url){
    response.status(400).end()
  }
  const user = await User.findById(decodedToken.id)

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes ? body.likes : 0,
    user: user._id
  })

  const savedBlog = await blog.save()
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()
  response.json(savedBlog)
})

// DELETE
blogsRouter.delete('/:id', async (request, response) => {
  await Blog.findByIdAndRemove(request.params.id)
  response.status(204).end()
})

// PUT
blogsRouter.put('/:id', async (request, response) => {
  const body = request.body

  const oldBlog = await Blog.findById(request.params.id)
  const updatedBlog = {
    title: body.title ? body.title : oldBlog.title,
    author: body.author ? body.author : oldBlog.author,
    url: body.url ? body.url : oldBlog.url,
    likes: body.likes ? body.likes : oldBlog.likes,
  }

  const blog = await Blog.findByIdAndUpdate(request.params.id, updatedBlog, { new: true })
  response.json(blog.toJSON())
})


module.exports = blogsRouter