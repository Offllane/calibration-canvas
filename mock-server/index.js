const express = require('express')
const fs = require('fs/promises')
const cors = require('cors')
const path = require('path')

const app = express()
const port = 4000

app.use(cors())

const getImageFetch = async () => {
  try {
    const imageName = 'frame-test1.jpg'
    const imagePath = path.join(__dirname, imageName)
    const buffer = await fs.readFile(imagePath)

    return buffer
  } catch (error) {
    console.error(error)
    throw new Error('Error reading image file')
  }
}

app.get('/getImage', async (req, res) => {
  try {
    const buffer = await getImageFetch()
    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'Content-Length': buffer.byteLength
    });
    res.end(Buffer.from(buffer))
  } catch (error) {
    console.error(error)
    res.status(500).send('Internal Server Error')
  }
})

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})