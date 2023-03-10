const express = require("express");
const app = express();
const PORT = process.env.PORT_ONE || 4002;
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const user = require('./user')

const uri = "mongodb://localhost:27017/auth-service"
mongoose.set('strictQuery', true);
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('auth-service db connected successfully'))
    .catch(err => console.log(err))

app.use(express.json())


app.post('/auth/register', async (req, res) => {
    let { name, email, password } = req.body;
    const userExist = await user.findOne({ email });
    if (userExist) {
        return res.status(201).json({
            message: 'This user already exist'
        })
    } else {
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                return res.status(500).json({
                    error: err
                })
            } else {
                password = hash
                const newUser = new user({
                    name,
                    email,
                    password
                });
            }
            newUser.save()
                .then(util => res.status(201).json(util))
                .catch(err => res.status(500).json(err))
        })
    }
})

app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await user.findOne({ email });
    if (!user) {
        return res.json({ message: "user introuvable" });
    } else {
        bcrypt.compare(password,
            user.password).then(resultat => {
                if (!resultat) {
                    return res.json({ message: "Incorrect password" });
                }
                else {
                    const payload = {
                        email,
                        name: user.name
                    };
                    jwt.sign(payload, "secret", (err,
                        token) => {
                        if (err) console.log(err);
                        else {
                            process.env.token = token.toString();
                            return res.json({
                                token:
                                    token,
                            });
                        }
                    });
                }
            });
    }
});

app.listen(PORT, () => {
    console.log(`app listening on port ${PORT}`)
})