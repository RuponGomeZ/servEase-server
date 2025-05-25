const jwt = require('jsonwebtoken');
require('dotenv').config();
const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000
const app = express()

const corsOption = {
    origin: [
        'http://localhost:5173',
        'https://servease-2ccfe.web.app',
        'https://servease-2ccfe.firebaseapp.com',
        'https://voluble-starship-91514c.netlify.app',
    ],

    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
};


const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(cors(corsOption))
app.use(express.json())
app.use(cookieParser())




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


const verifyToken = (req, res, next) => {
    const token = req.cookies?.token
    if (!token) return res.status(401).send({ message: 'unauthorized access' })
    // console.log('JWT Secret:', process.env.ACCESS_TOKEN_SECRET?.slice(0, 10));
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user = decoded
        next()
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const db = client.db('ServEase')
        const serviceCollection = db.collection('services')
        const serviceOrderCollection = db.collection('serviceOrders')


        app.post('/jwt', async (req, res) => {
            const email = req.body

            const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '365d',
            })
            res.cookie('token', token, {
                httpOnly: true,
                secure: true, // Ensure this is always true in production
                sameSite: 'none',
            })
                .send({ success: true })
        })

        // clear cookie from browser
        app.get('/logout', async (req, res) => {
            res.clearCookie('token', {
                secure: true, // Ensure this is always true in production
                sameSite: 'none',
            })
                .send({ success: true })
        })

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

        app.post('/bookService', async (req, res) => {

            const order = req.body
            const result = await serviceOrderCollection.insertOne(order)
            res.send(result)
        })

        app.get('/bookService/:email', verifyToken, async (req, res) => {
            const email = req.params.email
            const decodedEmail = req.user?.email
            if (decodedEmail !== email) {
                return res.status(401).send({ message: 'unauthorized access' });
            }
            const query = { userEmail: email }
            const result = await serviceOrderCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/servicesToDo/:email', verifyToken, async (req, res) => {
            const email = req.params.email
            console.log(email);
            const decodedEmail = req.user?.email
            if (decodedEmail !== email) return res.status(401).send({ message: 'unauthorized access' })
            const query = { serviceProviderEmail: decodedEmail }
            const result = await serviceOrderCollection.find(query).toArray()
            res.send(result)
        })

        app.patch('/serviceToDo/changeStatus/:id', async (req, res) => {
            const id = req.params.id
            const data = req.body
            const query = { _id: new ObjectId(id) }
            const update = {
                $set: { ...data }
            }
            const result = await serviceOrderCollection.updateOne(query, update)
            res.send(result)
        })

        app.get('/manageService/:email', async (req, res) => {
            const email = req.params.email
            const query = { serviceProviderEmail: email }
            const result = await serviceCollection.find(query).toArray()
            res.send(result)
        })

        app.delete('/manageService/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await serviceCollection.deleteOne(query)
            res.send(result)
        })

        app.patch('/editService/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body
            const query = { _id: new ObjectId(id) }
            const update = {
                $set: { ...data }
            }
            const result = await serviceCollection.updateOne(query, update)
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