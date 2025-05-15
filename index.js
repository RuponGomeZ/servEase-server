require('dotenv').config();
const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000
const app = express()


app.use(cors())
app.use(express.json())
// app.use(cookieParser())

console.log('Environment Variables Loaded:', {
    USERNAME: process.env.USERNAME ? '***' : 'Not found',
    PASSWORD: process.env.PASSWORD ? '***' : 'Not found'
});


const uri = `mongodb+srv://servease:uCwDbhoYq1NuxCgQ@cluster0.u6wg9.mongodb.net/ServEase?retryWrites=true&w=majority`;
// const uri = `mongodb+srv://${process.env.USERNAME}:${process.env.PASSWORD}@cluster0.u6wg9.mongodb.net/ServEase?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const db = client.db('ServEase')
        const serviceCollection = db.collection('services')


        app.post('/addService', async (req, res) => {
            const service = req.body
            const query = await serviceCollection.insertOne(service)
            res.send(query)
        })

        app.get('/services', async (req, res) => {
            const query = await serviceCollection.find().toArray()
            res.send(query)
        })

        app.get('/serviceDetails/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await serviceCollection.findOne(query)
            res.send(result)
        })


    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('Server is Running')
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})